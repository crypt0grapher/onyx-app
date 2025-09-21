import { BaseApiService } from "../base";
import { POINTS_CONFIG } from "../config";

export type LeaderboardItem = {
    id: string;
    address: string;
    points: number;
};

export type LeaderboardMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type LeaderboardResponse = {
    results: LeaderboardItem[];
    meta: LeaderboardMeta;
};

export type UserInfoResponse = {
    id: string;
    address: string;
    points: number | string;
};

export type GetSignedMessageResponse = {
    nonce: string;
    timestamp: number;
};

export class PointsApiService extends BaseApiService {
    constructor() {
        super(POINTS_CONFIG.BASE_URL);
    }

    async getLeaderboard(params: {
        page: number;
        limit: number;
    }): Promise<LeaderboardResponse> {
        const url = this.buildUrl("passive-points/leaderboard", {
            page: params.page,
            limit: params.limit,
        });
        const response = await this.get<{
            data: { results: LeaderboardItem[]; meta: LeaderboardMeta };
            status?: boolean;
        }>(url);
        return {
            results: response.data.results || [],
            meta: response.data.meta,
        };
    }

    async getUserInfo(address: string): Promise<UserInfoResponse | null> {
        try {
            const url = this.buildUrl(`users/${address}`);
            const response = await this.get<{ data?: UserInfoResponse }>(url);
            const user = response?.data;
            if (!user) return null;
            return {
                ...user,
                points:
                    typeof user.points === "string"
                        ? parseFloat(user.points)
                        : user.points,
            };
        } catch {
            return null;
        }
    }

    async getSignedMessage(
        address: string
    ): Promise<{ signedMessage: string }> {
        const url = this.buildUrl(`users/generate-nonce/${address}`);
        const response = await this.get<{ data: GetSignedMessageResponse }>(
            url
        );
        const { nonce, timestamp } = response.data;
        const signedMessage = `Please sign to confirm the ownership of the wallet.\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
        return { signedMessage };
    }

    async verifySignature(params: {
        signedMessage: string;
        signature: string;
        address: string;
    }): Promise<boolean> {
        const url = this.buildUrl("users/verify-signature");
        await this.post(url, params);
        return true;
    }
}

export class PointsSubsquidService extends BaseApiService {
    constructor() {
        super(POINTS_CONFIG.SUBSQUID_URL);
    }

    async getUserPoints(address: string): Promise<{
        id: string;
        address: string;
        points: number;
    }> {
        const query = `
          query userPointsQuery($id: String!) {
            user:userById(id: $id) {
              id
              address:id
              points
            }
          }
        `;

        try {
            const firstTry = await this.post<{
                data: {
                    user?: { id: string; address: string; points: number };
                };
            }>("", { query, variables: { id: address } });

            if (firstTry.data?.user) {
                return firstTry.data.user;
            }

            const secondTry = await this.post<{
                data: {
                    user?: { id: string; address: string; points: number };
                };
            }>("", { query, variables: { id: address.toLowerCase() } });

            return secondTry.data.user || { id: address, address, points: 0 };
        } catch (error) {
            console.error("[PointsSubsquidService] getUserPoints error", error);
            return { id: address, address, points: 0 };
        }
    }

    async getPointsSettings(): Promise<{
        weight: number;
        pointsPerDay: number;
    }> {
        const query = `
          query pointSettingsQuery {
            pointSettings(orderBy: ethStartBlock_DESC, limit: 1) {
              weight:ethWeight
              pointsPerDay
            }
          }
        `;
        try {
            const { data } = await this.post<{
                data: {
                    pointSettings?: Array<{
                        weight: number;
                        pointsPerDay: number;
                    }>;
                };
            }>("", { query });

            const settings = data.pointSettings?.[0];

            return settings || { weight: 0, pointsPerDay: 0 };
        } catch {
            return { weight: 0, pointsPerDay: 0 };
        }
    }

    async getLeaderboard(params: {
        page: number;
        limit: number;
        offset?: number;
    }): Promise<LeaderboardResponse> {
        const offset = params.offset ?? (params.page - 1) * params.limit;
        const query = `
          query LeaderboardQuery($limit: Int!, $offset: Int!) {
            leaderboard(orderBy: points_DESC, limit: $limit, offset: $offset) {
              meta { limit total totalPages page }
              results { id address: id points }
            }
          }
        `;
        try {
            const { data } = await this.post<{
                data: {
                    leaderboard: {
                        meta: LeaderboardMeta;
                        results: Array<{
                            id: string;
                            address: string;
                            points: number | string;
                        }>;
                    };
                };
            }>("", { query, variables: { limit: params.limit, offset } });

            const result = {
                results: (data.leaderboard?.results || []).map((r) => ({
                    ...r,
                    points:
                        typeof r.points === "string"
                            ? parseFloat(r.points as unknown as string)
                            : r.points,
                })),
                meta: data.leaderboard?.meta || {
                    page: params.page,
                    limit: params.limit,
                    total: 0,
                    totalPages: 0,
                },
            };
            return result;
        } catch {
            return {
                results: [],
                meta: {
                    page: params.page,
                    limit: params.limit,
                    total: 0,
                    totalPages: 0,
                },
            };
        }
    }

    async getTotalParticipants(): Promise<number> {
        const query = `
          query LeaderboardMetaQuery {
            leaderboard(orderBy: points_DESC, limit: 1, offset: 0) {
              meta { total }
              results { id }
            }
          }
        `;
        try {
            const { data } = await this.post<{
                data: { leaderboard: { meta: { total: number } } };
            }>("", { query });
            const total = data.leaderboard?.meta?.total ?? 0;

            return total;
        } catch {
            return 0;
        }
    }

    async getCountAbovePoints(points: number | string): Promise<number> {
        const query = `
          query LeaderboardCountAbove($points: String!) {
            leaderboard(where: { points_gt: $points }, limit: 1) {
              meta { total }
              results { id }
            }
          }
        `;
        try {
            const { data } = await this.post<{
                data: { leaderboard: { meta: { total: number } } };
            }>("", { query, variables: { points: String(points) } });
            const total = data.leaderboard?.meta?.total ?? 0;

            return total;
        } catch (error) {
            console.error(
                "[PointsSubsquidService] getCountAbovePoints error",
                error
            );
            return 0;
        }
    }

    async getEntryAtOffset(offset: number): Promise<LeaderboardItem | null> {
        const query = `
          query LeaderboardEntryAt($offset: Int!) {
            leaderboard(orderBy: points_DESC, limit: 1, offset: $offset) {
              results { id address: id points }
            }
          }
        `;
        try {
            const { data } = await this.post<{
                data: { leaderboard: { results: LeaderboardItem[] } };
            }>("", { query, variables: { offset } });
            const item = data.leaderboard?.results?.[0] || null;
            return item;
        } catch (error) {
            console.error(
                "[PointsSubsquidService] getEntryAtOffset error",
                error
            );
            return null;
        }
    }
}

export const pointsApiService = new PointsApiService();
export const pointsSubsquidService = new PointsSubsquidService();
