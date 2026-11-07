import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="page-head">
      <h1>Page not available</h1>
      <p>This page does not exist, or your role does not include it.</p>
      <Link className={buttonVariants()} href="/admin">
        Back to dashboard
      </Link>
    </div>
  );
}
