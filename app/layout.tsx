import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/nav/nav";
import Footer from "@/components/layout/footer";
import Disclaimer from "@/components/layout/disclaimer";
import { ReactQueryClientProvider } from "@/components/layout/QueryProvider";
import { ThemeProvider } from "@/components/layout/theme-provider";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Wrap",
  description:
    "MunSci's Web-based Real-time Academic Platform (WRAP) is a student grade information system that ensures secure, efficient, and real-time access to academic records.",
  metadataBase: new URL("https://stercoin.vercel.app"),
  openGraph: {
    title: "Wrap",
    description:
      "MunSci's Web-based Real-time Academic Platform (WRAP) is a student grade information system that ensures secure, efficient, and real-time access to academic records.",
    url: "https://stercoin.vercel.app",
    siteName: "Wrap",
    images: [
      {
        url: "/logo.png",
        width: 477,
        height: 446,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wrap",
    description:
      "MunSci's Web-based Real-time Academic Platform (WRAP) is a student grade information system that ensures secure, efficient, and real-time access to academic records.",
    creator: "@sappy_why",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`min-h-screen ${montserrat.className}`}>
        <ReactQueryClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Disclaimer />
            <div className="flex min-h-screen flex-col">
              <Nav />
              {children}
              <Footer />
            </div>
          </ThemeProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
