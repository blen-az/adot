import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <main className="container narrow">
      <LoginForm />
    </main>
  );
}
