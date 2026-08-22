const rooms = [
  {
    name: "Toplantı Odası 1",
    capacity: 12,
    status: "Müsait",
  },
  {
    name: "Toplantı Odası 2",
    capacity: 8,
    status: "Dolu",
  },
  {
    name: "Konferans Salonu",
    capacity: 30,
    status: "Müsait",
  },
  {
    name: "Toplantı Odası 4",
    capacity: 10,
    status: "Dolu",
  },
];

export default function RoomTable() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">
            Toplantı Odaları
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Odaların mevcut durumları
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="px-5 py-4 font-medium">
                Oda
              </th>

              <th className="px-5 py-4 font-medium">
                Kapasite
              </th>

              <th className="px-5 py-4 font-medium">
                Durum
              </th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.name}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {room.name}
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {room.capacity} kişi
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      room.status === "Müsait"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {room.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}