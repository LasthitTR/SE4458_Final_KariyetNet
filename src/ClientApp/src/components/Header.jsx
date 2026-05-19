import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import axiosClient from '../utils/axiosClient';

export default function Header() {
  const { user, signOut, signIn, signUp } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [status, setStatus] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  // Bildirim State
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Bildirimleri çek (her 30 saniyede bir)
  useEffect(() => {
    if (!user) { setNotifications([]); return; }

    const fetchNotifications = async () => {
      try {
        const { data } = await axiosClient.get(`/api/v1/notifications/${user.uid}`);
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        // Sessizce geç
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Bildirim paneli dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = async () => {
    setIsNotifOpen(prev => !prev);
    // Açılınca hepsini okundu yap
    if (!isNotifOpen && unreadCount > 0 && user) {
      try {
        await axiosClient.put(`/api/v1/notifications/${user.uid}/read-all`);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch { /* sessizce geç */ }
    }
  };

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-credential': return 'E-posta adresi veya şifre hatalı.';
      case 'auth/weak-password': return 'Şifreniz çok zayıf. En az 6 karakter giriniz.';
      case 'auth/email-already-in-use': return 'Bu e-posta zaten kayıtlı.';
      case 'auth/user-not-found': return 'Bu e-postaya ait kullanıcı bulunamadı.';
      case 'auth/wrong-password': return 'Yanlış şifre.';
      case 'auth/invalid-email': return 'Geçersiz e-posta formatı.';
      case 'auth/too-many-requests': return 'Çok fazla deneme. Lütfen bekleyin.';
      default: return 'Beklenmedik bir hata oluştu.';
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus({ message: '', type: '' });
    try {
      if (isLoginMode) { await signIn(email, password); }
      else { await signUp(email, password); }
      setIsModalOpen(false); setEmail(''); setPassword('');
    } catch (error) {
      setStatus({ message: getFirebaseErrorMessage(error.code), type: 'error' });
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-3xl font-extrabold text-blue-700 tracking-tight">
            KariyerNet<span className="text-orange-500">.ai</span>
          </Link>
          <div className="flex gap-4 items-center">
            {user && user.email === 'admin@kariyer.net' && (
              <Link to="/admin" className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold px-4 py-2 rounded-xl border border-indigo-100 transition shadow-sm">
                Sistem Yönetimi
              </Link>
            )}
            <Link to="/isveren" className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2">
              İşveren
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {/* 🔔 Bildirim Çanı */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleOpenNotifications}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    title="Bildirimler"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bildirim Dropdown */}
                  {isNotifOpen && (
                    <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center">
                        <h3 className="text-white font-bold text-sm">Bildirimler</h3>
                        <span className="text-blue-200 text-xs">{notifications.length} bildirim</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm font-medium">Henüz bildiriminiz yok</p>
                            <p className="text-xs mt-1">İş alarmı oluşturduğunuzda burada göreceksiniz</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => { if (notif.jobId) { navigate(`/job/${notif.jobId}`); setIsNotifOpen(false); } }}
                              className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!notif.isRead ? 'bg-blue-50' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="border-t border-gray-100 p-2">
                          <button
                            onClick={() => { navigate('/bildirimlerim'); setIsNotifOpen(false); }}
                            className="w-full text-center text-sm text-blue-600 font-semibold py-2 rounded-xl hover:bg-blue-50 transition"
                          >
                            Tüm Bildirimleri Gör →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-sm font-medium text-gray-700">{user.email}</span>
                <button
                  onClick={signOut}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-full font-semibold hover:bg-red-100 transition shadow-sm border border-red-200">
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition shadow-md">
                Giriş Yap / Üye Ol
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold">×</button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
            {status.message && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {status.message}
              </div>
            )}
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input type="email" placeholder="E-posta Adresi" className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Şifre" className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-700 transition">{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}</button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              {isLoginMode ? "Hesabın yok mu? " : "Zaten üye misin? "}
              <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-blue-600 font-semibold hover:underline">
                {isLoginMode ? 'Hemen Üye Ol' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
