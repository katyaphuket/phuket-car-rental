import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Phuket Car Rental",
  description:
    "Privacy policy of KATACARS CO., LTD. How we collect, use and protect your data.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Phuket Car Rental",
    description:
      "Privacy policy of KATACARS CO., LTD. How we collect, use and protect your data.",
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
