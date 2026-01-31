
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetUserPassword } from '../utils/storage';
import { UserProfile } from '../types';

interface AuthProps {
  onAuthComplete: (user: UserProfile) => void;
  isDarkMode: boolean;
}

const Auth: React.FC<AuthProps> = ({ onAuthComplete, isDarkMode }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset messages when switching modes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [authMode]);

  const validateEmail = (e: string) => {
    return String(e)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Format email tidak valid.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      if (authMode === 'login') {
        const user = loginUser(email, password);
        if (user) {
          onAuthComplete(user);
        } else {
          setError('Email atau password salah.');
        }
      } else if (authMode === 'register') {
        if (!name || password.length < 6) {
          setError(password.length < 6 ? 'Password minimal 6 karakter.' : 'Nama harus diisi.');
          setIsLoading(false);
          return;
        }
        const user = registerUser(name, email, password);
        onAuthComplete(user);
      } else if (authMode === 'forgot') {
        // Alur lupa password: Cek email dulu
        const accounts = JSON.parse(localStorage.getItem('didaur_accounts_v3') || '{}');
        if (accounts[email]) {
          setSuccess('Email ditemukan! Silakan buat password baru.');
          setAuthMode('reset');
        } else {
          setError('Email tidak terdaftar dalam sistem kami.');
        }
      } else if (authMode === 'reset') {
        if (password.length < 6) {
          setError('Password baru minimal 6 karakter.');
          setIsLoading(false);
          return;
        }
        const isReset = resetUserPassword(email, password);
        if (isReset) {
          setSuccess('Password berhasil diubah! Silakan masuk.');
          setAuthMode('login');
          setPassword('');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem. Coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setError('Fitur Google Login sedang dalam pemeliharaan. Gunakan email/password.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={`min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-green-600'}`}>
      
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
      
      <div className="relative w-full max-w-md z-10 space-y-6">
        {/* Brand */}
        <div className="text-center animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 group-hover:scale-110 transition-transform"></div>
            <div className="relative w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl border border-white/20">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mt-4 drop-shadow-sm">Didaur</h1>
          <p className="text-green-100/70 dark:text-slate-500 mt-1 font-bold text-[10px] uppercase tracking-[0.2em]">Eco-Platform Indonesia</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] border border-white/20 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {authMode === 'login' ? 'Selamat Datang' : 
               authMode === 'register' ? 'Bergabung Sekarang' : 
               authMode === 'forgot' ? 'Lupa Password?' : 'Reset Password'}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1">
              {authMode === 'login' ? 'Masuk untuk mengelola poin hijau kamu.' : 
               authMode === 'register' ? 'Daftar dan mulai kurangi limbah hari ini.' : 
               'Kami akan membantu memulihkan akun Anda.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-[11px] font-black border border-rose-100 dark:border-rose-900/50 flex items-center space-x-3 animate-in shake duration-500">
                <span>⚠️ {error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 p-4 rounded-2xl text-[11px] font-black border border-green-100 dark:border-green-900/50 flex items-center space-x-3 animate-in zoom-in duration-300">
                <span>✅ {success}</span>
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-1 group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-transparent rounded-2xl py-4 pl-14 pr-5 focus:ring-0 focus:border-green-500 transition-all font-bold text-sm"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                </div>
                <input 
                  type="email" 
                  required
                  inputMode="email"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-transparent rounded-2xl py-4 pl-14 pr-5 focus:ring-0 focus:border-green-500 transition-all font-bold text-sm"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={authMode === 'reset'}
                />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div className="space-y-1 group">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-transparent rounded-2xl py-4 pl-14 pr-12 focus:ring-0 focus:border-green-500 transition-all font-bold text-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={authMode === 'reset' ? "Password Baru" : "Password"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest hover:underline"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full relative overflow-hidden group py-4.5 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all mt-4 flex items-center justify-center space-x-3 text-white ${
                authMode === 'forgot' ? 'bg-amber-500' : 'bg-green-600'
              } disabled:opacity-70`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>
                  {authMode === 'login' ? 'MASUK' : 
                   authMode === 'register' ? 'DAFTAR' : 
                   authMode === 'forgot' ? 'CARI AKUN' : 'GANTI PASSWORD'}
                </span>
              )}
            </button>
          </form>

          {/* Social */}
          <div className="mt-8 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              <span className="absolute px-4 bg-white dark:bg-slate-900 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Atau</span>
            </div>
            
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center space-x-3 active:scale-[0.98] transition-all"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Google Login</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                if (authMode === 'login') setAuthMode('register');
                else setAuthMode('login');
              }}
              className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest"
            >
              {authMode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <span className="text-green-600 dark:text-green-400 font-black">
                {authMode === 'login' ? 'Daftar' : 'Masuk'}
              </span>
            </button>
          </div>
        </div>
        
        <p className="text-center text-white/50 dark:text-slate-700 text-[9px] font-black uppercase tracking-[0.3em]">
          Didaur v3.1 • Indonesia
        </p>
      </div>
    </div>
  );
};

export default Auth;
