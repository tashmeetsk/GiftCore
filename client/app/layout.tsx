import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/provider";

export const metadata: Metadata = {
  title: "GiftCore - The gateway to secure applications",
}

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <Providers>
        <body> 
          {children}
        </body>
      </Providers>
    </html>
  );
}

