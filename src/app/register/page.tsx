import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth/auth-options";

export default async function RegisterPage() {
  if (await getServerSession(authOptions)) redirect("/space");
  return (
    <AppShell>
      <section className="foundation-card">
        <h1>创建账户</h1>
        <p>慢慢来，准备好后我们就回家。</p>
        <RegisterForm />
        <Link href="/login">已经有账户</Link>
      </section>
    </AppShell>
  );
}
