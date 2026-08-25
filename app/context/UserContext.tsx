'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  role: string;
}

interface UserContextType {
  user: User;
  updateProfilePhoto: (photo: string | null) => void;
  updateUserProfile: (data: Partial<User>) => void;
  mounted: boolean; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User>({
    fullName: 'Fahrettin Buğra OVAT',
    username: 'fbovat',
    email: 'fahrettin.ovat@example.com',
    phone: '+90 555 123 45 67',
    profilePhoto: null, 
    role: 'Admin',
  });

  // Sayfa yüklendiğinde localStorage'dan çek
  useEffect(() => {
    const savedUser = localStorage.getItem('userProfile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setMounted(true);
  }, []);

  const updateProfilePhoto = (photo: string | null) => {
    setUser((prev) => {
      const updated = { ...prev, profilePhoto: photo };
      localStorage.setItem('userProfile', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserProfile = (data: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem('userProfile', JSON.stringify(updated));
      return updated;
    });
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