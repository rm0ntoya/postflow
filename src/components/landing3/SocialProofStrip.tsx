const stats = [
  ["+28k", "criadores ativos"],
  ["4.2M", "posts gerados"],
  ["3.4x", "mais consistência"],
  ["7 dias", "para testar"],
];

export function SocialProofStrip() {
  return (
    <section className="border-y border-border-subtle bg-bg-surface">
      <div className="landing3-container grid divide-y divide-border-subtle py-1 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {stats.map(([value, label]) => (
          <div key={label} className="px-4 py-5 text-center">
            <div className="text-h1 text-text-primary tnum">{value}</div>
            <div className="mt-1 text-caption text-text-tertiary">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
