interface StatsBarProps {
  totalAgents: number;
  totalJobs: number;
  totalVolume: number;
}

export default function StatsBar({
  totalAgents,
  totalJobs,
  totalVolume,
}: StatsBarProps) {
  const stats = [
    {
      label: "Active Agents",
      value: totalAgents.toString(),
      sub: "In marketplace",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        </svg>
      ),
    },
    {
      label: "Jobs Completed",
      value: totalJobs.toLocaleString(),
      sub: "Successfully executed",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      ),
    },
    {
      label: "Total Volume",
      value: `$${totalVolume.toFixed(2)}`,
      sub: "USDC settled on-chain",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card"
          style={{
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "var(--accent-subtle)",
              border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              flexShrink: 0,
            }}
          >
            {stat.icon}
          </div>
          <div>
            <div
              className="stat-number"
              style={{ fontSize: "1.75rem" }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {stat.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
