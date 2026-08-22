const bookings = [
  {
    room: "Toplantı Odası 1",
    user: "Ahmet Yılmaz",
    date: "21 Ağustos 2026",
    time: "10:00 - 11:00",
  },
  {
    room: "Konferans Salonu",
    user: "Mehmet Demir",
    date: "21 Ağustos 2026",
    time: "13:00 - 15:00",
  },
  {
    room: "Toplantı Odası 2",
    user: "Ayşe Kaya",
    date: "22 Ağustos 2026",
    time: "09:00 - 10:00",
  },
];

export default function RecentBookings() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">
          Son Rezervasyonlar
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Sistemdeki son toplantı odası rezervasyonları
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {bookings.map((booking) => (
          <div
            key={`${booking.room}-${booking.user}`}
            className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">
                {booking.room}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {booking.user}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm font-medium text-slate-700">
                {booking.date}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {booking.time}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}