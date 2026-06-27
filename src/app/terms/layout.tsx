import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental Terms & Delivery Zones — Phuket Car Rental",
  description:
    "Rental terms, delivery zones and prices across Phuket island. Insurance details, deposit rules and cancellation policy.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Rental Terms & Delivery Zones — Phuket Car Rental",
    description:
      "Rental terms, delivery zones and prices across Phuket island. Insurance details, deposit rules and cancellation policy.",
    url: "/terms",
    type: "website",
  },
};

export default function TermsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
