'use client';
import { useEffect, useState } from 'react';

// --- TİPLER (TYPES) ---
interface Operation {
  id: number;
  title: string;
  details: string;
  date: string;
}

type RoomStatus = 'Müsait' | 'Dolu' | 'Rezerve Ediliyor';

interface Room {
  id: string;
  name: string;
  capacity: string;
  features: string[];
  status: RoomStatus;
  lockEndTime: number | null;
}

const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00"
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ rooms: 0, reservations: 0, usage: 0 });

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Boardroom Alpha', capacity: '12 Kişi', features: ['VC Gear'], status: 'Dolu', lockEndTime: null },
    { id: '2', name: 'Huddle Room 1', capacity: '4 Kişi', features: ['Whiteboard'], status: 'Müsait', lockEndTime: null },
    { id: '3', name: 'Creative Space', capacity: '8 Kişi', features: ['Projector'], status: 'Müsait', lockEndTime: null },
  ]);

  const [operations, setOperations] = useState<Operation[]>([
    { id: 1, title: 'Yönetim Kurulu Toplantısı', details: 'Boardroom Alpha • 14:00 - 15:00', date: 'Bugün' },
    { id: 2, title: 'Proje Kick-off', details: 'Huddle Room 1 • 09:00 - 10:00', date: 'Yarın' },
    { id: 3, title: 'Tasarım İncelemesi', details: 'Creative Space • 11:00 - 12:00', date: '22 Eki' },
  ]);

  const [deletingOp, setDeletingOp] = useState<Operation | null>(null);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [reservingRoomId, setReservingRoomId] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({ title: '', room: '', time: '', date: '' });
  const [resForm, setResForm] = useState({ title: '', time: '', date: '' });
  const [originalTime, setOriginalTime] = useState("");

  useEffect(() => {
    if (!now) return;
    setRooms(prevRooms => {
      let hasChanges = false;
      const updatedRooms = prevRooms.map(room => {
        if (room.status === 'Rezerve Ediliyor' && room.lockEndTime && now >= room.lockEndTime) {
          hasChanges = true;
          return { ...room, status: 'Müsait' as RoomStatus, lockEndTime: null };
        }
        return room;
      });

      if (hasChanges && reservingRoomId) {
        const activeRoom = updatedRooms.find(r => r.id === reservingRoomId);
        if (!activeRoom || activeRoom.status !== 'Rezerve Ediliyor') {
          setReservingRoomId(null);
        }
      }
      return hasChanges ? updatedRooms : prevRooms;
    });
  }, [now, reservingRoomId]);

  useEffect(() => {
    if (editingOp) {
      const [room, timeStr] = editingOp.details.split(' • ');
      let parsedDate = "2026-10-22"; 
      const today = new Date();
      if (editingOp.date === 'Bugün') {
        parsedDate = today.toISOString().split('T')[0];
      } else if (editingOp.date === 'Yarın') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        parsedDate = tomorrow.toISOString().split('T')[0];
      }

      setEditForm({ title: editingOp.title, room: room || "", time: "", date: parsedDate });
      setOriginalTime(timeStr || "");
    }
  }, [editingOp]);

  useEffect(() => {
    const barTimer = setTimeout(() => setProgress(78), 100);
    const duration = 2000; 
    const frameRate = 1000 / 60; 
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const counterTimer = setInterval(() => {
      frame++;
      const animationProgress = frame / totalFrames;
      const ease = 1 - Math.pow(1 - animationProgress, 4);
      setStats({
        rooms: Math.round(24 * ease),
        reservations: Math.round(142 * ease),
        usage: Math.round(78 * ease),
      });
      if (frame >= totalFrames) {
        clearInterval(counterTimer);
        setStats({ rooms: 24, reservations: 142, usage: 78 }); 
      }
    }, frameRate);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeletingOp(null);
        setEditingOp(null);
        if (reservingRoomId) handleCancelReservation(); 
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(barTimer);
      clearInterval(counterTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [reservingRoomId]);

  const formatDateForList = (dateString: string) => {
    if (!dateString) return "Belirsiz";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Belirsiz";
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const handleSaveEdit = () => {
    if (!editingOp) return;
    setOperations(operations.map(op => 
      op.id === editingOp.id ? { 
        ...op, 
        title: editForm.title,
        details: `${editForm.room} • ${editForm.time}`,
        date: formatDateForList(editForm.date)
      } : op
    ));
    setEditingOp(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingOp) return;
    setOperations(operations.filter(op => op.id !== deletingOp.id));
    setDeletingOp(null);
  };

  const handleStartReservation = (roomId: string) => {
    setRooms(prev => prev.map(r => 
      r.id === roomId ? { ...r, status: 'Rezerve Ediliyor', lockEndTime: Date.now() + 3 * 60 * 1000 } : r
    ));
    setReservingRoomId(roomId);
    
    const today = new Date().toISOString().split('T')[0];
    setResForm({ title: '', time: '', date: today });
  };

  const handleCancelReservation = () => {
    if (!reservingRoomId) return;
    setRooms(prev => prev.map(r => 
      r.id === reservingRoomId ? { ...r, status: 'Müsait', lockEndTime: null } : r
    ));
    setReservingRoomId(null);
  };

  const handleConfirmReservation = () => {
    if (!reservingRoomId) return;
    const reservedRoom = rooms.find(r => r.id === reservingRoomId);
    
    setRooms(prev => prev.map(r => 
      r.id === reservingRoomId ? { ...r, status: 'Dolu', lockEndTime: null } : r
    ));
    
    if (reservedRoom) {
      const d = new Date();
      const startStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const endD = new Date(d.getTime() + 60 * 60 * 1000);
      const endStr = endD.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      const newOp: Operation = {
        id: Date.now(),
        title: resForm.title || 'Anlık Toplantı',
        details: `${reservedRoom.name} • ${startStr} - ${endStr}`,
        date: 'Bugün'
      };
      setOperations([newOp, ...operations]);
    }
    
    setReservingRoomId(null);
  };

  const getSlotStatusesForDate = (dateStr: string) => {
    if (!dateStr) return { occupied: [], reserving: [] };
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) hash += dateStr.charCodeAt(i);
    
    const occupied = [];
    const reserving = [];
    
    if (hash % 2 === 0) occupied.push("10:00 - 11:00");
    if (hash % 3 === 0) occupied.push("13:00 - 14:00");
    if (hash % 4 === 0) occupied.push("15:00 - 16:00");
    
    if (!occupied.includes("11:00 - 12:00")) {
      reserving.push("11:00 - 12:00");
    } else if (!occupied.includes("09:00 - 10:00")) {
      reserving.push("09:00 - 10:00");
    }

    return { occupied, reserving };
  };

  const slotStatusesEdit = getSlotStatusesForDate(editForm.date);
  const slotStatusesRes = getSlotStatusesForDate(resForm.date);

  const formatTimeLeft = (endTime: number | null) => {
    if (!endTime || !now) return "00:00";
    const diff = Math.max(0, Math.floor((endTime - now) / 1000));
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col gap-2 md:gap-3 xl:h-[calc(100vh-7.5rem)]">
      
      {/* İstatistik Kartları (shrink-0 ile sıkışmasını engelledik) */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-3 shrink-0">
        <div className="min-w-0 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-2 md:p-4 flex flex-col justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-tight transition-colors duration-300">Toplam Oda</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2 transition-colors duration-300">{stats.rooms}</h3>
            </div>
            <div className="hidden sm:block p-1.5 md:p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C] transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">domain</span>
            </div>
          </div>
         
        </div>
        
        <div className="min-w-0 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-2 md:p-4 flex flex-col justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-tight transition-colors duration-300">Rezervasyonlar</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2 transition-colors duration-300">{stats.reservations}</h3>
            </div>
            <div className="hidden sm:block p-1.5 md:p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C] transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">event</span>
            </div>
          </div>
        </div>
        
        <div className="min-w-0 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-2 md:p-4 flex flex-col justify-between transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div>
              <p className="text-[10px] md:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-tight transition-colors duration-300">Kullanım Oranı</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2 transition-colors duration-300">%{stats.usage}</h3>
            </div>
            <div className="hidden sm:block p-1.5 md:p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C] transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">trending_up</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5 mt-3 overflow-hidden transition-colors duration-300">
            <div className="bg-[#E4032C] h-2 rounded-full transition-all duration-[2000ms] ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Alt Kısım: Tablo ve Liste (flex-1 min-h-0 ile sayfa boyuna hapsedildi) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 flex-1 min-h-0">
        
        {/* GERÇEK ZAMANLI ODA YÖNETİMİ TABLOSU */}
        <div className="xl:col-span-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg overflow-hidden flex flex-col min-h-[400px] xl:min-h-0 h-full transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="p-4 border-b border-gray-200 dark:border-[#2d2d2d] flex justify-between items-center bg-gray-50 dark:bg-[#212121] transition-colors duration-300 shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Anlık Oda Durumu</h2>
            
          </div>
          <div className="overflow-auto flex-1 min-h-0 relative">
            <table className="w-full min-w-[620px] md:min-w-full table-fixed text-left border-collapse">
              {/* thead kısmına sticky top-0 eklenerek başlıklar sabitlendi */}
              <thead>
                <tr className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  <th className="w-[30%] md:w-[24%] p-2 md:p-4 font-semibold whitespace-nowrap sticky top-0 z-20 bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2d2d2d]">Oda Adı</th>
                  <th className="w-[34%] md:w-[38%] p-3 md:p-4 font-semibold whitespace-nowrap sticky top-0 z-20 bg-white dark:bg-[#1c1c1c] border-l border-b border-gray-200 dark:border-[#2d2d2d]">Kapasite & Özellikler</th>
                  <th className="w-[30%] md:w-[16%] p-2 md:p-4 md:pl-6 font-semibold whitespace-nowrap sticky top-0 z-20 bg-white dark:bg-[#1c1c1c] border-l border-b border-gray-200 dark:border-[#2d2d2d]">Durum</th>
                  {/* İşlem kısmı hem üste hem sağa sabitlendi (z-30) */}
                  <th className="w-[32%] md:w-[22%] p-2 md:p-4 font-semibold text-center sticky top-0 right-0 z-30 bg-white dark:bg-[#1c1c1c] border-l-2 border-b border-gray-300 dark:border-[#3d3d3d] transition-colors duration-300 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">İşlem</th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base text-gray-700 dark:text-gray-200">
                {rooms.map((room) => {
                  const isAvailable = room.status === 'Müsait';
                  const isOccupied = room.status === 'Dolu';

                  return (
                    <tr key={room.id} className="border-b border-gray-200 dark:border-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors duration-200 group">
                      <td className="p-3 md:p-4 font-medium text-base text-gray-900 dark:text-white whitespace-nowrap bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] transition-colors duration-200">{room.name}</td>
                      <td className="p-3 md:p-4 whitespace-nowrap bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border-l border-gray-200 dark:border-[#2d2d2d] transition-colors duration-200">
                        <div className="flex gap-2">
                          <span className="px-3 py-1.5 rounded bg-gray-100 dark:bg-[#2a2a2a] text-sm md:text-base font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">{room.capacity}</span>
                          {room.features.map(f => (
                            <span key={f} className="px-3 py-1.5 rounded bg-gray-100 dark:bg-[#2a2a2a] text-sm md:text-base font-medium text-gray-600 dark:text-gray-300 transition-colors duration-300">{f}</span>
                          ))}
                        </div>
                      </td>
                      
                      <td className="p-2 md:p-4 md:pl-6 whitespace-normal bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border-l border-gray-200 dark:border-[#2d2d2d] transition-colors duration-200">
                        <span className={`inline-flex max-w-full items-center gap-1 md:gap-2 overflow-x-auto whitespace-nowrap font-medium text-xs md:text-base ${
                          isAvailable ? 'text-emerald-600 dark:text-emerald-500' : 
                          isOccupied ? 'text-red-600 dark:text-red-500' : 'text-amber-500 dark:text-amber-400'
                        }`}>
                          <span className={`w-3 h-3 rounded-full ${
                            isAvailable ? 'bg-emerald-500' : isOccupied ? 'bg-red-600' : 'bg-amber-500'
                          }`}></span> 
                          {isAvailable ? 'Müsait' : isOccupied ? 'Dolu' : `Rezerve Ediliyor (${formatTimeLeft(room.lockEndTime)})`}
                        </span>
                      </td>

                      <td className="p-1 md:p-4 text-center sticky right-0 z-10 bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border-l-2 border-gray-300 dark:border-[#3d3d3d] transition-colors duration-200 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">
                        {isAvailable ? (
                          <button 
                            onClick={() => handleStartReservation(room.id)}
                            className="px-1.5 py-1 md:px-4 md:py-2 text-[10px] md:text-sm font-bold text-white bg-[#E4032C] hover:bg-red-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                          >
                            <span className="sm:hidden">Rezerve Et</span>
                            <span className="hidden sm:inline">Rezervasyon Yap</span>
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="px-1.5 py-1 md:px-4 md:py-2 text-[10px] md:text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg cursor-not-allowed transition-colors whitespace-nowrap"
                          >
                            <span className="sm:hidden">Rezerve Et</span>
                            <span className="hidden sm:inline">Rezervasyon Yap</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Son İşlemler (Sağ Taraf) */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg flex flex-col min-h-[400px] xl:min-h-0 h-full transition-colors duration-300 shadow-sm dark:shadow-none">
          <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] transition-colors duration-300 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">Son İşlemler</h2>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] px-2.5 py-1 rounded-full">{operations.length} İşlem</span>
          </div>
          
          {/* İçeriden kaydırma alanı */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-0">
            {operations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-3 pt-10">
                <span className="material-symbols-outlined text-5xl opacity-50">event_busy</span>
                <p className="text-sm font-medium">Yaklaşan işlem bulunmuyor</p>
              </div>
            ) : (
              operations.map((op) => (
                <div key={op.id} className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg transition-colors duration-300 border border-transparent dark:border-transparent hover:border-gray-200 dark:hover:border-[#3d3d3d]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-base text-gray-900 dark:text-white transition-colors duration-300">{op.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">{op.details}</p>
                    </div>
                    <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-gray-200 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 transition-colors duration-300">{op.date}</span>
                  </div>
                  <div className="flex justify-end gap-4 mt-2 pt-3 border-t border-gray-200 dark:border-[#3d3d3d] transition-colors duration-300">
                    <button 
                      onClick={() => setEditingOp(op)}
                      className="text-sm font-semibold text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Düzenle
                    </button>
                    <button 
                      onClick={() => setDeletingOp(op)}
                      className="text-sm font-semibold text-[#E4032C] hover:text-red-500 transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- MODALLAR --- */}

      {/* 1. HIZLI/ANLIK REZERVASYON MODALI (Saat Seçimi Yok) */}
      {reservingRoomId && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C]">add_circle</span>
                Hızlı Rezervasyon
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                  {formatTimeLeft(rooms.find(r => r.id === reservingRoomId)?.lockEndTime || null)}
                </span>
                <button onClick={handleCancelReservation} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Toplantı Başlığı</label>
                <input 
                  type="text" 
                  value={resForm.title} 
                  onChange={e => setResForm({...resForm, title: e.target.value})} 
                  placeholder="Örn: Hızlı Değerlendirme"
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded-lg bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-all" 
                />
              </div>

              <div className="bg-gray-50 dark:bg-[#2a2a2a] p-4 rounded-lg border border-gray-200 dark:border-[#333]">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <span className="material-symbols-outlined text-[#E4032C]">schedule</span>
                  <span className="text-sm font-medium leading-relaxed">Oda şu andan itibaren anlık olarak rezerve edilecektir.</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button 
                  onClick={handleCancelReservation} 
                  className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  İptal Et
                </button>
                <button 
                  onClick={handleConfirmReservation} 
                  disabled={!resForm.title.trim()}
                  className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm text-white ${!resForm.title.trim() ? 'bg-[#E4032C] opacity-50 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}
                >
                  Onayla ve Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DÜZENLEME MODALI (Saat Seçimi Devam Ediyor) */}
      {editingOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">edit_calendar</span>
                Rezervasyonu Düzenle
              </h3>
              <button onClick={() => setEditingOp(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Toplantı Başlığı</label>
                <input 
                  type="text" 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})} 
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded-lg bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tarih</label>
                <input 
                  type="date" 
                  value={editForm.date} 
                  onChange={e => setEditForm({...editForm, date: e.target.value, time: ""})} 
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded-lg bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Saat Aralığı</label>
                <div className="grid grid-cols-2 gap-3">
                  {TIME_SLOTS.map(slot => {
                    const isSelected = editForm.time === slot;
                    const isOccupied = slotStatusesEdit.occupied.includes(slot) && slot !== originalTime;
                    const isReserving = slotStatusesEdit.reserving.includes(slot) && slot !== originalTime;
                    const isDisabled = isOccupied || isReserving;
                    
                    return (
                      <button
                        key={slot}
                        disabled={isDisabled}
                        onClick={() => setEditForm({...editForm, time: slot})}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center justify-center gap-1
                          ${isSelected 
                            ? 'bg-[#E4032C] border-[#E4032C] text-white' 
                            : isOccupied 
                              ? 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60' 
                              : isReserving
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-500 cursor-not-allowed opacity-80'
                                : 'bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#3d3d3d] text-gray-700 dark:text-gray-300 hover:border-[#E4032C] hover:text-[#E4032C]'}`}
                      >
                        <span className="text-base">{slot}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${
                          isSelected ? 'text-white' : 
                          isOccupied ? 'text-gray-400 dark:text-gray-600' : 
                          isReserving ? 'text-amber-600 dark:text-amber-500' : 
                          'text-emerald-600 dark:text-emerald-500'
                        }`}>
                          {isOccupied ? 'Dolu' : isReserving ? 'İşlemde' : isSelected ? 'Seçildi' : 'Boş'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button 
                  onClick={() => setEditingOp(null)} 
                  className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  disabled={!editForm.time} 
                  className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm text-white ${!editForm.time ? 'bg-[#E4032C] opacity-50 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. İPTAL ONAY MODALI */}
      {deletingOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-sm shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C]">warning</span>
                İptal Onayı
              </h3>
            </div>
            <div className="p-6">
              <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                <strong>{deletingOp.title}</strong> işlemini iptal etmek istediğinize emin misiniz?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeletingOp(null)} 
                  className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  className="px-4 py-2.5 text-sm font-bold bg-[#E4032C] text-white hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                >
                  Evet, İptal Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}