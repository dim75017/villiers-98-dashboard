import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const image = new URL("/og-complete.png", base).toString();

  return {
    metadataBase: base,
    title: "98 Villiers — Base complète de l’immeuble",
    description: "Base complète des 85 lots et 44 copropriétaires du 98 avenue de Villiers, Paris 17e.",
    openGraph: {
      title: "98 Villiers — Base complète de l’immeuble",
      description: "85 lots · 44 copropriétaires · toutes les données sur une page",
      images: [{ url: image, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "98 Villiers — Base complète de l’immeuble",
      description: "85 lots · 44 copropriétaires · toutes les données sur une page",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={`${manrope.variable} ${geistMono.variable}`}>{children}</body></html>;
}
