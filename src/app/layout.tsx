import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { InitialLoader } from "@/components/layout/InitialLoader";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { AuthProvider } from "@/features/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: "KAMELEON", type: "website", locale: "en_IN" },
  title: {
    default: "KAMELEON — Tradition, Reimagined.",
    template: "%s | KAMELEON",
  },
  description:
    "KAMELEON is a menswear brand pairing contemporary fashion with timeless Indian wear: vesti, lungi and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <InitialLoader />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
