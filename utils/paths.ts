import { routing } from "@/i18n/routing";

/**
 * Normalize a pathname by stripping the leading locale segment (e.g., /en, /tr).
 * Returns a leading-slash path ("/") if empty after stripping.
 */
export function normalizePath(path: string): string {
    if (!path) return "/";

    const pathname = path.split("?")[0].split("#")[0];
    const segments = pathname.split("/");
    const maybeLocale = segments[1];
    const supportedLocales = routing.locales as readonly string[];

    if (supportedLocales.includes(maybeLocale as string)) {
        segments.splice(1, 1);
    }

    const normalized = segments.join("/");
    return normalized === "" ? "/" : normalized;
}
