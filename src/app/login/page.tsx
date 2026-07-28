import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth/auth-options";

export default async function LoginPage() {
  if (await getServerSession(authOptions)) redirect("/space");
  return (
    <AppShell>
      <section className="foundation-card">
        <h1>欢迎回来</h1>
        <LoginForm />
        <Link href="/register">创建账户</Link>
      </section>
    </AppShell>
  );
}
