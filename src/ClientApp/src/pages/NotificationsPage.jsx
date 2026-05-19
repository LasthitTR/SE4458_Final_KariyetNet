import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'alerts'
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Bildirimleri Getir
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/api/v1/notifications/${user.uid}`);
      setNotifications(Array.isArray(data) ? data : []);
      // Hepsini okundu yap
      if (data && data.some(n => !n.isRead)) {
        await axiosClient.put(`/api/v1/notifications/${user.uid}/read-all`);
      }
    } catch (err) {
      console.error('Bildirimler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  // Alarmları Getir
  const fetchAlerts = async () => {
    if (!user) return;
    setAlertsLoading(true);
    try {
      const { data } = await axiosClient.get(`/api/v1/jobalerts/user/${user.uid}`);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Alarmlar alınamadı:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [activeTab]);

  // Tek bildirim sil
  const handleDeleteNotification = async (notifId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosClient.delete(`/api/v1/notifications/${notifId}`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Bildirim silinemedi:', err);
    }
  };

  // Tüm bildirimleri sil
  const handleDeleteAllNotifications = async () => {
    if (!window.confirm('Tüm bildirimlerinizi silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosClient.delete(`/api/v1/notifications/user/${user.uid}`);
      setNotifications([]);
    } catch (err) {
      console.error('Tüm bildirimler silinemedi:', err);
    }
  };

  // Alarm sil
  const handleDeleteAlert = async (alertId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bu iş alarmını silmek istediğinizden emin misiniz?')) return;

    try {
      await axiosClient.delete(`/api/v1/jobalerts/${alertId}`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Alarm silinemedi:', err);
    }
  };

  const handleAlertClick = (alert) => {
    const params = new URLSearchParams();
    if (alert.keywords) params.append('position', alert.keywords);
    if (alert.city) params.append('city', alert.city);
    if (alert.town) params.append('town', alert.town);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Üst Kısım */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">🔔 Bildirimler & Alarmlar</h1>
        <p className="text-gray-500 mt-1 text-sm">İş alarmlarınızı yönetin ve bildirimlerinizi görün.</p>
      </div>

      {/* Sekme Seçici */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Gelen Bildirimler ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'alerts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Kayıtlı Alarmlarım ({alerts.length})
          </button>
        </div>

        {/* Tümünü Sil butonu (Sadece Bildirimler sekmesindeyken ve bildirim varsa gösterilir) */}
        {activeTab === 'notifications' && notifications.length > 0 && (
          <button
            onClick={handleDeleteAllNotifications}
            className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-100 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Tümünü Sil
          </button>
        )}
      </div>

      {/* SEKMELERİN İÇERİĞİ */}
      {activeTab === 'notifications' ? (
        loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-600 font-semibold mb-1">Henüz bildiriminiz yok</p>
            <p className="text-xs text-gray-400">Kriterlerinize uygun yeni ilanlar yayınlandığında burada görünecek.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => notif.jobId && navigate(`/job/${notif.jobId}`)}
                className={`bg-white rounded-2xl border p-5 flex items-start gap-4 shadow-sm transition-all relative group ${notif.jobId ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''} ${!notif.isRead ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.title?.includes('Özel') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {notif.title?.includes('Özel') ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                    {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notif.message}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(notif.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-center">
                  {/* Bildirim Silme Butonu */}
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    className="w-9 h-9 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center border border-gray-100 hover:border-red-200 transition"
                    title="Bildirimi Sil"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Yönlendirme İkonu */}
                  {notif.jobId && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ALARMLAR TABI */
        alertsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-600 font-semibold mb-1">Kayıtlı alarmınız bulunmamaktadır</p>
            <p className="text-xs text-gray-400 mb-6">Arama sonuçları sayfasından "Alarm oluştur" butonuna tıklayarak oluşturabilirsiniz.</p>
            <button
              onClick={() => navigate('/search')}
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
            >
              İlanları Ara
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-indigo-100">
                      🎯 {alert.keywords || 'Tüm Pozisyonlar'}
                    </span>
                    {alert.city && (
                      <span className="bg-orange-50 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-orange-100">
                        📍 {alert.city}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-3">
                    Kayıt Tarihi: {new Date(alert.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${alert.matchCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {alert.matchCount} Sonuç
                  </span>

                  <button
                    onClick={(e) => handleDeleteAlert(alert.id, e)}
                    className="w-9 h-9 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center border border-gray-100 hover:border-red-200 transition"
                    title="Alarmı Sil"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
