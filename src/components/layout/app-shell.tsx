import type { ReactNode } from "react";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="shell-header">
        <span className="shell-wordmark">Our Space</span>
      </header>
      <main id="main-content" className="shell-main">
        {children}
      </main>
    </div>
  );
}
