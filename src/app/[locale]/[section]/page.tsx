import { notFound } from "next/navigation";
import { dictionary, type Locale } from "@/i18n";

const sections = ["cinema", "gym", "directory", "visit", "about", "contact", "privacy"] as const;
type Section = (typeof sections)[number];

function isSection(value: string): value is Section {
  return (sections as readonly string[]).includes(value);
}

// Placeholder routes so navigation works until the content phase replaces each one.
export default async function SectionPage({ params }: { params: Promise<{ locale: Locale; section: string }> }) {
  const { locale, section } = await params;
  if (!isSection(section)) notFound();
  const t = dictionary(locale);
  return (
    <div className="container narrow">
      <h1>{t.nav[section]}</h1>
      <p>{t.placeholder.body}</p>
    </div>
  );
}
