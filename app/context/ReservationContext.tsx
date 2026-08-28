'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Room {
  id: string;
  name: string;
  capacity: string;
  features: string[];
  status: 'Müsait' | 'Dolu' | 'Rezerve Ediliyor';
  lockEndTime: number | null;
}

export interface Reservation {
  id: string; 
  roomId: string;
  start: number;
  end: number;
  title: string;
  date: string | null;
}

export interface Operation {
  id: string; 
  title: string;
  details: string;
  date: string;
  status?: 'aktif' | 'iptal' | 'bekliyor' | 'tamamlandı'; 
  pendingChanges?: { 
    details: string;
    date: string;
  };
  createdAt?: string; 
}

export interface PendingSelection {
  roomId: string;
  slots: number[];
  date: string;
}

interface ReservationContextProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
  pendingSelection: PendingSelection | null;
  setPendingSelection: (selection: PendingSelection | null) => void;
  pendingTitle: string;
  setPendingTitle: (title: string) => void;
  requestOperationEdit: (id: string, newDetails: string, newDate: string) => void;
  approveOperationEdit: (id: string) => void;
  rejectOperationEdit: (id: string) => void;
  cancelOperation: (id: string) => void;
}

const ReservationContext = createContext<ReservationContextProps | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // YENİ EKLENDİ: cache: 'no-store'
        const response = await fetch('/api/meeting-rooms', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          const formattedRooms = data.map((room: any) => ({
            ...room,
            status: room.status || 'Müsait',
            lockEndTime: room.lockEndTime || null
          }));
          setRooms(formattedRooms);
        }
      } catch (error) {
        console.error("Odalar çekilirken hata:", error);
      }
    };

    const fetchReservations = async () => {
      try {
        // YENİ EKLENDİ VE KRİTİK: cache: 'no-store'
        const response = await fetch('/api/reservations', { cache: 'no-store' });
        if (response.ok) {
          const dbReservations = await response.json();
          
          const formattedOperations: Operation[] = dbReservations.map((res: any) => {
            const start = new Date(res.startTime);
            const end = new Date(res.endTime);
            
            const startTimeStr = start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            
            const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
            const dateStr = `${start.getDate()} ${months[start.getMonth()]}`;

            let opStatus: 'aktif' | 'iptal' | 'bekliyor' | 'tamamlandı' = 'aktif';
            if (res.status === 'CANCELLED') opStatus = 'iptal';
            if (res.status === 'PENDING') opStatus = 'bekliyor';
            if (res.status === 'COMPLETED') opStatus = 'tamamlandı';

            return {
              id: res.id,
              title: res.title,
              details: `${res.room?.name || 'Bilinmeyen Oda'} • ${startTimeStr} - ${endTimeStr}`,
              date: dateStr,
              status: opStatus,
              createdAt: res.createdAt 
            };
          });

          setOperations(formattedOperations);
          setReservations(dbReservations);
        }
      } catch (error) {
        console.error("Rezervasyonlar çekilirken hata:", error);
      }
    };

    fetchRooms();
    fetchReservations();
    setMounted(true);
  }, []);

  const cancelOperation = (id: string) => {
    setOperations(prev => prev.map(op => op.id === id ? { ...op, status: 'iptal' } : op));
  };

  const requestOperationEdit = (id: string, newDetails: string, newDate: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, status: 'bekliyor', pendingChanges: { details: newDetails, date: newDate } } : op
    ));
  };

  const approveOperationEdit = (id: string) => {
    setOperations(prev => prev.map(op => {
      if (op.id === id && op.pendingChanges) {
        return { 
          ...op, details: op.pendingChanges.details, date: op.pendingChanges.date, 
          status: 'aktif', pendingChanges: undefined 
        };
      }
      return op;
    }));
  };

  const rejectOperationEdit = (id: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, status: 'aktif', pendingChanges: undefined } : op
    ));
  };

  return (
    <ReservationContext.Provider value={{ 
      rooms, setRooms, reservations, setReservations, operations, setOperations,
      pendingSelection, setPendingSelection, pendingTitle, setPendingTitle,
      requestOperationEdit, approveOperationEdit, rejectOperationEdit, cancelOperation
    }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservationData = () => {
  const context = useContext(ReservationContext);
  if (!context) throw new Error("useReservationData must be used within a ReservationProvider");
  return context;
};