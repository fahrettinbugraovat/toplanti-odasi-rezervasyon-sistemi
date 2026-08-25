'use client';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

export default function ProfileSettingsPage() {
  const { user, updateUserProfile, updateProfilePhoto, mounted } = useUser();
  const { showToast } = useToast();
  
  // Profil Bilgileri State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
  });

  // Şifre State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context yüklendiğinde stateleri güncelle
  useEffect(() => {
    if (mounted) {
      setFormData({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [mounted, user]);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleProfileSave = () => {
    if (!validateEmail(formData.email)) {
      showToast({ type: 'error', title: 'Geçersiz E-posta', message: 'Lütfen geçerli bir e-posta adresi girin.' });
      return;
    }
    
    try {
      updateUserProfile(formData);
      showToast({ type: 'success', title: 'Profil Güncellendi', message: 'Profil bilgileriniz başarıyla güncellendi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.' });
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
      // Backend olmadığı için şimdilik sadece başarılı toast atıyoruz ve formu temizliyoruz
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast({ type: 'success', title: 'Şifre Değiştirildi', message: 'Şifreniz başarıyla güncellendi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', title: 'Geçersiz Format', message: 'Lütfen sadece resim dosyası seçin.' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfilePhoto(reader.result as string);
        showToast({ type: 'success', title: 'Profil Fotoğrafı Güncellendi', message: 'Profil fotoğrafınız başarıyla güncellendi.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    updateProfilePhoto(null);
    showToast({ type: 'success', title: 'Fotoğraf Kaldırıldı', message: 'Profil fotoğrafı başarıyla kaldırıldı.' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!mounted) return null;

  return (
    // max-w-[1400px] ve mx-auto ile içerik ortaya hizalandı, pb-32 ile buton için alt boşluk garantiye alındı
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
            
            {/* AVATAR YÖNETİMİ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 dark:border-[#333] shrink-0 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[48px] text-gray-400">person</span>
                )}
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333] text-gray-900 dark:text-white text-sm font-bold rounded transition-colors w-max"
                >
                  Fotoğraf Seç
                </button>
                <button 
                  onClick={handleRemovePhoto} 
                  disabled={!user.profilePhoto}
                  className="px-5 py-2 text-sm font-bold text-[#E4032C] hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-max"
                >
                  Fotoğrafı Kaldır
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kullanıcı Adı</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="05XX XXX XX XX" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
            </div>

          </div>
          <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end">
            <button onClick={handleProfileSave} className="px-8 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors">
              Kaydet
            </button>
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
          
          <div className="p-6 md:p-8 space-y-6 flex-1">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mevcut Şifre</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} placeholder="********" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-[#2d2d2d] my-6"></div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre</label>
              <input type={showPassword ? "text" : "password"} value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} placeholder="********" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre Tekrar</label>
              <input type={showPassword ? "text" : "password"} value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} placeholder="********" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
            </div>

          </div>
          <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end">
            <button onClick={handlePasswordSave} className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-200 dark:hover:bg-white dark:text-gray-900 text-white text-sm font-bold rounded shadow-sm transition-colors">
              Şifreyi Değiştir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}