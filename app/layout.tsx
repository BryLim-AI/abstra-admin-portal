import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientLayout";
import FeedbackWidget from "../components/feedback/FeedbackWidget";
import "leaflet/dist/leaflet.css";
import InstallPrompt from "@/components/Commons/installPrompt";
import Head from "next/head";
import CookiesPermission from "@/components/Commons/setttings/cookiesPermission";
import PushInit from "@/components/notification/pushNotifMobile";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Hestia Rent360",
    description: "Your Rental Partner.",
    manifest: '/manifest.json',
    icons: {
        icon: '/Hestia-logo-b.svg',
        apple: '/Hestia-logo-b.svg'
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <Head>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#ffffff" />
            <link rel="apple-touch-icon" href="/Hestia-logo-b.svg" />
        </Head>
        <body>
        <ClientLayout>
            {children}
            {/*<InstallPrompt />*/}
            <CookiesPermission />
            {/* <FeedbackWidget /> */}
        </ClientLayout>
        </body>
        </html>
    );
}
