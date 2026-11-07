import type { Metadata } from "next";
import { Ambient } from "@/components/Ambient";
import { buttonVariants } from "@/components/ui/button";
import { dictionary } from "@/i18n";
import { fontClasses } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = { title: "Page not found | Adot Complex", robots: { index: false } };

// The app has separate public and admin root layouts, so unmatched URLs need their own document.
export default function GlobalNotFound() {
  const t = dictionary("en").notFound;
  return (
    <html lang="en" className={`dark ${fontClasses}`}>
      <body>
        <Ambient />
        <main className="container page-head">
          <h1>{t.heading}</h1>
          <p>{t.body}</p>
          <a className={buttonVariants()} href="/en">
            {t.home}
          </a>
        </main>
      </body>
    </html>
  );
}
