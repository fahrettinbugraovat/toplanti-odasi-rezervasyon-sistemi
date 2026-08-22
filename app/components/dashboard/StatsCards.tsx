    const stats = [
  {
    title: "Toplam Rezervasyon",
    value: "128",
    description: "Bu ay",
  },
  {
    title: "Onaylanan",
    value: "96",
    description: "Aktif rezervasyon",
  },
  {
    title: "Bekleyen",
    value: "18",
    description: "Onay bekliyor",
  },
  {
    title: "Toplantı Odası",
    value: "12",
    description: "Toplam oda",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">
            {stat.title}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {stat.value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}