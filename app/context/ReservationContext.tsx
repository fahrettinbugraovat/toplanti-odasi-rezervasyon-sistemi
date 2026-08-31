'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
  status?: string;
  userId?: string;
  user?: any;
}

export interface Operation {
  id: string;
  title: string;
  details: string;
  date: string;
  status?: 'aktif' | 'iptal' | 'tamamlandı';
  createdAt?: string;
  originalData?: any;
}

interface ReservationContextProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
  requestOperationEdit: (id: string, updatedData: any) => Promise<void>;
  cancelOperation: (id: string) => Promise<void>;
  refreshReservations: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextProps | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch(`/api/meeting-rooms?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.map((room: any) => ({ ...room, status: room.status || 'Müsait', lockEndTime: room.lockEndTime || null })));
      }
    } catch (error) {
      console.error('Odalar çekilirken hata:', error);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      const response = await fetch(`/api/reservations?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });

      if (response.ok) {
        const dbReservations = await response.json();

        const formattedReservations = dbReservations.map((res: any) => {
          const startObj = new Date(res.startTime);
          const endObj = new Date(res.endTime);
          const year = startObj.getFullYear();
          const month = String(startObj.getMonth() + 1).padStart(2, '0');
          const day = String(startObj.getDate()).padStart(2, '0');

          return {
            ...res,
            start: startObj.getHours() + startObj.getMinutes() / 60,
            end: endObj.getHours() + endObj.getMinutes() / 60,
            date: `${year}-${month}-${day}`
          };
        });

        const formattedOperations: Operation[] = dbReservations.map((res: any) => {
          const start = new Date(res.startTime);
          const end = new Date(res.endTime);

          const startTimeStr = start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
          const dateStr = `${start.getDate()} ${months[start.getMonth()]}`;

          let opStatus: 'aktif' | 'iptal' | 'tamamlandı' = 'aktif';
          if (res.status === 'CANCELLED') opStatus = 'iptal';
          else if (res.status === 'COMPLETED') opStatus = 'tamamlandı';

          return {
            id: res.id,
            title: res.title,
            details: `${res.room?.name || 'Bilinmeyen Oda'} • ${startTimeStr} - ${endTimeStr}`,
            date: dateStr,
            status: opStatus,
            createdAt: res.createdAt,
            originalData: res
          };
        });

        setOperations(formattedOperations);
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Rezervasyonlar çekilirken hata:', error);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchReservations();
  }, [fetchRooms, fetchReservations]);

  const cancelOperation = async (id: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'CANCELLED' })
      });
      if (response.ok) await fetchReservations();
      else throw new Error('İptal edilemedi.');
    } catch (error: any) {
      throw error;
    }
  };

  const requestOperationEdit = async (id: string, updatedData: any) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İşlem reddedildi.');
      }
      await fetchReservations();
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <ReservationContext.Provider value={{
      rooms,
      setRooms,
      reservations,
      setReservations,
      operations,
      setOperations,
      requestOperationEdit,
      cancelOperation,
      refreshReservations: fetchReservations
    }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservationData = () => {
  const context = useContext(ReservationContext);
  if (!context) throw new Error('Context Hatası');
  return context;
};