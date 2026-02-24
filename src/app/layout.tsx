import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Bebas_Neue } from 'next/font/google';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  title: "Cedar Sells - Investment Properties",
  description: "Discover profitable real estate investment opportunities in Lafayette, Baton Rouge, and surrounding Acadiana parishes. Fix & flip, wholesale, and rental properties available.",
  keywords: "real estate investment, Lafayette Louisiana, Baton Rouge, fix and flip, wholesale, rental properties, Cedar Sells",
  openGraph: {
    title: "Cedar Sells - Investment Properties",
    description: "Discover profitable real estate investment opportunities in Lafayette, Baton Rouge, and surrounding Acadiana parishes.",
    url: "https://cedarcashhomebuyers.com",
    siteName: "Cedar Sells",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cedar Sells - Investment Properties",
    description: "Discover profitable real estate investment opportunities in Lafayette, Baton Rouge, and surrounding Acadiana parishes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${bebasNeue.variable} antialiased font-sans bg-background text-text`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
