'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Room, useReservationData } from '../../context/ReservationContext';
import { useToast } from '../../context/ToastContext'; // TOAST SİSTEMİ EKLENDİ

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
interface SelectedSlot {
  room: Room;
  slots: number[];
}

export default function CalendarView() {
  const { theme } = useTheme();
  const { rooms, reservations, setReservations, setRooms, operations, setOperations, pendingSelection, setPendingSelection, pendingTitle, setPendingTitle } = useReservationData();
  const { showToast } = useToast(); // TOAST FONKSİYONU ÇAĞRILDI
  
  const selectedRoom = pendingSelection ? rooms.find((room) => room.id === pendingSelection.roomId) : null;
  const selectedSlot = selectedRoom && pendingSelection ? { room: selectedRoom, slots: pendingSelection.slots } : null;
  const reservationTitle = pendingTitle;
  const hasSelectedRange = selectedSlot !== null && selectedSlot.slots.length >= 1;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date());
      setSelectedDate((date) => date ?? (pendingSelection ? new Date(`${pendingSelection.date}T12:00:00`) : new Date()));
    };
    updateCurrentTime();
    const timer = window.setInterval(updateCurrentTime, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [pendingSelection]);

  const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const changeDate = (days: number) => {
    setSelectedDate((currentDate) => {
      if (!currentDate) return currentDate;
      const nextDate = new Date(currentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextDate.setDate(nextDate.getDate() + days);
      if (nextDate < today) return currentDate;
      return nextDate;
    });
    clearSelection();
  };

  const handleDateChange = (dateValue: string) => {
    if (!dateValue) return;
    const nextDate = new Date(`${dateValue}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (nextDate < today) return;
    setSelectedDate(nextDate);
    clearSelection();
  };

  const isToday = selectedDate !== null && currentTime !== null && selectedDate.toDateString() === currentTime.toDateString();
  const isPastDate = selectedDate !== null && currentTime !== null && selectedDate < new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
  const visibleTimeSlots = timeSlots
    .map((time, slotIndex) => ({ time, slotIndex }))
    .filter(() => !isPastDate);

  const selectEmptySlot = (room: Room, slotIndex: number) => {
    if (!selectedSlot?.room || selectedSlot.room.name !== room.name) {
      setPendingSelection({ roomId: room.id, slots: [slotIndex], date: selectedDate?.toISOString().split('T')[0] ?? '' });
      return;
    }

    const isSelected = selectedSlot.slots.includes(slotIndex);
    const slots = isSelected
      ? selectedSlot.slots.filter((selectedIndex) => selectedIndex !== slotIndex)
      : [...selectedSlot.slots, slotIndex].sort((first, second) => first - second);
    setPendingSelection(slots.length > 0 ? { roomId: room.id, slots, date: pendingSelection?.date ?? selectedDate?.toISOString().split('T')[0] ?? '' } : null);
  };

  const clearSelection = () => {
    setPendingSelection(null);
    setPendingTitle('');
  };

  const formatSelectedRanges = (slots: number[]) => {
    const ranges: string[] = [];
    let rangeStart = slots[0];
    let rangeEnd = slots[0];

    slots.slice(1).forEach((slot) => {
      if (slot === rangeEnd + 1) {
        rangeEnd = slot;
      } else {
        ranges.push(`${timeSlots[rangeStart]} - ${timeSlots[rangeEnd + 1] ?? '18:00'}`);
        rangeStart = slot;
        rangeEnd = slot;
      }
    });

    ranges.push(`${timeSlots[rangeStart]} - ${timeSlots[rangeEnd + 1] ?? '18:00'}`);
    return ranges;
  };

  // TOAST ENTEGRASYONU YAPILAN YER (try/catch eklendi)
  const confirmReservation = async () => {
    if (!selectedSlot?.room || !selectedDate || !pendingSelection || !reservationTitle.trim()) return;
    
    try {
      const sortedSlots = [...selectedSlot.slots].sort((first, second) => first - second);
      const ranges: { start: number; end: number }[] = [];
      let rangeStart = sortedSlots[0];
      let rangeEnd = sortedSlots[0];

      sortedSlots.slice(1).forEach((slot) => {
        if (slot === rangeEnd + 1) {
          rangeEnd = slot;
        } else {
          ranges.push({ start: rangeStart, end: rangeEnd + 1 });
          rangeStart = slot;
          rangeEnd = slot;
        }
      });
      ranges.push({ start: rangeStart, end: rangeEnd + 1 });

      setReservations([...reservations, ...ranges.map((range) => ({ id: Date.now() + range.start, roomId: selectedSlot.room!.id, ...range, title: reservationTitle.trim(), date: pendingSelection.date }))]);
      const isCurrentReservation = isToday && selectedSlot.slots.some((slot) => slot === currentTime!.getHours() - 9);
      
      setRooms((currentRooms) => currentRooms.map((room) => room.id === selectedSlot.room.id
        ? { ...room, status: isCurrentReservation ? 'Dolu' : room.status === 'Rezerve Ediliyor' ? 'Müsait' : room.status, lockEndTime: null }
        : room));
        
      setOperations([{ id: Date.now(), title: reservationTitle.trim(), details: `${selectedSlot.room.name} • ${formatSelectedRanges(selectedSlot.slots).join(', ')}`, date: formatDate(selectedDate) }, ...operations]);
      
      setPendingTitle('');
      setPendingSelection(null);

      // BAŞARILI İŞLEM BİLDİRİMİ
      showToast({
        type: 'success',
        title: 'Rezervasyon Tamamlandı',
        message: 'Rezervasyonunuz başarıyla oluşturuldu.'
      });
      
    } catch (error) {
      // BAŞARISIZ İŞLEM BİLDİRİMİ
      showToast({
        type: 'error',
        title: 'Rezervasyon Oluşturulamadı',
        message: 'Rezervasyon oluşturulurken bir hata oluştu.'
      });
    }
  };

  const isSlotSelected = (roomName: string, slotIndex: number) => (
    selectedSlot?.room?.name === roomName && selectedSlot.slots.includes(slotIndex)
  );

  const getReservation = (roomId: string, slotIndex: number) => reservations.find(
    (reservation) => reservation.roomId === roomId && reservation.start === slotIndex && (reservation.date === null || reservation.date === selectedDate?.toISOString().split('T')[0]),
  );

  if (!selectedDate || !currentTime) return null;

  return (
    <section className="h-full overflow-y-auto bg-[#f3f6ff] p-4 text-[#101b35] dark:bg-[#141414] dark:text-[#e5e7eb] md:p-5">
      <div className="mx-auto flex h-full max-w-[1100px] flex-col gap-4 xl:flex-row">
        <div className="min-h-[520px] min-w-0 flex-1 border border-gray-200 bg-white dark:border-[#2d2d2d] dark:bg-[#1c1c1c]">
          <div className="relative flex h-[53px] items-center justify-between border-b border-gray-200 bg-gray-100 px-4 dark:border-[#2d2d2d] dark:bg-[#212121]">
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2"><button title="Önceki gün" onClick={() => changeDate(-1)} className="text-xl text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">‹</button><input type="date" aria-label="Takvim tarihi seç" min={currentTime.toISOString().split('T')[0]} value={selectedDate.toISOString().split('T')[0]} onChange={(event) => handleDateChange(event.target.value)} style={{ colorScheme: theme }} className="border border-gray-300 bg-white px-2 py-1.5 text-sm font-bold text-gray-900 outline-none focus:border-[#ed002d] dark:border-[#56595e] dark:bg-[#2a2a2a] dark:text-white" /><button title="Sonraki gün" onClick={() => changeDate(1)} className="text-xl text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">›</button></div>
            <div className="ml-auto flex gap-2"><button onClick={() => { clearSelection(); setSelectedDate(new Date()); }} className="border border-[#ed002d] px-3 py-1.5 text-[10px] font-bold text-[#ed002d] transition-colors hover:bg-[#ed002d] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ed002d] focus:ring-offset-1 focus:ring-offset-gray-100 dark:focus:ring-offset-[#212121]">Bugün</button><button className="border border-gray-300 px-3 py-1.5 text-[10px] text-gray-700 dark:border-[#56595e] dark:text-gray-200">Tüm Odalar⌄</button></div>
          </div>

          <div className="grid overflow-x-auto text-xs" style={{ gridTemplateColumns: `165px repeat(${visibleTimeSlots.length}, minmax(90px, 1fr))` }}>
            <div className="h-11 border-b border-r border-gray-200 px-3 py-3.5 dark:border-[#2d2d2d]">Oda</div>
            {visibleTimeSlots.map(({ time, slotIndex }) => <div key={time} className="h-11 border-b border-r border-gray-200 px-2 py-3.5 text-center dark:border-[#2d2d2d]">{time} - {timeSlots[slotIndex + 1] ?? '18:00'}</div>)}
            {rooms.map((room) => <div key={room.id} className="contents">
              <div className="h-[82px] border-b border-r border-gray-200 px-3 py-3 dark:border-[#2d2d2d]"><strong className="block text-sm">{room.name}</strong><span className="text-xs text-gray-500 dark:text-gray-300">{room.capacity}</span></div>
              {visibleTimeSlots.map(({ time, slotIndex }) => {
                const reservation = getReservation(room.id, slotIndex);
                const isContinuation = reservations.some((item) => item.roomId === room.id && item.start < slotIndex && item.end > slotIndex);
                if (isContinuation) return null;
                if (reservation) return <div key={time} className="m-1 h-[74px] overflow-hidden border border-[#E4032C] bg-[#E4032C] px-2 text-left text-xs font-semibold text-white" style={{ gridColumn: `span ${reservation.end - reservation.start}` }}>{reservation.title}</div>;
                const isSelected = isSlotSelected(room.name, slotIndex);
                return <button key={time} onClick={() => selectEmptySlot(room, slotIndex)} className={`h-[82px] border-b border-r border-gray-200 text-[#ed002d] hover:bg-gray-50 dark:border-[#2d2d2d] dark:text-[#ff1744] dark:hover:bg-[#272a2e] ${isSelected ? 'bg-red-50 ring-1 ring-inset ring-[#ed002d] dark:bg-[#3a2026]' : ''}`} title={`${room.name} ${time} seç`}></button>;
              })}
            </div>)}
          </div>
        </div>

        {hasSelectedRange && selectedSlot && <aside className="flex min-h-[520px] w-full flex-col border border-gray-200 bg-white p-3 dark:border-[#2d2d2d] dark:bg-[#1c1c1c] xl:w-[240px]">
          <div className="flex items-start justify-between border-b border-gray-200 pb-3 dark:border-[#2d2d2d]"><h2 className="text-base font-bold">Rezervasyon Özeti</h2><button title="Rezervasyon özetini kapat" onClick={clearSelection} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><span className="material-symbols-outlined text-[18px]">close</span></button></div>
          <div className="mt-3 border-l-2 border-[#ed002d] bg-gray-100 p-3 dark:bg-[#1b1d1f]"><span className="text-[10px]">Seçilen Oda</span><strong className="mt-1 block text-sm">{selectedSlot.room.name}</strong><div className="mt-2 flex gap-1"><span className="bg-gray-200 px-2 py-1 text-[10px] dark:bg-[#303236]">{selectedSlot.room.capacity}</span><span className="bg-gray-200 px-2 py-1 text-[10px] dark:bg-[#303236]">{selectedSlot.room.features[0]}</span></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><label className="text-[10px]">Tarih<input readOnly value={formatDate(selectedDate)} className="mt-1 h-9 w-full bg-gray-100 p-2 text-[10px] outline-none dark:bg-[#36383a]" /></label><label className="text-[10px]">Saat<div className="mt-1 h-9 w-full overflow-y-auto bg-gray-100 p-2 text-[10px] leading-5 outline-none dark:bg-[#36383a]">{formatSelectedRanges(selectedSlot.slots).map((range) => <div key={range}>{range}</div>)}</div></label></div>
          <label className="mt-4 text-[10px]">Toplantı Başlığı<input value={reservationTitle} onChange={(event) => setPendingTitle(event.target.value)} placeholder="Başlık girin..." className="mt-1 w-full border border-gray-300 bg-transparent p-2 text-[11px] outline-none focus:border-[#ed002d] dark:border-[#3a3d41]" /></label>
          <label className="mt-3 text-[10px]">Katılımcılar (Opsiyonel)<input placeholder="E-posta ekle..." className="mt-1 w-full border border-gray-300 bg-transparent p-2 text-[11px] outline-none focus:border-[#ed002d] dark:border-[#3a3d41]" /></label>
          <button onClick={confirmReservation} disabled={!reservationTitle.trim()} className="mt-auto bg-[#ed002d] py-3 text-xs font-bold text-white hover:bg-[#c9002a] disabled:cursor-not-allowed disabled:opacity-50">Rezervasyonu Onayla</button>
        </aside>}
      </div>
    </section>
  );
}