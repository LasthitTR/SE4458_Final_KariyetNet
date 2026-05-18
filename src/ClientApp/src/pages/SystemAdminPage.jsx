import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import axiosClient from '../utils/axiosClient';

export default function SystemAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Job listing state
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  
  const { user, signIn, signOut, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Admin olup olmadığını e-posta adresinden anlıyoruz
  const isAdmin = user && user.email === 'admin@kariyer.net';

  useEffect(() => {
    if (isAdmin) {
      fetchJobs();
    }
  }, [isAdmin]);

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const timestamp = new Date().getTime();
      // API'den tüm ilanları çekiyoruz (sayfalama için büyük bir pageSize verdik)
      const { data } = await axiosClient.get(`/api/v1/jobpostings?pageSize=100&_t=${timestamp}`);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('İlanlar çekilirken hata:', err);
      // Hata olsa bile API kapalı senaryoları için boş liste
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;
    
    try {
      await axiosClient.delete(`/api/v1/jobpostings/${jobId}`);
      setActionMessage({ text: 'İlan başarıyla silindi.', type: 'success' });
      setJobs(jobs.filter(job => job.id !== jobId));
      
      setTimeout(() => setActionMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('İlan silinirken hata:', err);
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.response?.data || err.message;
      setActionMessage({ 
        text: `İlan silinirken bir hata oluştu. (Durum: ${status || 'Network Error'}, Detay: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg})`, 
        type: 'error' 
      });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 10000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Eğer giren kişi sadece "admin" yazarsa, kolaylık olsun diye email'e tamamlayalım
    const loginEmail = email.includes('@') ? email : `${email}@kariyer.net`;

    try {
      await signIn(loginEmail, password);
      // Giriş yapıldı, state otomatik güncellenecek
    } catch (err) {
      console.error(err);
      setError('Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa veya yetkili değilse login formunu göster
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in-up">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
          {/* Arka plan süslemesi */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sistem Yönetimi</h1>
            <p className="text-gray-500 text-sm">Sadece yetkili yöneticiler giriş yapabilir. (Örn: admin@kariyer.net)</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 text-center border border-red-200 shadow-sm relative z-10">
              {error}
            </div>
          )}
          
          {user && !isAdmin && (
             <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-sm font-medium mb-6 text-center border border-orange-200 shadow-sm relative z-10">
               Mevcut hesabınızın ({user.email}) bu panele erişim yetkisi yoktur. Lütfen yetkili bir hesapla giriş yapın.
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-posta veya Kullanıcı Adı</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition bg-gray-50 focus:bg-white"
                placeholder="admin@kariyer.net"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Şifre</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition bg-gray-50 focus:bg-white"
                placeholder="••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-indigo-500/40 mt-4"
            >
              Yönetici Girişi Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Başarıyla Giriş Yaptı (isAdmin === true)
  return (
    <div className="max-w-6xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Sistem Admin Paneli</h1>
          <p className="text-gray-500 mt-1">Platformun genel yönetim ve istatistik sayfası.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">{user.email}</span>
          <button 
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold hover:bg-red-100 transition border border-red-200 shadow-sm"
          >
            Güvenli Çıkış
          </button>
        </div>
      </div>


      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          Sistemdeki Tüm İş İlanları
        </h2>
        
        {actionMessage.text && (
          <div className={`p-4 rounded-xl text-sm font-medium mb-6 flex items-center ${actionMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            {actionMessage.text}
          </div>
        )}

        {isLoadingJobs ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600"></div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-bold rounded-tl-xl">Pozisyon</th>
                  <th className="p-4 font-bold">Şirket</th>
                  <th className="p-4 font-bold">Konum</th>
                  <th className="p-4 font-bold">Tarih</th>
                  <th className="p-4 font-bold text-center rounded-tr-xl">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-800">{job.title}</td>
                    <td className="p-4 text-gray-600">{job.companyName}</td>
                    <td className="p-4 text-gray-600">{job.city}</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteJob(job.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg transition text-sm"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-xl">
            Sistemde henüz iş ilanı bulunmuyor veya API'ye ulaşılamıyor.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Sistem Yönetimi Bilgisi
        </h2>
        <div className="space-y-4 text-gray-600">
          <p className="flex items-start">
            <span className="text-emerald-500 mr-2 mt-0.5">✔</span>
            Bu sayfa yetkili yöneticilere özeldir. Yukarıdaki listeden sistemdeki tüm ilanları görebilir ve silebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
