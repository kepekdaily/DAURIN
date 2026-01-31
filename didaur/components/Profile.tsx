
import React, { useState, useEffect } from 'react';
import { UserProfile, Badge, PurchasedItem } from '../types';
import { updateAccountInfo, setThemePreference, BADGES } from '../utils/storage';

interface ProfileProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onLogout, isDarkMode, onToggleDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah dalam mode standalone (terinstall)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const nextRankPoints = 5000;
  const progress = (user.points / nextRankPoints) * 100;

  const handleSaveProfile = () => {
    const updated = updateAccountInfo(name, avatar);
    if (updated) {
      onUpdate(updated);
      setIsEditing(false);
    }
  };

  const handleToggle = () => {
    const newVal = !isDarkMode;
    onToggleDarkMode();
    setThemePreference(newVal);
  };

  const menuItems = [
    { label: 'Keamanan Akun', icon: '🔒', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { label: 'Notifikasi & Suara', icon: '🔔', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
    { label: 'Metode Pembayaran', icon: '💳', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
    { label: 'Pusat Bantuan', icon: '❓', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
    { label: 'Syarat & Ketentuan', icon: '📄', color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  ];

  const purchasedItems = user.purchasedItems || [];

  return (
    <div className="p-6 space-y-8 pb-32 animate-in fade-in duration-500">
      {/* PWA Install Banner - Only shows if not installed and prompt is available */}
      {deferredPrompt && !isInstalled && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-[2.5rem] p-6 text-white shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex-1 pr-4">
            <h4 className="font-black text-sm">Pasang Aplikasi Didaur</h4>
            <p className="text-[10px] font-medium opacity-90 mt-1">Akses lebih cepat & hemat kuota langsung dari layar utama HP kamu!</p>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-green-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
          >
            Pasang
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-4">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-tr from-green-600 via-emerald-400 to-green-100 rounded-full blur-xl opacity-40 animate-pulse"></div>
          <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-colors">
            <img src={avatar} className="w-full h-full object-cover" />
            {isEditing && (
              <button 
                onClick={() => setAvatar(`https://picsum.photos/seed/${Math.random()}/200/200`)}
                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all"
              >
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="text-[10px] font-black uppercase text-white">Ubah</span>
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="w-full max-w-xs space-y-4">
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-center outline-none focus:ring-2 ring-green-500 shadow-sm dark:text-white transition-colors"
              placeholder="Nama Lengkap"
            />
            <div className="flex space-x-2">
              <button onClick={handleSaveProfile} className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">SIMPAN</button>
              <button onClick={() => setIsEditing(false)} className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all">BATAL</button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">{user.name}</h2>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 dark:border-green-800 transition-colors">{user.rank}</span>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1 text-slate-400 hover:text-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
        <div className="flex justify-between items-end">
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">Progress Pahlawan</span>
          <span className="text-xs font-bold text-slate-400">{user.points} / {nextRankPoints} XP</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-full overflow-hidden p-1 shadow-inner">
          <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-[2rem] border border-green-100 dark:border-green-800/30 text-center">
            <p className="text-xl font-black text-green-600 dark:text-green-400">{user.totalCo2Saved}g</p>
            <p className="text-[9px] font-black text-green-800/60 dark:text-green-400/60 uppercase tracking-tighter leading-none mt-1">CO2 Dihemat</p>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30 text-center">
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{user.itemsScanned}</p>
            <p className="text-[9px] font-black text-emerald-800/60 dark:text-emerald-400/60 uppercase tracking-tighter leading-none mt-1">Sampah Discan</p>
          </div>
        </div>
      </div>

      {/* Purchase History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center">
            <span className="mr-3 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl transition-colors">🛍️</span> Riwayat Pembelian
          </h3>
          {purchasedItems.length > 0 && (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{purchasedItems.length} Item</span>
          )}
        </div>
        
        {purchasedItems.length > 0 ? (
          <div className="space-y-4">
            {purchasedItems.map((item, idx) => (
              <div 
                key={item.id + item.purchaseDate + idx} 
                className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-5 animate-in slide-in-from-bottom-4 transition-all hover:shadow-md"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative">
                  <img src={item.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-50 dark:border-slate-800" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight mb-1">{item.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                    {new Date(item.purchaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-black text-green-600 dark:text-green-400">{item.price.toLocaleString()} XP</span>
                  <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">Terbayar</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] text-center border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 opacity-50">🛒</div>
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Belum ada transaksi di pasar.</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 font-bold">Ayo kumpulkan XP dan miliki karya daur ulang unik!</p>
          </div>
        )}
      </div>

      {/* Badge Collection */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight px-2 flex items-center">
          <span className="mr-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl transition-colors">🏅</span> Koleksi Lencana
        </h3>
        <div className="grid grid-cols-5 gap-3 px-1">
          {BADGES.map(badge => (
            <div 
              key={badge.id} 
              className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all relative group cursor-help shadow-sm ${
                user.badges.includes(badge.id) 
                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 grayscale-0' 
                : 'bg-slate-100 dark:bg-slate-800 border border-transparent grayscale'
              }`}
            >
              {badge.icon}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-2xl text-[9px] font-bold text-center opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[100] shadow-2xl border border-white/10 scale-90 group-hover:scale-100">
                 <p className="font-black mb-1.5 text-amber-400 uppercase tracking-widest">{badge.name}</p>
                 <p className="opacity-90 leading-relaxed">{badge.description}</p>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight px-2 flex items-center">
          <span className="mr-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">🌓</span> Opsi & Tampilan
        </h3>
        <button 
          onClick={handleToggle}
          className="w-full bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110">
              {isDarkMode ? '🌙' : '☀️'}
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Mode Gelap</span>
          </div>
          <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-green-600' : 'bg-slate-200'}`}>
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </button>

        {menuItems.map((item, idx) => (
          <button key={idx} className="w-full bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all group transition-colors">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110`}>{item.icon}</div>
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
            </div>
            <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        ))}
      </div>

      <button onClick={onLogout} className="w-full bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 p-6 rounded-[2.5rem] font-black flex items-center justify-center space-x-3 active:scale-[0.98] transition-all border border-rose-100 dark:border-rose-900/30">
        <span>Keluar Akun</span>
      </button>
    </div>
  );
};

export default Profile;
