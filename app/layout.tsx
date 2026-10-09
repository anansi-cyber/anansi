import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Background from "@/components/ui/Background";
import MotionProvider from "@/components/ui/MotionProvider";
import ScrollThread from "@/components/ui/ScrollThread";
import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        {/* Sans JavaScript, les blocs animés à l'apparition restent visibles. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <MotionProvider>
          {/* Hors du bloc "isolate" : le fil passe ainsi au-dessus de l'en-tête. */}
          <ScrollThread />
          <div className="relative isolate min-h-screen overflow-x-clip text-zinc-100 antialiased">
            <Background />
            <Header />
            {children}
            <Footer />
          </div>
        </MotionProvider>
      </body>
    </html>
  );
}
