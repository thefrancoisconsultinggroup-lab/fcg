import type { Metadata } from "next";
import { Libre_Baskerville, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WaterBackground } from "@/components/background/water-background";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://francoisconsultinggroup.com"),
  title: {
    default: "Francois Consulting Group",
    template: "%s | Francois Consulting Group",
  },
  description:
    "Leadership development, corporate wellness and purpose-driven transformation.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Francois Consulting Group",
    description:
      "Leadership development, corporate wellness and purpose-driven transformation.",
    url: "https://francoisconsultinggroup.com",
    siteName: "Francois Consulting Group",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${libreBaskerville.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <WaterBackground />
        <SiteHeader />
        <main id="main-content" className="relative z-10 flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
