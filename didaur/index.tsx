
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppTab, UserProfile } from './types';
import { getCurrentUser, logoutUser, getThemePreference } from './utils/storage';
import Navigation from './components/Navigation';
import Scanner from './components/Scanner';
import Community from './components/Community';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Home from './components/Home';
import Auth from './components/Auth';

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getThemePreference());

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Mencegah pull-to-refresh di Chrome Android agar terasa seperti app asli
    document.body.style.overscrollBehaviorY = 'contain';
  }, [isDarkMode]);

  const handleAuthComplete = (newUser: UserProfile) => {
    setUser(newUser);
    setActiveTab(AppTab.HOME);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const handlePointsUpdate = (updatedUser: UserProfile) => {
    setUser({ ...updatedUser });
  };

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUser({ ...updatedUser });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  if (!user) {
    return <Auth onAuthComplete={handleAuthComplete} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-20`}>
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Didaur</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800">
            <svg className="w-4 h-4 text-green-600 fill-green-600 dark:text-green-400 dark:fill-green-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="text-sm font-bold text-green-700 dark:text-green-400">{user.points.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto">
        {activeTab === AppTab.HOME && <Home user={user} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />}
        {activeTab === AppTab.SCAN && <Scanner onPointsUpdate={handlePointsUpdate} isDarkMode={isDarkMode} />}
        {activeTab === AppTab.COMMUNITY && <Community user={user} onPointsUpdate={handlePointsUpdate} isDarkMode={isDarkMode} />}
        {activeTab === AppTab.LEADERBOARD && <Leaderboard isDarkMode={isDarkMode} />}
        {activeTab === AppTab.PROFILE && (
          <Profile 
            user={user} 
            onUpdate={handleUserUpdate} 
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}
      </main>

      {/* Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
