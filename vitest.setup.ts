import "@testing-library/jest-dom";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock static asset imports (SVG, PNG, WEBP, etc.)
// ---------------------------------------------------------------------------
// Next.js handles these via its webpack loader; Vitest needs a fallback.
// ---------------------------------------------------------------------------

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
}));

// Mock next-intl/navigation
vi.mock("next-intl/navigation", () => ({
    createNavigation: () => ({
        Link: "a",
        redirect: vi.fn(),
        usePathname: () => "/",
        useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
        getPathname: vi.fn(),
    }),
}));

// Mock @/i18n/navigation
vi.mock("@/i18n/navigation", () => ({
    usePathname: () => "/",
    Link: "a",
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    redirect: vi.fn(),
    getPathname: vi.fn(),
}));

// Mock wagmi
vi.mock("wagmi", async () => {
    const actual = await vi.importActual("wagmi");
    return {
        ...actual,
        useAccount: () => ({ address: undefined, isConnected: false }),
        useChainId: () => 1,
        useReadContract: () => ({ data: undefined, isLoading: false }),
        useReadContracts: () => ({ data: undefined, isLoading: false }),
        useWriteContract: () => ({
            writeContract: vi.fn(),
            data: undefined,
            isPending: false,
            error: null,
        }),
        useBalance: () => ({ data: undefined, isLoading: false }),
        useWaitForTransactionReceipt: () => ({
            isLoading: false,
            isSuccess: false,
        }),
        useSendTransaction: () => ({
            sendTransaction: vi.fn(),
            data: undefined,
            isPending: false,
        }),
        useSignTypedData: () => ({
            signTypedData: vi.fn(),
            data: undefined,
            isPending: false,
        }),
    };
});
