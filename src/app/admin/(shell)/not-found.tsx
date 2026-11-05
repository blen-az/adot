import Link from "next/link";

export default function AdminNotFound() {
  return (
    <>
      <h1>Page not available</h1>
      <p>This page does not exist, or your role does not include it.</p>
      <Link href="/admin">Back to dashboard</Link>
    </>
  );
}
