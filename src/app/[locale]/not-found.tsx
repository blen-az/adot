import Link from "next/link";
import { dictionary } from "@/i18n";

export default function NotFound() {
  const t = dictionary("en").notFound;
  return (
    <div className="container narrow">
      <h1>{t.heading}</h1>
      <p>{t.body}</p>
      <Link href="/en">{t.home}</Link>
    </div>
  );
}
