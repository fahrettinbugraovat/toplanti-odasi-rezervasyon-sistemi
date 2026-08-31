'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id?: string; 
  fullName: string;
  username: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  role: string;
}

interface UserContextType {
  user: User;
  updateProfilePhoto: (photo: string | null) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  mounted: boolean; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User>({
    id: '', fullName: '', username: '', email: '', phone: '', profilePhoto: null, role: 'USER',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const timestamp = Date.now();
        // Tarayıcı önbelleğini (cache) kesin olarak delip geçen istek yapısı
        const response = await fetch(`/api/users?_t=${timestamp}`, { 
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const dbUser = await response.json();
          setUser({
            id: dbUser.id,
            fullName: dbUser.fullName || '',
            username: dbUser.username || '',
            email: dbUser.email || '',
            phone: dbUser.phone || '', 
            profilePhoto: dbUser.avatarUrl || null,
            role: dbUser.role || 'USER',
          });
        } else if (response.status === 401) {
          // EĞER KİMLİK GEÇERSİZSE VEYA YOKSA KULLANICIYI ZORLA LOGIN SAYFASINA AT
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setMounted(true);
      }
    };
    fetchUser();
  }, []);

  const updateProfilePhoto = async (photo: string | null) => {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: photo }) 
    });

    if (!response.ok) throw new Error("Fotoğraf kaydedilemedi.");
    const updatedData = await response.json();
    setUser((prev) => ({ ...prev, profilePhoto: updatedData.avatarUrl }));
  };

  const updateUserProfile = async (data: Partial<User>) => {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error("Bilgiler güncellenemedi.");
    const updatedData = await response.json();
    setUser((prev) => ({ 
      ...prev, 
      fullName: updatedData.fullName || '',
      username: updatedData.username || '',
      email: updatedData.email || '',
      phone: updatedData.phone || ''
    }));
  };

  return (
    <UserContext.Provider value={{ user, updateProfilePhoto, updateUserProfile, mounted }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};