import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { dictionary } from "@/i18n";

export default function NotFound() {
  const t = dictionary("en").notFound;
  return (
    <div className="container page-head">
      <h1>{t.heading}</h1>
      <p>{t.body}</p>
      <Link className={buttonVariants()} href="/en">
        {t.home}
      </Link>
    </div>
  );
}
