import { ApiError, NetworkError, type ApiOptions } from "./types";
import { API_CONFIG } from "./config";

export class BaseApiService {
    private readonly baseUrl: string;
    private readonly defaultTimeout: number;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.defaultTimeout = API_CONFIG.DEFAULT_TIMEOUT;
    }

    protected async fetchWithTimeout(
        endpoint: string,
        options: RequestInit & { timeoutMs?: number } = {}
    ): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            options.timeoutMs ?? this.defaultTimeout
        );

        try {
            const url = endpoint.startsWith("http")
                ? endpoint
                : `${this.baseUrl}${endpoint}`;

            const response = await fetch(url, {
                ...options,
                signal: options.signal ?? controller.signal,
            });

            if (!response.ok) {
                throw new ApiError(
                    `API request failed: ${response.status} ${response.statusText}`,
                    response.status,
                    response
                );
            }

            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            if (error instanceof DOMException && error.name === "AbortError") {
                throw new NetworkError("Request timeout");
            }

            throw new NetworkError(
                `Network request failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                error instanceof Error ? error : undefined
            );
        } finally {
            clearTimeout(timeout);
        }
    }

    protected async get<T>(
        endpoint: string,
        options: ApiOptions = {}
    ): Promise<T> {
        const response = await this.fetchWithTimeout(endpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            timeoutMs: options.timeoutMs,
            signal: options.signal,
        });

        try {
            return (await response.json()) as T;
        } catch (error) {
            throw new ApiError(
                `Failed to parse response as JSON: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    protected async post<T>(
        endpoint: string,
        body: unknown,
        options: ApiOptions = {}
    ): Promise<T> {
        const response = await this.fetchWithTimeout(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            timeoutMs: options.timeoutMs,
            signal: options.signal,
        });

        try {
            return (await response.json()) as T;
        } catch (error) {
            throw new ApiError(
                `Failed to parse response as JSON: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    protected buildUrl(
        endpoint: string,
        params?: Record<string, string | number>
    ): string {
        const cleanEndpoint = endpoint.startsWith("/")
            ? endpoint.slice(1)
            : endpoint;
        const url = new URL(
            cleanEndpoint,
            this.baseUrl.endsWith("/") ? this.baseUrl : this.baseUrl + "/"
        );

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        return url.toString();
    }
}
