import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth/auth-options";

export default async function WelcomePage() {
  if (await getServerSession(authOptions)) redirect("/space");
  return (
    <AppShell>
      <section className="foundation-card">
        <p className="eyebrow">Our Space</p>
        <h1>Welcome Home</h1>
        <p className="foundation-copy">一个属于两个人的安静空间。</p>
        <div className="link-row">
          <Link href="/register">创建账户</Link>
          <Link href="/login">登录</Link>
        </div>
      </section>
    </AppShell>
  );
}
