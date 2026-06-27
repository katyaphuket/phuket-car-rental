import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Montserrat } from "next/font/google";
import { LocaleProvider } from "@/lib/locale-context";
import "./globals.css";

const SITE_URL = "https://phuketrentcar.com";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Phuket Car Rental — Direct from Operator, No Hidden Fees",
  description:
    "Rent a car in Phuket directly from the operator. Business insurance included, no document deposit, free child seat & phone holder. Delivery to airport and hotels across Phuket island.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Аренда авто на Пхукете — Phuket Car Rental",
    description:
      "Страховка включена, без залога документов, доставка по острову. От 800 ฿/день.",
    url: SITE_URL,
    siteName: "Phuket Car Rental",
    images: ["/hero-bg.jpg"],
    locale: "ru_RU",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phuket Car Rental",
    description:
      "Direct from operator. Insurance included, no document deposit.",
    images: ["/hero-bg.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${manrope.variable} ${montserrat.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
