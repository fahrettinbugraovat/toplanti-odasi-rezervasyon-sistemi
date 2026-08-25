'use client';
import { useState, useEffect } from 'react';
import { useReservationData } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext'; 
import { useToast } from '../context/ToastContext'; 

const TIME_SLOTS = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"];

export default function MyMeetingsPage() {
  const { rooms, operations, requestOperationEdit, cancelOperation } = useReservationData();
  const { theme } = useTheme(); 
  const { showToast } = useToast(); 
  
  const [activeTab, setActiveTab] = useState<'gelecek' | 'iptal'>('gelecek');

  const [editingOp, setEditingOp] = useState<any>(null);
  const [confirmEditOp, setConfirmEditOp] = useState<any>(null); 
  const [editForm, setEditForm] = useState({ title: '', room: '', time: '', date: '' });
  const [originalTime, setOriginalTime] = useState("");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getLocalYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getLocalYYYYMMDD(new Date());

  const formatDateForList = (dateString: string) => {
    if (!dateString) return "Belirsiz"; 
    const d = new Date(dateString); 
    if (isNaN(d.getTime())) return "Belirsiz";
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const isPastOperationDay = (op: any) => {
    if (!now) return false;
    const currentYear = new Date(now).getFullYear();
    const todayStrLocal = getLocalYYYYMMDD(new Date(now));
    
    if (op.date === 'Bugün' || op.date === 'Yarın') return false;
    
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const parts = (op.date || "").split(' ');
    
    if (parts.length === 2) {
       const day = parseInt(parts[0], 10);
       const monthIndex = months.indexOf(parts[1]);
       if (monthIndex !== -1 && !isNaN(day)) {
          const m = String(monthIndex + 1).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          const opDateStr = `${currentYear}-${m}-${d}`;
          return opDateStr < todayStrLocal; 
       }
    }
    return false;
  };

  const getAllBlocks = () => {
    const blocks: any[] = [];
    operations.forEach((op: any) => {
      if (op.status === 'iptal') return;
      if (op.status === 'bekliyor') {
        blocks.push({ ...op });
        if (op.pendingChanges) {
          blocks.push({ ...op, date: op.pendingChanges.date, details: op.pendingChanges.details });
        }
      } else {
        blocks.push({ ...op });
      }
    });
    return blocks;
  };

  useEffect(() => {
    if (editingOp) {
      const [room, timeStr] = editingOp.details.split(' • ');
      let parsedDate = todayStr; 
      
      setEditForm({ 
        title: editingOp.title, 
        room: room || "", 
        time: timeStr || "", 
        date: parsedDate 
      });
      setOriginalTime(timeStr || "");
    }
  }, [editingOp, todayStr]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setEditingOp(null); setConfirmEditOp(null); } };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  const handlePreSaveEdit = () => {
    if (!editingOp) return;
    setConfirmEditOp(editingOp);
    setEditingOp(null);
  };

  const handleSendToApproval = () => {
    if (!confirmEditOp) return;
    try {
      const newDetails = `${editForm.room} • ${editForm.time}`;
      const newDate = formatDateForList(editForm.date);
      requestOperationEdit(confirmEditOp.id, newDetails, newDate);
      setConfirmEditOp(null);
      showToast({ type: 'success', title: 'Onaya Gönderildi', message: 'Rezervasyon değişikliğiniz yönetici onayına gönderildi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Değişiklik talebi gönderilemedi.' });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      cancelOperation(id);
      showToast({ type: 'success', title: 'Rezervasyon İptal Edildi', message: 'Rezervasyon başarıyla iptal edildi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'İşlem gerçekleştirilemedi.' });
    }
  };

  const displayedOperations = operations.filter((op: any) => {
    if (activeTab === 'iptal') return op.status === 'iptal';
    if (activeTab === 'gelecek') return op.status !== 'iptal' && !isPastOperationDay(op); 
    return false; 
  });

  // Modal içerisindeki dolu saatleri bulma
  let occupiedSlots: string[] = [];
  if (editingOp && now) {
    const formattedDate = formatDateForList(editForm.date);
    const allBlocks = getAllBlocks();
    
    allBlocks.forEach((block: any) => {
      const isTodayMatch = (block.date === 'Bugün' && formattedDate === formatDateForList(getLocalYYYYMMDD(new Date(now))));
      if (block.date === formattedDate || isTodayMatch) {
        const parts = (block.details || '').split(' • ');
        if (parts.length >= 2 && parts[0].trim() === editForm.room && parts[1].trim().includes(' - ')) {
          const opStartHour = parseInt(parts[1].trim().split(' - ')[0].split(':')[0], 10);
          const opEndHour = parseInt(parts[1].trim().split(' - ')[1].split(':')[0], 10);
          TIME_SLOTS.forEach(slot => {
            const slotStartHour = parseInt(slot.split(' - ')[0].split(':')[0], 10);
            if (slotStartHour >= opStartHour && slotStartHour < opEndHour) {
              occupiedSlots.push(slot);
            }
          });
        }
      }
    });
  }

  return (
    <div className="w-full flex flex-col h-full gap-6 relative">
      
      
      <div className="flex border-b border-gray-200 dark:border-[#2d2d2d] shrink-0 gap-6">
        <button onClick={() => setActiveTab('gelecek')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'gelecek' ? 'text-[#E4032C]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
          Gelecek {activeTab === 'gelecek' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
       
        <button onClick={() => setActiveTab('iptal')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'iptal' ? 'text-[#E4032C]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
          İptal Edilenler {activeTab === 'iptal' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
      </div>

      <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg overflow-x-auto shadow-sm dark:shadow-none">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#212121]">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-[#2d2d2d]">ODA</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-[#2d2d2d]">TARİH & SAAT</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-gray-200 dark:border-[#2d2d2d]">DÜZENLEYEN</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right border border-gray-200 dark:border-[#2d2d2d]">İŞLEMLER</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-200">
            {displayedOperations.length > 0 ? (
              displayedOperations.map((op: any) => {
                const [roomName, timeStr] = op.details.split(' • ');
                const roomObj = rooms?.find((r: any) => r.name === roomName);
                const capacityStr = roomObj ? roomObj.capacity : 'Bilinmiyor';
                const isCancelled = op.status === 'iptal';
                const isPending = op.status === 'bekliyor';

                return (
                  <tr key={op.id} className={`transition-colors group ${isCancelled ? 'bg-gray-50/50 dark:bg-[#1a1a1a]/50 opacity-75' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}>
                    <td className="px-6 py-4 border border-gray-200 dark:border-[#2d2d2d]">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded border flex items-center justify-center shrink-0 ${isCancelled ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-500' : 'bg-gray-100 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400'}`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {isCancelled ? 'event_busy' : 'meeting_room'}
                          </span>
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isCancelled ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{roomName || op.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Merkez • {capacityStr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border border-gray-200 dark:border-[#2d2d2d]">
                      <div>
                        <p className={`font-bold text-sm ${isCancelled ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{op.date}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{timeStr}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 border border-gray-200 dark:border-[#2d2d2d]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333] flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">FB</div>
                        <span className={`text-sm font-semibold ${isCancelled ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>Fahrettin Buğra</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right border border-gray-200 dark:border-[#2d2d2d]">
                      <div className="flex items-center justify-end gap-2">
                        {isCancelled ? (
                          <span className="px-3 py-1 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded uppercase tracking-wider">İPTAL EDİLDİ</span>
                        ) : isPending ? (
                          <span className="px-3 py-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500 border border-amber-100 dark:border-amber-900/30 rounded uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> Onay Bekliyor
                          </span>
                        ) : (
                          <>
                            <button onClick={() => setEditingOp(op)} className="p-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444] rounded shadow-sm" title="Düzenle">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button onClick={() => handleCancel(op.id)} className="p-2 text-gray-700 dark:text-gray-200 hover:text-white hover:bg-[#E4032C] transition-colors bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444] hover:border-[#E4032C] rounded shadow-sm" title="İptal Et">
                              <span className="material-symbols-outlined text-[20px]">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : null}
          </tbody>
        </table>
        {displayedOperations.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
            <p className="text-sm font-semibold">Bu kategoride kayıt bulunmuyor.</p>
          </div>
        )}
      </div>

      {editingOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">edit_calendar</span>
                Rezervasyonu Düzenle
              </h3>
              <button onClick={() => setEditingOp(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Toplantı Başlığı</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tarih</label>
                <input 
                  type="date" 
                  min={todayStr}
                  value={editForm.date} 
                  onChange={e => setEditForm({...editForm, date: e.target.value, time: ""})} 
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert" 
                  style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Saat Aralığı</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* FİLTRELEME: Eğer Seçili Tarih Bugün ise, Sadece Gelecek Saatleri Göster */}
                  {TIME_SLOTS.filter(slot => {
                    if (!now || !editForm.date) return true;
                    const todayStrLocal = getLocalYYYYMMDD(new Date(now));
                    
                    if (editForm.date === todayStrLocal) {
                      const startHourNum = parseInt(slot.split(' - ')[0].split(':')[0], 10);
                      const startMinNum = parseInt(slot.split(' - ')[0].split(':')[1], 10);
                      const d = new Date(now);
                      const currentTotalMins = d.getHours() * 60 + d.getMinutes();
                      const startTotalMins = startHourNum * 60 + startMinNum;
                      
                      // Geçmiş saatler gizlenir (Ancak kullanıcının kendi orjinal saati daima görünür kalır)
                      if (startTotalMins <= currentTotalMins && slot !== originalTime) {
                        return false;
                      }
                    }
                    return true;
                  }).map(slot => {
                    const isSelected = editForm.time === slot; 
                    const isOccupied = occupiedSlots.includes(slot) && slot !== originalTime; 
                    const isDisabled = isOccupied;
                    
                    return (
                      <button key={slot} disabled={isDisabled} onClick={() => setEditForm({...editForm, time: slot})} className={`p-3 rounded border text-base font-semibold flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'bg-[#E4032C] border-[#E4032C] text-white' : isOccupied ? 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60' : 'bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#3d3d3d] text-gray-700 dark:text-gray-300 hover:border-[#E4032C] hover:text-[#E4032C]'}`}>
                        <span>{slot}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-white' : isOccupied ? 'text-gray-400 dark:text-gray-600' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          {isOccupied ? 'Dolu' : isSelected ? 'Seçildi' : 'Boş'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button onClick={() => setEditingOp(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">İptal</button>
                <button onClick={handlePreSaveEdit} disabled={!editForm.time} className={`px-5 py-2.5 text-sm font-bold rounded text-white ${!editForm.time ? 'bg-[#E4032C] opacity-50 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONAYA GÖNDERME UYARI MODALI */}
      {confirmEditOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">info</span>
                Rezervasyon Değişikliği
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">Yaptığınız değişiklik yönetici onayına gönderilecektir. Onaylanana kadar mevcut rezervasyonunuz geçerli kalacaktır.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setConfirmEditOp(null); setEditingOp(confirmEditOp); }} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Vazgeç</button>
                <button onClick={handleSendToApproval} className="px-4 py-2 text-sm font-bold bg-[#E4032C] text-white hover:bg-red-700 rounded transition-colors">Onaya Gönder</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}