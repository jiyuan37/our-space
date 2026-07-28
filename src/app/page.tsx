import { AppShell } from "@/components/layout/app-shell";

export default function FoundationPage() {
  return (
    <AppShell>
      <section className="foundation-card" aria-labelledby="welcome-title">
        <p className="eyebrow">Our Space</p>
        <h1 id="welcome-title">Welcome Home</h1>
        <p className="foundation-copy">
          一个属于两个人的安静空间，正在准备成为家。
        </p>
        <p className="foundation-note">
          基础设施已经就绪。身份认证和共同生活功能将在后续阶段逐步加入。
        </p>
      </section>
    </AppShell>
  );
}
