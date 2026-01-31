
import React from 'react';
import { UserProfile, AppTab } from '../types';
import { getCommunityPosts } from '../utils/storage';

interface HomeProps {
  user: UserProfile;
  setActiveTab: (tab: AppTab) => void;
  isDarkMode: boolean;
}

const Home: React.FC<HomeProps> = ({ user, setActiveTab, isDarkMode }) => {
  const posts = getCommunityPosts().slice(0, 3);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 rounded-[3rem] p-8 text-white shadow-2xl shadow-green-200 dark:shadow-none transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
             <img src={user.avatar} className="w-12 h-12 rounded-2xl border-2 border-white/30" />
             <div>
               <p className="text-sm font-bold text-green-100">Halo, {user.name}!</p>
               <h1 className="text-xl font-black">{user.rank}</h1>
             </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-3xl p-4 flex justify-between items-center">
             <div>
                <p className="text-[10px] font-black text-green-100 uppercase tracking-widest">Poin Kamu</p>
                <p className="text-2xl font-black">{user.points.toLocaleString()} XP</p>
             </div>
             <button 
              onClick={() => setActiveTab(AppTab.SCAN)}
              className="bg-white text-green-700 px-4 py-2 rounded-2xl text-xs font-black shadow-lg shadow-black/10 active:scale-95 transition-all"
             >
               Scan Sekarang
             </button>
          </div>
        </div>
      </div>

      {/* Impact Tracker */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dampak Kamu</h2>
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2.5rem] border border-blue-100 dark:border-blue-800/30 flex flex-col items-center text-center transition-colors">
              <span className="text-3xl mb-2">🌍</span>
              <p className="text-xl font-black text-blue-800 dark:text-blue-400">{user.totalCo2Saved}g</p>
              <p className="text-[10px] font-black text-blue-400 dark:text-blue-600/60 uppercase tracking-tighter">CO2 Dihemat</p>
           </div>
           <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-[2.5rem] border border-amber-100 dark:border-amber-800/30 flex flex-col items-center text-center transition-colors">
              <span className="text-3xl mb-2">Box</span>
              <p className="text-xl font-black text-amber-800 dark:text-amber-400">{user.itemsScanned}</p>
              <p className="text-[10px] font-black text-amber-400 dark:text-amber-600/60 uppercase tracking-tighter">Barang Discan</p>
           </div>
        </div>
      </div>

      {/* Community Spotlight */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Inspirasi Terbaru</h2>
          <button 
            onClick={() => setActiveTab(AppTab.COMMUNITY)}
            className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest"
          >
            Lihat Semua
          </button>
        </div>
        <div className="flex space-x-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
           {posts.map(post => (
             <div key={post.id} className="flex-shrink-0 w-64 bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <img src={post.imageUrl} className="w-full h-40 object-cover" />
                <div className="p-4">
                   <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1">{post.itemName}</h3>
                   <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                         <img src={post.userAvatar} className="w-5 h-5 rounded-full" />
                         <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{post.userName}</span>
                      </div>
                      <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">#{post.materialTag}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Marketplace Promo */}
      <div className="bg-slate-900 dark:bg-slate-900/50 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl transition-colors border border-transparent dark:border-slate-800">
         <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Pasar Didaur</h3>
            <p className="text-slate-400 text-xs font-medium max-w-[150px]">Beli karya unik dari material daur ulang.</p>
            <button 
              onClick={() => setActiveTab(AppTab.COMMUNITY)}
              className="mt-2 text-green-400 font-black text-xs uppercase tracking-widest"
            >
              Kunjungi Toko →
            </button>
         </div>
         <div className="text-6xl -rotate-12">🛍️</div>
      </div>
    </div>
  );
};

export default Home;
