'use client';

import { useMemo, useState } from 'react';
import { useReservationData } from '../../context/ReservationContext';

function RoomManagement() {
  const { rooms } = useReservationData();
  const [search, setSearch] = useState('');

  const filteredRooms = useMemo(
    () => rooms.filter((room) => room.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))),
    [rooms, search],
  );

  return (
    <section className="h-full overflow-y-auto bg-[#f3f6ff] px-4 py-7 text-[#101b35] dark:bg-[#141414] dark:text-white md:px-9 md:py-9 lg:px-10">
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-11">
          <h1 className="text-2xl font-bold tracking-tight md:text-[25px]">Toplantı Oda Bilgi Sistemi</h1>
          <p className="mt-1 text-xs text-[#506079] dark:text-gray-400 md:text-sm">Sistemdeki tüm odaları ve aktif rezervasyonları yönetin.</p>
        </header>

        <div className="mt-[18px] flex items-center gap-4 bg-white/35 p-3 dark:bg-[#1c1c1c]">
          <label className="flex h-9 max-w-[319px] flex-1 items-center gap-3 bg-white px-3 text-[#506079] dark:bg-[#222] dark:text-gray-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Oda Ara..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#667085]" />
          </label>
        </div>

        <div className="mt-[18px] overflow-x-auto bg-white dark:bg-[#1c1c1c]">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <thead><tr className="h-11 bg-[#f1f4fc] text-xs uppercase tracking-wide text-[#33415d] dark:bg-[#222] dark:text-gray-400"><th className="px-[18px] font-medium">Oda Adı</th><th className="px-4 font-medium">Kapasite</th><th className="px-4 font-medium">Özellikler</th><th className="px-4 font-medium">Durum</th></tr></thead>
            <tbody>
              {filteredRooms.map((room) => <tr key={room.id} className="h-[58px] text-sm"><td className="px-[18px] font-bold">{room.name}</td><td className="px-4">{room.capacity}</td><td className="px-4"><div className="flex gap-1">{room.features.map((feature) => <span key={feature} className="bg-[#e8eefb] px-2 py-1 text-xs dark:bg-[#30343d]">{feature}</span>)}</div></td><td className={`px-4 font-bold ${room.status === 'Dolu' ? 'text-[#ed002d]' : 'text-[#16a34a] dark:text-[#4ade80]'}`}>{room.status}</td></tr>)}
              {filteredRooms.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-xs text-gray-500">Oda bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default RoomManagement;

