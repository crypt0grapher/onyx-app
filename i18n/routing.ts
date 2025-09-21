import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    locales: ["en", "tr", "kr", "cn"],
    defaultLocale: "en",
    localePrefix: "always",
});
