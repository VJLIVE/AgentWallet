interface StatsBarProps {
  totalAgents: number;
  totalJobs: number;
  totalVolume: number;
}

export default function StatsBar({ totalAgents, totalJobs, totalVolume }: StatsBarProps) {
  const stats = [
    { label: 'Active Agents', value: totalAgents.toString(), icon: '🤖' },
    { label: 'Jobs Completed', value: totalJobs.toLocaleString(), icon: '✅' },
    { label: 'Total Volume', value: `$${totalVolume.toFixed(2)} USDC`, icon: '⚡' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 px-6 py-5 rounded-xl border border-zinc-800 bg-zinc-900"
        >
          <span className="text-2xl">{stat.icon}</span>
          <div>
            <div className="text-2xl font-bold text-zinc-100 font-mono">{stat.value}</div>
            <div className="text-zinc-500 text-sm">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
