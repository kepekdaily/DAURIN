
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'https://esm.sh/react-easy-crop@5.2.0';
import { analyzeImage } from '../services/geminiService';
import { RecyclingRecommendation, UserProfile, CommunityPost } from '../types';
import { updateUserPoints, saveScanToHistory, getScanHistory, saveCommunityPost } from '../utils/storage';

// Helper function to create the cropped image
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

interface ScannerProps {
  onPointsUpdate: (updatedUser: UserProfile) => void;
  isDarkMode: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onPointsUpdate, isDarkMode }) => {
  const [image, setImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecyclingRecommendation | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'Scan' | 'Riwayat'>('Scan');
  const [history, setHistory] = useState<RecyclingRecommendation[]>(getScanHistory());
  const [permissionError, setPermissionError] = useState<boolean>(false);
  
  // Cropping States
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Sharing State
  const [isSharing, setIsSharing] = useState(false);
  const [shareData, setShareData] = useState({
    title: '',
    description: '',
    category: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError(true);
      } else {
        alert("Tidak dapat mengakses kamera. Pastikan perangkat Anda mendukung fitur ini.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCapture = () => {
    if (countdown !== null) return;
    
    let count = 3;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        performCapture();
      }
    }, 800);
  };

  const performCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setTempImage(dataUrl);
        setIsCropping(true);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setTempImage(dataUrl);
        setIsCropping(true);
        stopCamera(); 
        setPermissionError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    
    setLoading(true);
    setIsCropping(false);
    
    try {
      const croppedBase64 = await getCroppedImg(tempImage, croppedAreaPixels);
      setImage(croppedBase64);
      handleAnalyze(croppedBase64.split(',')[1]);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Terjadi kesalahan saat memotong gambar.");
      setLoading(false);
    }
  };

  const handleAnalyze = async (base64: string) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeImage(base64);
      setResult(data);
      saveScanToHistory(data);
      setHistory(getScanHistory());
      const updated = updateUserPoints(50, data.co2Impact, true, data.materialType);
      if (updated) onPointsUpdate(updated);
    } catch (error) {
      console.error(error);
      alert("Gagal menganalisis. Coba foto lebih dekat.");
    } finally {
      setLoading(false);
    }
  };

  const openShareModal = () => {
    if (!result) return;
    setShareData({
      title: result.itemName,
      description: `Menemukan ${result.itemName}! Rekomendasi daur ulang: ${result.diyIdeas[0]?.title}. Ayo kurangi sampah dan selamatkan bumi!`,
      category: result.materialType
    });
    setIsSharing(true);
  };

  const handleFinalShare = () => {
    const currentUser = JSON.parse(localStorage.getItem('didaur_current_user_v3') || '{}');
    if (!currentUser.name) return;

    const post: CommunityPost = {
      id: Math.random().toString(36).substr(2, 9),
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      itemName: shareData.title,
      description: shareData.description,
      imageUrl: image || "https://picsum.photos/seed/share/800/800",
      likes: 0,
      comments: 0,
      timestamp: Date.now(),
      pointsEarned: 100,
      materialTag: shareData.category
    };

    saveCommunityPost(post);
    const updated = updateUserPoints(100, 0, false);
    if (updated) onPointsUpdate(updated);
    
    setIsSharing(false);
    alert("Karya berhasil dibagikan! +100 XP didapatkan.");
  };

  const handleHistoryItemClick = (item: RecyclingRecommendation) => {
    setResult(item);
    // Use stored image or a placeholder
    setImage(item.diyIdeas[0]?.imageUrl || "https://picsum.photos/seed/recycle/400/400");
    setTempImage(null); // Clear temp image since we are viewing history
    setActiveTab('Scan');
  };

  const handleClearHistory = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua riwayat scan?")) {
      localStorage.removeItem('didaur_scans_v3');
      setHistory([]);
    }
  };

  const handleReanalyze = () => {
    if (tempImage) {
      setResult(null);
      setIsCropping(true);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col space-y-4 p-4 animate-in fade-in duration-500 min-h-[80vh]">
      {/* Top Navigation Switch */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-max mx-auto mb-4 transition-colors shadow-inner">
         {['Scan', 'Riwayat'].map(t => (
           <button 
             key={t}
             onClick={() => setActiveTab(t as any)}
             className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
           >
             {t}
           </button>
         ))}
      </div>

      {activeTab === 'Scan' ? (
        <>
          {permissionError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-300">
               <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-inner mb-2">
                 📷
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-500 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-white text-xs font-black">!</div>
               </div>
               <div className="space-y-2">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white">Akses Kamera Diblokir</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                   Didaur membutuhkan akses kamera untuk mengenali barang bekas secara instan. Fitur ini membantu Anda mendapatkan inspirasi DIY dengan cepat!
                 </p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 w-full text-left space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cara Mengaktifkan:</p>
                  <ol className="text-xs font-bold text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside">
                    <li>Klik ikon gembok di alamat bar browser</li>
                    <li>Ubah izin "Kamera" menjadi Izinkan (Allow)</li>
                    <li>Muat ulang (Refresh) halaman ini</li>
                  </ol>
               </div>
               <div className="flex flex-col w-full space-y-3">
                 <button 
                   onClick={startCamera}
                   className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all"
                 >
                   Coba Lagi
                 </button>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-5 rounded-[2rem] font-black active:scale-95 transition-all"
                 >
                   Gunakan Galeri Saja
                 </button>
               </div>
            </div>
          ) : !isCameraActive && !image && !isCropping ? (
            <div className="space-y-8 pt-4 text-center">
              <div className="px-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Apa yang ingin kamu daur ulang?</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Ubah barang lama menjadi poin dan karya baru.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 px-4 pt-4">
                <div 
                  onClick={startCamera}
                  className="aspect-[4/5] relative group"
                >
                  <div className="absolute inset-0 bg-green-200/30 dark:bg-green-900/10 rounded-[3rem] blur-xl group-hover:bg-green-300/40 transition-all"></div>
                  <div className="relative h-full border-2 border-green-200 dark:border-green-800 rounded-[3rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 text-center p-4">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="text-xs font-black text-green-800 dark:text-green-400 uppercase tracking-widest">Kamera</span>
                  </div>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/5] relative group"
                >
                  <div className="absolute inset-0 bg-blue-200/30 dark:bg-blue-900/10 rounded-[3rem] blur-xl group-hover:bg-blue-300/40 transition-all"></div>
                  <div className="relative h-full border-2 border-blue-200 dark:border-blue-800 rounded-[3rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 text-center p-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest">Galeri</span>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          ) : isCameraActive ? (
            <div className="relative flex flex-col h-full animate-in fade-in zoom-in duration-300">
               <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-black transition-colors">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-8xl font-black text-white animate-ping">{countdown}</span>
                    </div>
                  )}
                  <div className="absolute top-6 left-6 flex justify-between items-center w-full pr-12">
                     <button onClick={stopCamera} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">✕</button>
                  </div>
               </div>
               <div className="flex-1 flex items-center justify-center p-8">
                  <button onClick={handleCapture} disabled={countdown !== null} className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-4 border-green-600">
                     <div className="w-14 h-14 bg-green-600 rounded-full"></div>
                  </button>
               </div>
               <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : isCropping ? (
            <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col animate-in fade-in duration-300">
              <div className="p-8 flex justify-between items-center bg-slate-950/80 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-white text-xl font-black">Fokus Barang</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Geser & Potong Gambar</p>
                </div>
                <button onClick={() => setIsCropping(false)} className="text-white p-2">Batal</button>
              </div>
              <div className="relative flex-1 bg-black">
                <Cropper
                  image={tempImage!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="p-8 bg-slate-950/80 backdrop-blur-md z-10 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Perbesar</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-green-500"
                  />
                </div>
                <button 
                  onClick={handleCropConfirm}
                  className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all"
                >
                  POTONG & ANALISIS
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-20">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                <img src={image!} className="w-full aspect-square object-cover" />
                {loading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                     <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin"></div>
                     </div>
                     <h2 className="text-white text-xl font-black tracking-tight mb-2">Menganalisis Material...</h2>
                  </div>
                )}
                {!loading && (
                  <button onClick={() => { setImage(null); setResult(null); setTempImage(null); }} className="absolute top-6 right-6 p-3 bg-white/20 rounded-full text-white">✕</button>
                )}
              </div>

              {result && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-bl-[5rem] -mr-8 -mt-8 -z-0"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="animate-in slide-in-from-left-12 duration-700 delay-150">
                          <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full mb-3 inline-block transition-colors">Hasil Deteksi</span>
                          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight transition-colors leading-tight drop-shadow-sm">{result.itemName}</h2>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <span className="block text-4xl font-black text-green-600 dark:text-green-400 transition-all drop-shadow-md animate-in zoom-in-75 fade-in duration-500 delay-300 hover:scale-110 active:scale-90">+{result.estimatedPoints}</span>
                           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter animate-in fade-in duration-500 delay-500">XP Bonus</span>
                        </div>
                      </div>

                      <div className="flex space-x-3 mb-8">
                         <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-[600ms]">🏷️ {result.materialType}</div>
                         <div className={`px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-[700ms] ${result.difficulty === 'Mudah' ? 'bg-green-500' : 'bg-amber-500'}`}>⚡ {result.difficulty}</div>
                      </div>

                      <div className="relative group overflow-hidden bg-slate-900 dark:bg-green-500 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-slate-200 dark:shadow-none transition-all animate-in slide-in-from-bottom-8 duration-1000 delay-[800ms] ease-out">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                         
                         <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-white/50 dark:text-green-50 uppercase tracking-widest">Estimasi Dampak Lingkungan</p>
                            <p className="text-3xl font-black tracking-tight animate-pulse">-{result.co2Impact}g CO2</p>
                         </div>
                         <div className="text-5xl animate-bounce delay-1000 relative z-10">🌍</div>
                      </div>

                      <button 
                        onClick={openShareModal}
                        className="w-full mt-6 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in duration-700 delay-[1200ms]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        <span>Bagikan ke Komunitas (+100 XP)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 px-2 flex flex-col space-y-3">
                     <button 
                       onClick={handleReanalyze}
                       className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 py-5 rounded-3xl font-black border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2 animate-in fade-in duration-700 delay-[1400ms]"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       <span>Analisis Ulang</span>
                     </button>
                     <button 
                       onClick={() => { setImage(null); setResult(null); setTempImage(null); }} 
                       className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-5 rounded-3xl font-black shadow-2xl active:scale-95 transition-all animate-in fade-in duration-700 delay-[1500ms]"
                     >
                       Scan Barang Lain
                     </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
           <div className="flex justify-between items-center px-2">
             <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight">Terakhir Discan</h3>
             {history.length > 0 && (
               <button 
                onClick={handleClearHistory}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg"
               >
                 Hapus Semua
               </button>
             )}
           </div>

           {history.length > 0 ? (
             <div className="px-2 space-y-4">
               {history.map((item, idx) => (
                 <div 
                  key={item.id} 
                  onClick={() => handleHistoryItemClick(item)} 
                  className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 active:scale-95 cursor-pointer group transition-all hover:shadow-md animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                 >
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {item.materialType.toLowerCase().includes('plastik') ? '🥤' : 
                       item.materialType.toLowerCase().includes('kardus') ? '📦' : 
                       item.materialType.toLowerCase().includes('kaca') ? '🍶' : '🌱'}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{item.itemName}</h4>
                       <div className="flex items-center space-x-2 mt-1">
                         <p className="text-[10px] font-black text-green-600">-{item.co2Impact}g CO2</p>
                         <span className="text-slate-300 dark:text-slate-700">•</span>
                         <p className="text-[10px] font-bold text-slate-400">
                           {item.timestamp ? new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Baru'}
                         </p>
                       </div>
                    </div>
                    <div className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-4xl opacity-30 grayscale">📂</div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Belum ada riwayat scan.</p>
                <button 
                  onClick={() => setActiveTab('Scan')}
                  className="px-6 py-2 bg-green-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest active:scale-95 transition-all"
                >
                  Mulai Scan
                </button>
             </div>
           )}
        </div>
      )}

      {/* Sharing Modal */}
      {isSharing && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-end justify-center animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white">Bagikan Inspirasi</h2>
                 <button onClick={() => setIsSharing(false)} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl">✕</button>
              </div>
              <div className="space-y-6 pb-12">
                 <div className="relative aspect-video rounded-3xl overflow-hidden">
                    <img src={image || ''} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-4">
                    <input type="text" value={shareData.title} onChange={e => setShareData({...shareData, title: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold" placeholder="Judul..." />
                    <textarea value={shareData.description} onChange={e => setShareData({...shareData, description: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-medium text-sm h-32" placeholder="Deskripsi..." />
                 </div>
                 <button onClick={handleFinalShare} className="w-full bg-green-600 text-white py-5 rounded-[2.5rem] font-black text-lg shadow-xl active:scale-95">BAGIKAN SEKARANG</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
