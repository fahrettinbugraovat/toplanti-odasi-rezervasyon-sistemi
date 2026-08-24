'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Not: context yolunu kendi klasör yapına göre ayarlayabilirsin (örn: '@/app/context/ToastContext')
import { useToast } from '../context/ToastContext'; 

export default function ProfileSettingsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  
  // Yüklenme durumları
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isUsernameSaving, setIsUsernameSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);

  // Dosya Yükleme (Profil Fotoğrafı) için State'ler
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State'leri
  const [profile, setProfile] = useState({
    fullName: 'Fahrettin Buğra OVAT',
    email: 'fahrettin.ovat@example.com',
    phone: '+90 555 123 45 67',
  });
  const [username, setUsername] = useState('fbovat');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Şifre görünürlük durumları
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Bildirim State'leri
  const [notifications, setNotifications] = useState({ reservationNotifs: true, reminderNotifs: true, emailNotifs: false });

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ==========================================
  // PROFİL FOTOĞRAFI İŞLEYİCİLERİ (YENİ)
  // ==========================================
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sadece resim dosyalarına izin ver
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Hatalı Format', message: 'Lütfen sadece geçerli bir resim dosyası seçin.' });
      return;
    }

    // Seçilen dosyayı kaydetme ihtimaline karşı state'te tutuyoruz
    setSelectedFile(file);

    // Ekranda anlık önizlemek için FileReader kullanıyoruz
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;
    setIsPhotoSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // API Yükleme Simülasyonu
      showToast({ type: 'success', title: 'Profil Fotoğrafı Güncellendi', message: 'Profil fotoğrafınız başarıyla güncellendi.' });
      setSelectedFile(null); // Kayıt başarılı olunca butonu gizle
    } catch {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Fotoğraf güncellenirken bir hata oluştu.' });
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast({ type: 'success', title: 'Fotoğraf Kaldırıldı', message: 'Profil fotoğrafınız başarıyla kaldırıldı.' });
  };

  // ==========================================
  // DİĞER PROFİL İŞLEYİCİLERİ
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast({ type: 'success', title: 'Profil Güncellendi', message: 'Profil bilgileriniz başarıyla güncellendi.' });
    } catch {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Profil bilgileriniz güncellenirken bir hata oluştu.' });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUsernameSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast({ type: 'success', title: 'Kullanıcı Adı Güncellendi', message: 'Kullanıcı adınız başarıyla değiştirildi.' });
    } catch {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Kullanıcı adınız güncellenirken bir hata oluştu.' });
    } finally {
      setIsUsernameSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast({ type: 'error', title: 'Şifreler Uyuşmuyor', message: 'Girdiğiniz yeni şifreler aynı olmalıdır.' });
      return;
    }
    setIsPasswordSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast({ type: 'success', title: 'Şifre Değiştirildi', message: 'Şifreniz başarıyla değiştirildi.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Şifreniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => router.push('/login');

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    showToast({ type: 'success', title: 'Hesap Silindi', message: 'Hesabınız kalıcı olarak silinmiştir.' });
    setTimeout(() => router.push('/login'), 1500);
  };

  const ToggleSwitch = ({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      <button type="button" onClick={onToggle} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-[#E4032C]' : 'bg-gray-200 dark:bg-[#3d3d3d]'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6 h-full overflow-y-auto pb-12">
      
      <div className="shrink-0 max-w-4xl mx-auto w-full px-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Profil Ayarları</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">Hesabınızı ve kişisel bilgilerinizi yönetin.</p>
      </div>

      <div className="max-w-4xl mx-auto w-full px-2 flex flex-col gap-6">
        
        {/* 1. PROFİL BİLGİLERİ */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl shadow-sm dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">person</span>
              Profil Bilgileri
            </h3>
          </div>
          
          <div className="p-6 md:p-8">
            {/* PROFİL FOTOĞRAFI BÖLÜMÜ */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 pb-8 border-b border-gray-100 dark:border-[#2d2d2d]">
              
              {/* Gizli Dosya Seçici */}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handlePhotoChange} 
              />
              
              <div 
                className="relative group cursor-pointer shrink-0" 
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profil Önizleme" className="w-24 h-24 rounded-full object-cover border border-gray-200 dark:border-[#3d3d3d] group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3d3d3d] flex items-center justify-center text-3xl font-bold text-gray-400 dark:text-gray-500 overflow-hidden group-hover:opacity-80 transition-opacity">
                    FB
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-bold bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#444] rounded transition-colors">
                    Fotoğraf Seç
                  </button>
                  
                  {avatarPreview && (
                    <button type="button" onClick={handleRemovePhoto} className="px-4 py-2 text-sm font-bold text-[#E4032C] hover:bg-red-50 dark:hover:bg-red-900/10 border border-transparent rounded transition-colors">
                      Fotoğrafı Kaldır
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">Önerilen boyut: 256x256px. Maksimum 2MB.</p>
                
                {/* SADECE YENİ BİR FOTOĞRAF SEÇİLDİĞİNDE "KAYDET" BUTONU GÖRÜNÜR */}
                {selectedFile && (
                  <button type="button" onClick={handleSavePhoto} disabled={isPhotoSaving} className={`mt-2 px-5 py-2 text-sm font-bold rounded text-white flex items-center gap-2 transition-all ${isPhotoSaving ? 'bg-[#E4032C] opacity-70 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700 shadow-sm'}`}>
                    {isPhotoSaving ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">cloud_upload</span>}
                    {isPhotoSaving ? 'Yükleniyor...' : 'Seçilen Fotoğrafı Kaydet'}
                  </button>
                )}
              </div>
            </div>

            {/* AD SOYAD / EMAIL FORMU */}
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
                  <input type="text" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} required className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefon (İsteğe Bağlı)</label>
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">E-posta Adresi</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} required className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isProfileSaving} className={`px-6 py-2.5 text-sm font-bold rounded text-white flex items-center gap-2 transition-all ${isProfileSaving ? 'bg-[#E4032C] opacity-70 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}>
                  {isProfileSaving ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : 'Bilgileri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 2. KULLANICI ADI DEĞİŞTİR */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl shadow-sm dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">badge</span>
              Kullanıcı Adı
            </h3>
          </div>
          <form onSubmit={handleSaveUsername} className="p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Kullanıcı Adı</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full pl-8 p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Kullanıcı adınız giriş yapmak ve profil bağlantınız için kullanılır.</p>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isUsernameSaving} className={`px-6 py-2.5 text-sm font-bold rounded text-white flex items-center gap-2 transition-all ${isUsernameSaving ? 'bg-[#E4032C] opacity-70 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}>
                {isUsernameSaving ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : 'Güncelle'}
              </button>
            </div>
          </form>
        </div>

        {/* 3. ŞİFRE VE GÜVENLİK */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl shadow-sm dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">lock</span>
              Şifre ve Güvenlik
            </h3>
          </div>
          <form onSubmit={handleSavePassword} className="p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mevcut Şifre</label>
              <div className="relative">
                <input type={showCurrentPw ? "text" : "password"} value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} required className="w-full p-3 pr-10 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <span className="material-symbols-outlined text-[20px]">{showCurrentPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre</label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} required minLength={6} className="w-full p-3 pr-10 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <span className="material-symbols-outlined text-[20px]">{showNewPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Yeni Şifre Tekrarı</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} required minLength={6} className="w-full p-3 pr-10 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isPasswordSaving} className={`px-6 py-2.5 text-sm font-bold rounded flex items-center gap-2 transition-all ${isPasswordSaving ? 'bg-gray-200 dark:bg-[#333] text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] border border-gray-300 dark:border-[#444]'}`}>
                {isPasswordSaving ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : 'Şifreyi Değiştir'}
              </button>
            </div>
          </form>
        </div>

        {/* 4. BİLDİRİM AYARLARI */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl shadow-sm dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">notifications</span>
              Bildirim Ayarları
            </h3>
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            <ToggleSwitch label="Rezervasyon Bildirimleri" enabled={notifications.reservationNotifs} onToggle={() => handleToggleNotification('reservationNotifs')} />
            <ToggleSwitch label="Rezervasyon Hatırlatıcıları" enabled={notifications.reminderNotifs} onToggle={() => handleToggleNotification('reminderNotifs')} />
            <ToggleSwitch label="E-posta Bildirimleri" enabled={notifications.emailNotifs} onToggle={() => handleToggleNotification('emailNotifs')} />
          </div>
        </div>

        {/* 5. HESAP İŞLEMLERİ */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl shadow-sm dark:shadow-none overflow-hidden mb-6">
          <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">manage_accounts</span>
              Hesap İşlemleri
            </h3>
          </div>
          <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4">
            <button onClick={handleLogout} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-[#444] rounded transition-colors">
              Oturumu Kapat
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-[#E4032C] dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded transition-colors">
              Hesabı Sil
            </button>
          </div>
        </div>

      </div>

      {/* HESABI SİL ONAY MODALI */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C] text-[20px]">warning</span>
                Hesabı Sil
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                Hesabınızı silmek istediğinize emin misiniz? <br/><br/>
                <span className="text-[#E4032C] dark:text-red-400 font-bold">Bu işlem geri alınamaz</span> ve tüm rezervasyon geçmişiniz silinir.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] border border-transparent rounded transition-colors">
                  Vazgeç
                </button>
                <button onClick={handleDeleteAccount} className="px-5 py-2.5 text-sm font-bold bg-[#E4032C] hover:bg-red-700 text-white rounded shadow-sm transition-colors">
                  Evet, Hesabımı Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}