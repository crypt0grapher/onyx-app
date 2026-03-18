import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import MobileNavbar from "@/components/sidebar/MobileNavbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { WalletProvider } from "@/context/WalletProvider";
import Web3Providers from "@/context/Web3Providers";
import WalletConnectionHandler from "@/components/wallet/WalletConnectionHandler";
import WalletInfoHandler from "@/components/wallet/WalletInfoHandler";
import FloatingNetworkDropdown from "@/components/ui/FloatingNetworkDropdown";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

const geist_Mono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "metadata" });

    return {
        metadataBase: new URL("https://onyx.org"),
        applicationName: t("title"),
        title: t("title"),
        description: t("description"),
        keywords: t("keywords").split(", "),
        authors: [{ name: "Onyx Protocol" }],
        creator: "Onyx Protocol",
        publisher: "Onyx Protocol",
        formatDetection: {
            telephone: false,
        },
        openGraph: {
            title: t("openGraph.title"),
            description: t("openGraph.description"),
            url: "https://onyx.org",
            siteName: t("openGraph.siteName"),
            images: [
                {
                    url: "/og_image.jpg",
                    width: 1200,
                    height: 630,
                    alt: `${t("title")} - The backbone of Web3`,
                },
            ],
            locale: locale === "en" ? "en_US" : "tr_TR",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t("twitter.title"),
            description: t("twitter.description"),
            images: ["/og_image.jpg"],
            site: "@onyxprotocol",
            creator: "@onyxprotocol",
        },
        icons: {
            icon: [
                { url: "/16px1.png", sizes: "16x16", type: "image/png" },
                { url: "/24px1.png", sizes: "24x24", type: "image/png" },
                { url: "/32px1.png", sizes: "32x32", type: "image/png" },
                { url: "/128px1.png", sizes: "128x128", type: "image/png" },
            ],
            shortcut: "/favicon.ico",
            apple: [
                { url: "/128px1.png", sizes: "57x57", type: "image/png" },
                { url: "/128px1.png", sizes: "60x60", type: "image/png" },
                { url: "/128px1.png", sizes: "72x72", type: "image/png" },
                { url: "/128px1.png", sizes: "76x76", type: "image/png" },
                { url: "/128px1.png", sizes: "114x114", type: "image/png" },
                { url: "/128px1.png", sizes: "120x120", type: "image/png" },
                { url: "/128px1.png", sizes: "144x144", type: "image/png" },
                { url: "/128px1.png", sizes: "152x152", type: "image/png" },
                { url: "/128px1.png", sizes: "180x180", type: "image/png" },
                { url: "/128px1.png", sizes: "192x192", type: "image/png" },
            ],
        },
        appleWebApp: {
            title: t("title"),
            statusBarStyle: "default",
            capable: true,
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = (await import(`@/messages/${locale}.json`)).default;

    const baseFontVars = `${inter.variable} ${geist_Mono.variable}`;
    const localeFallback =
        locale === "kr"
            ? "font-[system-ui]"
            : locale === "cn"
            ? "font-[system-ui]"
            : "font-sans";

    const bodyStyle: React.CSSProperties = {
        fontFamily:
            locale === "kr"
                ? 'Inter, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Nanum Gothic", system-ui, sans-serif'
                : locale === "cn"
                ? 'Inter, "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif'
                : "Inter, system-ui, sans-serif",
    };

    return (
        <html lang={locale}>
            <body
                className={`${baseFontVars} antialiased ${localeFallback}`}
                style={bodyStyle}
            >
                <NextIntlClientProvider messages={messages} locale={locale}>
                    <Web3Providers>
                        <WalletProvider>
                            <MobileNavbar />
                            <Sidebar />
                            {children}
                            <FloatingNetworkDropdown />
                            <WalletConnectionHandler />
                            <WalletInfoHandler />
                            <ToastContainer
                                position="top-right"
                                autoClose={4000}
                                hideProgressBar={true}
                                newestOnTop={false}
                                closeOnClick={false}
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme="dark"
                                closeButton={false}
                                className="toast-container"
                                toastClassName="toast-custom"
                            />
                        </WalletProvider>
                    </Web3Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
