import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar as CalendarIcon, CheckCircle2, ArrowLeft, ArrowRight, Send, Map, X } from 'lucide-react'; 
import confetti from 'canvas-confetti';
import { supabase } from './supabase';

// ==========================================
// BACKGROUND HẠT LƠ LỬNG
// ==========================================
const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const generatedParticles = Array.from({ length: 208 }).map((_, i) => ({
      id: i,
      icon: i % 3 === 0 ? '✨' : (i % 3 === 1 ? '🎓' : '☁️'),
      startX: Math.random() * 100,
      endX: Math.random() * 100,
      scale: Math.random() * 0.4 + 0.4,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 5
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-70">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "110vh", x: `${p.startX}vw`, opacity: 0, rotate: 0, scale: p.scale }}
          animate={{ y: "-10vh", x: `${p.endX}vw`, opacity: [0, 0.6, 0], rotate: 360 }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
          className="absolute text-sky-300/60 text-2xl md:text-3xl drop-shadow-sm"
        >
          {p.icon}
        </motion.div>
      ))}
    </div>
  );
};

// ==========================================
// COMPONENT ĐẾM NGƯỢC
// ==========================================
const calculateTimeLeft = () => {
  const difference = +new Date("2026-11-13T11:15:00") - +new Date();
  let timeLeft = {};
  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
    };
  }
  return timeLeft;
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function InvitationPage() {
  const [appState, setAppState] = useState('loading'); 
  const [imgIndex, setImgIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState('yes'); 

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get('to') || 'Bạn';

  const info = {
    name: "Kim Ngân",
    date: "Thứ Sáu, 13/11/2026",
    time: "11:15 - 13:00",
    location: "Trường Đại học Công nghệ",
    address: "Lô E2b-4, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP.HCM.",
    mapsLink: "https://maps.app.goo.gl/UZMWE1PGX966F4B38", 
  };

  const images = ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg"];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    const loadingTimer = setTimeout(() => setAppState('envelope'), 2500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, []);

  useEffect(() => {
    if (appState === 'invite' && !zoomedImage) {
      const interval = setInterval(() => {
        setImgIndex((prev) => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [appState, images.length, zoomedImage]);

  const openMaps = () => window.open(info.mapsLink, '_blank');

  const handleOpenEnvelope = () => { 
    if (!isEnvelopeOpen) {
      setIsEnvelopeOpen(true);
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.log("Trình duyệt chặn phát:", err));
      }
    } 
  };

  const toggleMusic = () => {
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const handleBack = () => {
    if (appState === 'invite') { setAppState('envelope'); setIsEnvelopeOpen(false); }
    else if (appState === 'rsvp') setAppState('invite');
    else if (appState === 'thanks') setAppState('rsvp');
  };

  const handleSubmitRsvp = async () => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('rsvps')
      .insert([{ guest_name: guestName, message: rsvpMessage, attendance: rsvpAttendance }]);

    setIsSubmitting(false);

    if (error) {
      alert("Đã có lỗi xảy ra. Vui lòng thử lại!");
    } else {
      setAppState('thanks');
      
      if (rsvpAttendance === 'yes') {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
      }
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 12 } } };

return (
    <div className="relative w-full h-[100dvh] md:h-[80vh] md:max-h-[750px] md:max-w-5xl bg-gradient-to-br from-sky-200 via-blue-50 to-sky-100 animate-gradient md:shadow-2xl overflow-hidden md:rounded-3xl flex flex-col font-sans text-slate-800">
      
      <audio ref={audioRef} src="/haonam.mp3" loop />
      <FloatingParticles />

      {/* --- MÀN HÌNH LOADING ĐẾM NGƯỢC --- */}
      <AnimatePresence>
        {appState === 'loading' && (
          <motion.div 
            initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} transition={{ duration: 0.8 }}
            className="absolute inset-0 z-[100] bg-sky-500 flex flex-col items-center justify-center text-white"
          >
            <motion.div 
              animate={{ y: [-15, 15, -15], rotate: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="text-7xl mb-8 drop-shadow-2xl"
            >
              🎓
            </motion.div>
            <h2 className="font-serif text-3xl mb-4 font-bold tracking-widest">ĐANG TẢI...</h2>
            
            {timeLeft.days !== undefined && (
              <div className="flex gap-4 text-center mt-4">
                <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/30">
                  <p className="text-3xl font-black">{timeLeft.days}</p><p className="text-xs font-bold uppercase">Ngày</p>
                </div>
                <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/30">
                  <p className="text-3xl font-black">{timeLeft.hours}</p><p className="text-xs font-bold uppercase">Giờ</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appState !== 'envelope' && appState !== 'loading' && (
          <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={handleBack} className="absolute top-4 left-4 z-50 p-2 bg-white/70 backdrop-blur rounded-full shadow-sm cursor-pointer hover:bg-white hover:scale-110 transition-all text-sky-500 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div animate={isPlaying ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} onClick={toggleMusic} className="absolute top-4 right-4 z-50 p-2 bg-white/60 backdrop-blur rounded-full shadow-md cursor-pointer hover:bg-white transition-colors text-sky-500 w-11 h-11 flex items-center justify-center">
        <span className={isPlaying ? "text-xl" : "text-xl grayscale opacity-70"}>{isPlaying ? '🎵' : '🔇'}</span>
      </motion.div>

      <AnimatePresence mode="wait">
        
        {/* --- MÀN HÌNH 1: PHONG BÌ TÍCH HỢP GẤU BÔNG VÀ HOA --- */}
        {appState === 'envelope' && (
          <motion.div key="envelope" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.2, filter: "blur(5px)" }} transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center p-6 relative w-full h-full z-10">
            <motion.div animate={{ opacity: isEnvelopeOpen ? 0 : 1, y: isEnvelopeOpen ? -20 : 0 }} transition={{ duration: 0.4 }} className="mb-12 text-center flex flex-col items-center pointer-events-none">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-xl md:text-2xl font-black mb-4 shadow-xl shadow-sky-500/40 bg-gradient-to-tr from-sky-400 to-sky-600 text-white border-4 border-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-1/4"></div>
                <span className="z-10 tracking-widest drop-shadow-md">2026</span>
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-serif text-slate-700 mb-2 drop-shadow-sm">Graduation</h1>
              <p className="text-sm md:text-base tracking-widest text-sky-500 uppercase font-semibold">{info.location}</p>
            </motion.div>

            <motion.div animate={!isEnvelopeOpen ? { y: [0, -12, 0] } : { y: 0 }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}>
              <motion.div whileHover={!isEnvelopeOpen ? { scale: 1.03 } : {}} whileTap={!isEnvelopeOpen ? { scale: 0.95 } : {}} onClick={handleOpenEnvelope} className="relative w-[80vw] max-w-[320px] md:max-w-[400px] aspect-[4/3] cursor-pointer" style={{ perspective: 1200 }}>
                
                {/* 1. Mặt sau phong bì */}
                <div className="absolute inset-0 bg-slate-300 rounded-xl shadow-2xl z-0"></div>

                {/* 2. Tấm hình thiệp chính trượt lên (ĐƯA LÊN TRƯỚC ĐỂ GẤU VÀ HOA KHÔNG BỊ ĐÈ) */}
                <motion.div initial={{ y: 0 }} animate={{ y: isEnvelopeOpen ? -200 : 0 }} transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }} className="absolute top-2 bottom-2 left-2 right-2 bg-white rounded-lg shadow-xl z-10 flex flex-col items-center p-2 pt-3 border border-sky-100">
                  <img src={images[0]} alt="Thiệp" className="w-full h-[55%] md:h-[60%] object-cover rounded-md" onError={(e) => { e.target.src = "https://picsum.photos/400/600?random=1" }} />
                  <p className="mt-3 font-serif text-xl md:text-2xl text-slate-700 font-bold">Lễ Tốt Nghiệp</p>
                  <p className="text-sm font-serif italic text-sky-500 mt-1">{info.name}</p>
                  <AnimatePresence>
                    {isEnvelopeOpen && (
                      <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} transition={{ delay: 1.1, type: "spring" }} onClick={(e) => {e.stopPropagation(); setAppState('invite')}} className="mt-3 md:mt-4 bg-sky-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-sky-500/40 hover:bg-sky-600 transition-colors flex items-center gap-2">
                        Xem thiệp <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* 3. HIỆU ỨNG GẤU BÔNG NẢY RA (Nằm sau thẻ Card để đè lên trên thẻ) */}
                <motion.div 
                  initial={{ y: 50, x: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: isEnvelopeOpen ? -230 : 50, x: isEnvelopeOpen ? -110 : 0, opacity: isEnvelopeOpen ? 1 : 0, scale: isEnvelopeOpen ? 1.5 : 0.5, rotate: isEnvelopeOpen ? -25 : 0 }}
                  transition={{ duration: 0.6, delay: 0.45, type: "spring", bounce: 0.5 }}
                  className="absolute top-1/4 left-1/4 z-10 text-6xl md:text-7xl drop-shadow-xl pointer-events-none"
                >
                  🧸
                </motion.div>

                {/* 4. HIỆU ỨNG BÔNG HOA NẢY RA */}
                <motion.div 
                  initial={{ y: 50, x: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: isEnvelopeOpen ? -230 : 50, x: isEnvelopeOpen ? 110 : 0, opacity: isEnvelopeOpen ? 1 : 0, scale: isEnvelopeOpen ? 1.5 : 0.5, rotate: isEnvelopeOpen ? 25 : 0 }}
                  transition={{ duration: 0.6, delay: 0.55, type: "spring", bounce: 0.5 }}
                  className="absolute top-1/4 right-1/4 z-10 text-6xl md:text-7xl drop-shadow-xl pointer-events-none"
                >
                  🌻
                </motion.div>

                {/* 5. Mặt trước phong bì */}
                <div className="absolute inset-0 z-20 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-sky-600" style={{ clipPath: 'polygon(0 0, 50% 55%, 0 100%)' }}></div>
                  <div className="absolute inset-0 bg-sky-600" style={{ clipPath: 'polygon(100% 0, 50% 55%, 100% 100%)' }}></div>
                  <div className="absolute inset-0 bg-sky-500" style={{ clipPath: 'polygon(0 100%, 50% 55%, 100% 100%)' }}></div>
                </div>

                <motion.div initial={{ rotateX: 0, zIndex: 30 }} animate={{ rotateX: isEnvelopeOpen ? 180 : 0, zIndex: isEnvelopeOpen ? 5 : 30 }} transition={{ duration: 0.6 }} style={{ transformOrigin: 'top', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} className="absolute top-0 left-0 right-0 h-[65%] pointer-events-none rounded-t-xl overflow-hidden"><div className="w-full h-full bg-sky-400"></div></motion.div>
                <motion.div animate={{ opacity: isEnvelopeOpen ? 0 : 1, scale: isEnvelopeOpen ? 0 : 1 }} transition={{ duration: 0.3 }} className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-lg font-serif text-lg md:text-xl text-sky-600 border-2 border-sky-200 pointer-events-none">KN</motion.div>
              </motion.div>
            </motion.div>
            <motion.p animate={{ opacity: isEnvelopeOpen ? 0 : 1 }} className="mt-10 text-sm md:text-base text-sky-500 font-medium animate-pulse tracking-wide">CHẠM VÀO PHONG BÌ ĐỂ MỞ THIỆP</motion.p>
          </motion.div>
        )}

        {/* --- MÀN HÌNH 2: THIỆP MỜI --- */}
        {appState === 'invite' && (
          <motion.div key="invite" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="flex-1 flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden no-scrollbar z-10 relative">
            
            <AnimatePresence>
              {zoomedImage && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setZoomedImage(null)}
                  className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex justify-center items-center p-4 cursor-zoom-out"
                >
                  <button className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full hover:bg-white/40"><X className="w-6 h-6"/></button>
                  <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={zoomedImage} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white/20 object-contain" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full md:w-1/2 h-[350px] md:h-full bg-white/40 flex justify-center items-center relative shrink-0 pt-10 md:pt-0 backdrop-blur-sm overflow-hidden">
              <div className="relative w-full flex justify-center items-center" style={{ perspective: 1200, transformStyle: "preserve-3d" }}>
                {images.map((src, i) => {
                  let offset = i - imgIndex;
                  if (offset < -1) offset += images.length;
                  if (offset > 1) offset -= images.length;
                  const isVisible = Math.abs(offset) <= 1;

                  return (
                    <motion.div 
                      key={i} 
                      onClick={() => offset === 0 && setZoomedImage(src)}
                      className={`absolute w-[180px] h-[260px] md:w-[260px] md:h-[380px] rounded-xl overflow-hidden shadow-2xl shadow-sky-900/20 border-[6px] border-white bg-sky-100 ${offset === 0 ? 'cursor-zoom-in' : ''}`} 
                      initial={false} 
                      animate={{ x: offset * (isDesktop ? 180 : 120), z: offset === 0 ? 100 : -100, scale: offset === 0 ? 1 : 0.85, rotateY: offset * -25, zIndex: offset === 0 ? 50 : 10, opacity: isVisible ? 1 : 0 }} 
                      transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                    >
                      <img src={src} alt="Kỷ yếu" className="w-full h-full object-cover pointer-events-none" onError={(e) => { e.target.src = `https://picsum.photos/400/600?random=${i}` }}/>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full md:w-1/2 flex flex-col justify-center items-center md:items-start text-center md:text-left px-6 py-8 md:px-16 h-auto md:h-full">
              <motion.span variants={itemVariants} className="text-4xl mb-3 hidden md:block drop-shadow-md">🎓</motion.span>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-serif text-slate-700">Graduation</motion.h2>
              <motion.p variants={itemVariants} className="mt-4 text-slate-500 text-lg">Thương mời: <span className="font-serif text-2xl italic text-sky-500 font-bold drop-shadow-sm">{guestName}</span></motion.p>
              <motion.p variants={itemVariants} className="text-slate-500">tới tham dự Lễ tốt nghiệp của</motion.p>
              <motion.h3 variants={itemVariants} className="text-4xl md:text-5xl font-serif mt-2 mb-8 text-sky-500 font-bold drop-shadow-md">{info.name}</motion.h3>

              <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-sky-100 w-full space-y-4">
                
                <div className="flex items-start md:items-center gap-4 text-left p-2 -m-2 rounded-xl">
                  <div className="p-3 bg-sky-100 rounded-xl shrink-0 shadow-inner"><CalendarIcon className="w-5 h-5 text-sky-500" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 text-lg">{info.date}</p>
                    <p className="text-sm text-sky-600">{info.time}</p>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                <motion.div whileHover={{ scale: 1.02, x: 5 }} onClick={openMaps} className="flex items-start md:items-center gap-4 text-left transition-transform cursor-pointer group hover:bg-sky-50 p-2 -m-2 rounded-xl">
                  <div className="p-3 bg-sky-100 rounded-xl shrink-0 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-colors"><MapPin className="w-5 h-5 text-sky-500 group-hover:text-white" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 text-lg group-hover:text-sky-700">{info.location}</p>
                    <p className="text-sm text-sky-600 line-clamp-1">{info.address}</p>
                  </div>
                  <Map className="w-5 h-5 text-slate-300 group-hover:text-sky-500" />
                </motion.div>

              </motion.div>

              <motion.button variants={itemVariants} whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.4)" }} whileTap={{ scale: 0.95 }} onClick={() => setAppState('rsvp')} className="w-full md:w-auto mt-8 md:px-12 bg-sky-500 text-white py-4 rounded-full font-semibold shadow-lg transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> Xác nhận tham dự
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* --- MÀN HÌNH 3 & 4 CŨ GIỮ NGUYÊN (RSVP & THANKS) --- */}
        {appState === 'rsvp' && (
          <motion.div key="rsvp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -50 }} className="flex-1 flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden no-scrollbar z-10">
            <div className="hidden md:block md:w-5/12 h-full relative">
              <img src={images[2]} alt="Decor" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://picsum.photos/400/600?random=3" }}/>
              <div className="absolute inset-0 bg-sky-500/20 mix-blend-multiply"></div>
            </div>

            <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col justify-center items-center bg-white/90 backdrop-blur-md h-full shadow-inner">
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-md">
                <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl font-serif text-center mb-2 text-sky-500 drop-shadow-sm">Xác Nhận Tham Dự</motion.h2>
                <motion.p variants={itemVariants} className="text-center text-slate-500 mb-8">✨ {info.name} cùng đến chung vui nhé! ✨</motion.p>

                <div className="space-y-5">
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Lời chúc dành cho tân cử nhân:</label>
                    <motion.textarea whileFocus={{ scale: 1.01 }} value={rsvpMessage} onChange={(e) => setRsvpMessage(e.target.value)} className="w-full border border-sky-200 rounded-xl p-4 focus:ring-2 focus:ring-sky-400 focus:outline-none transition-all resize-none shadow-sm bg-sky-50/50" rows="4" placeholder={`Gửi vài lời chúc mừng đến ${info.name} tại đây...`}></motion.textarea>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Bạn sẽ đến chung vui chứ?</label>
                    <div className="space-y-3">
                      <motion.label whileHover={{ scale: 1.02 }} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all shadow-sm ${rsvpAttendance === 'yes' ? 'bg-sky-100 border-sky-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                        <input type="radio" name="attendance" value="yes" checked={rsvpAttendance === 'yes'} onChange={() => setRsvpAttendance('yes')} className="w-5 h-5 text-sky-500 accent-sky-500" />
                        <span className="font-medium text-slate-700">Chắc chắn tham dự! 🎉</span>
                      </motion.label>
                      <motion.label whileHover={{ scale: 1.02 }} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all shadow-sm ${rsvpAttendance === 'no' ? 'bg-sky-100 border-sky-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                        <input type="radio" name="attendance" value="no" checked={rsvpAttendance === 'no'} onChange={() => setRsvpAttendance('no')} className="w-5 h-5 text-sky-500 accent-sky-500" />
                        <span className="font-medium text-slate-700">Tiếc quá, bận mất rồi 😔</span>
                      </motion.label>
                    </div>
                  </motion.div>

                  <motion.button variants={itemVariants} whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.4)" }} whileTap={{ scale: 0.97 }} onClick={handleSubmitRsvp} disabled={isSubmitting} className="w-full mt-4 bg-sky-500 disabled:bg-sky-300 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" /> {isSubmitting ? 'Đang gửi...' : 'Gửi xác nhận'}
                  </motion.button>
                  <motion.button variants={itemVariants} onClick={() => setAppState('invite')} className="w-full mt-2 text-center text-sky-500 hover:text-sky-700 underline py-2 transition-colors md:hidden">Quay lại thiệp mời</motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {appState === 'thanks' && (
          <motion.div key="thanks" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-6 text-center w-full h-full relative z-10">
            <div className="absolute inset-0 z-0 opacity-15"><img src={images[0]} className="w-full h-full object-cover filter blur-md" alt="bg" onError={(e) => { e.target.src = "https://picsum.photos/400/600?random=1" }}/></div>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }} className="z-10 flex flex-col items-center">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-56 h-72 md:w-72 md:h-96 bg-sky-200 rounded-2xl overflow-hidden shadow-2xl mb-8 border-4 md:border-8 border-white relative">
                <img src={images[0]} alt="Cảm ơn" className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2s]" onError={(e) => { e.target.src = "https://picsum.photos/400/600?random=1" }}/>
                <div className="absolute inset-0 bg-sky-900/10 hover:bg-transparent transition-colors"></div>
              </motion.div>
              <p className="text-slate-600 text-lg md:text-xl mb-4 px-4 max-w-lg leading-relaxed font-medium bg-white/40 backdrop-blur-sm rounded-lg p-2">Cảm ơn vì đã đồng hành cùng mình trong hành trình trưởng thành này.</p>
              <h3 className="text-4xl md:text-5xl font-serif text-sky-500 font-bold drop-shadow-md">{info.name}</h3>
              <p className="text-sky-500 mt-3 md:text-lg font-semibold tracking-wide">{info.date.split(',')[1]} ☁️</p>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}