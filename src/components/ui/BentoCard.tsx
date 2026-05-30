import type { ReactNode } from "react";

export function BentoCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-border",
        "p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute -inset-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(closest-side,rgba(31,183,173,0.22),transparent_65%)]" />
      </div>
      <div className="relative">
        <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}
