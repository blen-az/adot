import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Ambient } from "@/components/Ambient";
import { fontClasses } from "@/lib/fonts";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Adot dashboard", template: "%s | Adot dashboard" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${fontClasses}`}>
      <body>
        <Ambient />
        {children}
      </body>
    </html>
  );
}
