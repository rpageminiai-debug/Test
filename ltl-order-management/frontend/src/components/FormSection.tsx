import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function FormSection({ title, subtitle, children }: Props) {
  return (
    <section className="form-section">
      <header className="form-section__header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className="form-grid">{children}</div>
    </section>
  );
}
