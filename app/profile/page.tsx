'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { HarButton } from '../components/ui/HarUI';

// BAŞ HARFLERİ BULAN FONKSİYON EKLENDİ
const getInitials = (name: string) => {
  if (!name) return 'K'; // İsim yoksa varsayılan

  // Fazla boşlukları temizleyip kelimeleri ayırıyoruz
  const nameArray = name.trim().split(' ').filter(Boolean);
  
  if (nameArray.length === 0) return 'K';
  if (nameArray.length === 1) return nameArray[0].charAt(0).toUpperCase();
  
  // İlk kelimenin ilk harfi + Son kelimenin ilk harfi
  const firstInitial = nameArray[0].charAt(0);
  const lastInitial = nameArray[nameArray.length - 1].charAt(0);
  
  return (firstInitial + lastInitial).toUpperCase();
};

export default function ProfileSettingsPage() {
  const { user, updateUserProfile, mounted } = useUser();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (mounted) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [mounted, user]);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleProfileSave = async () => {
    if (!validateEmail(formData.email)) {
      showToast({ type: 'error', title: 'Geçersiz E-posta', message: 'Lütfen geçerli bir e-posta adresi girin.' });
      return;
    }
    
    try {
      await updateUserProfile(formData);
      showToast({ type: 'success', title: 'Profil Güncellendi', message: 'Profil bilgileriniz kalıcı olarak kaydedildi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Veritabanına kaydedilemedi. Lütfen tekrar deneyin.' });
    }
  };

  const handlePasswordSave = () => {
    if (!passData.currentPassword || !passData.newPassword || !passData.confirmPassword) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Lütfen tüm şifre alanlarını doldurun.' });
      return;
    }

    if (passData.newPassword !== passData.confirmPassword) {
      showToast({ type: 'error', title: 'Şifreler Uyuşmuyor', message: 'Yeni şifreler aynı olmalıdır.' });
      return;
    }

    try {
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast({ type: 'success', title: 'Şifre Değiştirildi', message: 'Şifreniz başarıyla güncellendi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.' });
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 md:gap-8 pb-32 overflow-y-auto">
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        
        {/* PROFIL BİLGİLERİ KARTI */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm dark:shadow-none overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 text-[22px]">manage_accounts</span>
              Profil Bilgileri
            </h2>
          </div>
          
          <div className="p-6 md:p-8 space-y-8 flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              
              {/* YENİ AVATAR TASARIMI */}
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white dark:border-[#1c1c1c] shadow-sm shrink-0 bg-[#E4032C] flex items-center justify-center text-white text-4xl font-bold select-none">
                {getInitials(formData.fullName || user.fullName)}
              </div>

              <div className="flex flex-col gap-3 pt-2">
              </div>
            </div>

            <form autoComplete="off" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
                <input type="text" autoComplete="off" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kullanıcı Adı</label>
                <input type="text" autoComplete="off" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
                <input type="email" autoComplete="off" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
                <input type="tel" autoComplete="off" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="05XX XXX XX XX" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
            </form>

          </div>
          <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end">
            <HarButton onClick={handleProfileSave} color="red" className="px-8 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors">
              Kaydet
            </HarButton>
          </div>
        </div>

        {/* GÜVENLİK VE ŞİFRE KARTI */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm dark:shadow-none overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 text-[22px]">lock</span>
              Şifre ve Güvenlik
            </h2>
          </div>
          
          <form autoComplete="off" className="p-6 md:p-8 space-y-6 flex-1">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mevcut Şifre</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} placeholder="********" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] pr-10 [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-[#2d2d2d] my-6"></div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre</label>
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} placeholder="********" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre Tekrar</label>
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} placeholder="********" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]" />
            </div>

          </form>
          <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end">
            <HarButton onClick={handlePasswordSave} color="red" className="px-6 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors">
              Şifreyi Değiştir
            </HarButton>
          </div>
        </div>

      </div>
    </div>
  );
}