import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import PriceTicker from "@/components/PriceTicker";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Geego Casting - Precious Metal Jewelry Casting",
  description: "Upload STL models and get instant casting quotes for gold, platinum, and silver jewelry.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <PriceTicker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
