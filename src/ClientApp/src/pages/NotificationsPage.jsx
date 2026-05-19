import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    const fetchAll = async () => {
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
    fetchAll();
  }, [user, navigate]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">🔔 Bildirimlerim</h1>
          <p className="text-gray-500 mt-1 text-sm">İş alarmlarınız ve size özel ilan önerileri</p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-sm font-bold px-4 py-2 rounded-full">
          {notifications.length} bildirim
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz bildiriminiz yok</h3>
          <p className="text-sm text-gray-400 mb-6">Arama sayfasından bir iş alarmı oluşturduğunuzda uygun ilanlar burada görünecek.</p>
          <button
            onClick={() => navigate('/search')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition shadow-md"
          >
            İş Ara
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => notif.jobId && navigate(`/job/${notif.jobId}`)}
              className={`bg-white rounded-2xl border p-5 flex items-start gap-4 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all ${!notif.isRead ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200'}`}
            >
              {/* İkon */}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${notif.title?.includes('Özel') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
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

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                  {!notif.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notif.message}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(notif.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Ok */}
              {notif.jobId && (
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
