import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Link as LinkIcon, Copy, CheckCircle2, Sparkles, MessageSquareHeart, Clock, Trash2, Download, QrCode, CheckSquare } from 'lucide-react'; 
import { supabase } from './supabase';

export default function AdminPage() {
  const [guestNameInput, setGuestNameInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [rsvps, setRsvps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRsvps = async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRsvps(data);
      }
      setIsLoading(false);
    };
    
    fetchRsvps();

    // Lắng nghe dữ liệu (THÊM, XÓA, CẬP NHẬT CHECK-IN)
    const subscription = supabase
      .channel('public:rsvps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, payload => {
        if (payload.eventType === 'INSERT') {
          setRsvps(current => [payload.new, ...current]);
        } else if (payload.eventType === 'DELETE') {
          setRsvps(current => current.filter(item => item.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setRsvps(current => current.map(item => item.id === payload.new.id ? payload.new : item));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const handleGenerateLink = () => {
    if (!guestNameInput.trim()) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/?to=${encodeURIComponent(guestNameInput.trim())}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // TẢI MÃ QR VỀ MÁY
  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(generatedLink)}`;
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `QR_ThiepMoi_${guestNameInput.trim()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        // Fallback nếu bị chặn: Mở ảnh sang tab mới
        window.open(qrUrl, '_blank');
      });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phản hồi này không?")) {
      setRsvps((prev) => prev.filter((rsvp) => rsvp.id !== id));
      const { error } = await supabase.from('rsvps').delete().eq('id', id);
      if (error) {
        alert("Đã có lỗi xảy ra khi xóa dữ liệu!");
        console.error(error);
      }
    }
  };

  // CẬP NHẬT TRẠNG THÁI CHECK-IN
  const handleToggleCheckIn = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    // Cập nhật giao diện trước cho mượt
    setRsvps(current => current.map(item => item.id === id ? { ...item, is_attended: newStatus } : item));
    
    // Gửi lệnh lên database
    const { error } = await supabase
      .from('rsvps')
      .update({ is_attended: newStatus })
      .eq('id', id);

    if (error) {
      alert("Lỗi cập nhật check-in!");
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      alert("Chưa có dữ liệu để xuất file!");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Tên Khách Mời,Trạng Thái Phản Hồi,Check-in Thực Tế,Lời Chúc,Thời Gian\n";

    rsvps.forEach(row => {
      const status = row.attendance === 'yes' ? "Sẽ đến" : "Bận";
      const checkin = row.is_attended ? "Đã có mặt" : "Chưa đến";
      const message = row.message ? `"${row.message.replace(/"/g, '""')}"` : "";
      const date = new Date(row.created_at).toLocaleString('vi-VN');
      
      const rowData = `"${row.guest_name}","${status}","${checkin}",${message},"${date}"`;
      csvContent += rowData + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "DanhSachKhachMoi_TotNghiep.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } };

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans text-slate-800 overflow-hidden flex justify-center p-4 md:p-10">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-sky-200/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#7c9cb4]/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div className="w-full max-w-6xl z-10 space-y-8" initial="hidden" animate="show" variants={containerVariants}>
        <motion.div variants={itemVariants} className="text-center md:text-left flex flex-col md:flex-row justify-between items-center bg-white/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white">
          <div>
            <h1 className="text-3xl font-bold text-[#7c9cb4] flex items-center gap-3 justify-center md:justify-start">
              <Sparkles className="w-8 h-8" /> Dashboard Quản Trị
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Quản lý thiệp và check-in sự kiện</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap justify-center gap-3 md:gap-4 text-center">
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xl md:text-2xl font-bold text-slate-600">{rsvps.length}</p>
              <p className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">Phản hồi</p>
            </div>
            <div className="bg-sky-50 px-4 py-3 rounded-2xl border border-sky-100 shadow-sm">
              <p className="text-xl md:text-2xl font-bold text-sky-600">{rsvps.filter(r => r.attendance === 'yes').length}</p>
              <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">Sẽ tham dự</p>
            </div>
            {/* THỐNG KÊ NGƯỜI ĐÃ CHECK-IN TỚI LỄ */}
            <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 bg-emerald-200 rounded-bl-lg"><CheckSquare className="w-3 h-3 text-emerald-700" /></div>
              <p className="text-xl md:text-2xl font-bold text-emerald-600">{rsvps.filter(r => r.is_attended).length}</p>
              <p className="text-[10px] md:text-xs text-emerald-700 uppercase font-bold tracking-wider">Đã có mặt</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-white h-fit">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-700">
                <LinkIcon className="w-6 h-6 text-[#7c9cb4]" /> Tạo Link Mời 
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nhập tên :</label>
                  <input 
                    type="text" 
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    placeholder="VD: Anh Huy, Bé Ngăn..."
                    className="w-full border-2 border-slate-100 bg-white/50 rounded-xl p-4 focus:ring-4 focus:ring-sky-100 focus:border-[#7c9cb4] focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateLink}
                  className="w-full bg-[#7c9cb4] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7c9cb4]/30 hover:bg-[#6a8a9e] transition-all"
                >
                  Tạo Link & Mã QR
                </motion.button>

                <AnimatePresence>
                  {generatedLink && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, mt: 0 }} animate={{ opacity: 1, height: "auto", mt: 20 }} exit={{ opacity: 0, height: 0 }}
                      className="p-5 bg-sky-50/80 rounded-2xl border border-sky-100 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-3 justify-center">
                        <QrCode className="w-5 h-5 text-sky-700" />
                        <p className="text-sm text-sky-800 font-bold">Mã QR của bạn</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-sky-100 flex flex-col items-center mb-4 shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedLink)}`} 
                          alt="QR Code" 
                          className="w-32 h-32 mb-3 rounded-lg shadow-sm"
                        />
                        <div className="bg-slate-50 w-full p-2 rounded-lg border border-slate-100 break-all text-xs text-slate-500 text-center select-all mb-3">
                          {generatedLink}
                        </div>
                        {/* NÚT TẢI QR MỚI THÊM */}
                        <motion.button 
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleDownloadQR}
                          className="w-full py-2 bg-sky-100 text-sky-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-sky-200 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Tải ảnh QR về máy
                        </motion.button>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard} 
                        className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-sky-600 border border-sky-200 hover:bg-sky-50'}`}
                      >
                        {copied ? <><CheckCircle2 className="w-4 h-4" /> Đã Copy Link</> : <><Copy className="w-4 h-4" /> Copy Link </>}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-white h-[75vh] flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-7 h-7 text-[#7c9cb4]" />
                  <h2 className="text-xl font-bold text-slate-700">Khách Đã Phản Hồi</h2>
                  {isLoading && <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin ml-2"></div>}
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-slate-700/20 hover:bg-slate-800 transition-colors w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4" /> Xuất File Excel
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-4 no-scrollbar">
                <AnimatePresence>
                  {rsvps.length === 0 && !isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400">
                      <MessageSquareHeart className="w-16 h-16 mb-4 opacity-20" />
                      <p>Chưa có phản hồi nào.</p>
                    </motion.div>
                  ) : (
                    rsvps.map((rsvp) => (
                      <motion.div 
                        key={rsvp.id} 
                        initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: 0.95 }} layout
                        className={`p-4 md:p-5 border rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${rsvp.is_attended ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100'}`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${rsvp.attendance === 'yes' ? 'bg-sky-400' : 'bg-rose-400'}`}></div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pl-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-bold text-lg text-slate-700 mr-1">{rsvp.guest_name}</span>
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide ${rsvp.attendance === 'yes' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-600'}`}>
                                {rsvp.attendance === 'yes' ? 'SẼ ĐẾN 🎉' : 'BẬN 😔'}
                              </span>
                              {/* TAG ĐÃ CHECK-IN */}
                              {rsvp.is_attended && (
                                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3" /> ĐÃ CÓ MẶT
                                </span>
                              )}
                            </div>
                            
                            {rsvp.message ? (
                              <div className="bg-slate-50/80 p-3 md:p-4 rounded-xl border border-slate-100/50 text-slate-600 relative">
                                <MessageSquareHeart className="w-4 h-4 absolute top-3 md:top-4 left-3 md:left-4 text-slate-300" />
                                <p className="pl-6 italic leading-relaxed text-sm md:text-base">"{rsvp.message}"</p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 italic mt-1">Không có lời nhắn.</p>
                            )}
                          </div>
                          
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto h-full gap-2 sm:gap-0 mt-2 sm:mt-0">
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-50/80 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3" />
                              {new Date(rsvp.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(rsvp.created_at).toLocaleDateString('vi-VN')}
                            </div>
                            
                            <div className="flex items-center gap-2 sm:mt-4">
                              {/* NÚT CHECK-IN CHO LỄ TÂN */}
                              <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border transition-colors ${rsvp.is_attended ? 'bg-emerald-100 border-emerald-200 hover:bg-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={rsvp.is_attended || false}
                                  onChange={() => handleToggleCheckIn(rsvp.id, rsvp.is_attended)}
                                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                                />
                                <span className={`text-xs font-bold select-none ${rsvp.is_attended ? 'text-emerald-700' : 'text-slate-500'}`}>
                                  Check-in
                                </span>
                              </label>

                              <button 
                                onClick={() => handleDelete(rsvp.id)}
                                className="text-xs flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors border border-transparent hover:border-rose-100 opacity-100 sm:opacity-60 group-hover:opacity-100"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}