import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';
import JobCard from '../components/JobCard';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // URL'deki filtre parametreleri
  const position = searchParams.get('position') || '';
  const city = searchParams.get('city') || '';
  const town = searchParams.get('town') || '';
  const workingPreference = searchParams.get('workingPreference') || '';
  const country = searchParams.get('country') || '';
  
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // İş Alarmı Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertKeywords, setAlertKeywords] = useState(position || '');
  const [alertCountry, setAlertCountry] = useState(country || 'Türkiye');
  const [alertCity, setAlertCity] = useState(city || '');
  const [alertTown, setAlertTown] = useState(town || '');
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);

  // Sol paneldeki form durumları
  const [filterCity, setFilterCity] = useState(city);
  const [filterTown, setFilterTown] = useState(town);
  const [filterPref, setFilterPref] = useState(workingPreference);
  const [filterCountry, setFilterCountry] = useState(country);

  const fetchJobs = async (currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (position) params.append('position', position);
      if (country) params.append('country', country);
      if (city) params.append('city', city);
      if (town) params.append('town', town);
      if (workingPreference) params.append('workingPreference', workingPreference);
      
      // Kullanıcı giriş yapmışsa backend'e ID yolluyoruz ki arama geçmişine (MongoDB) kaydedilsin
      if (user) params.append('userId', user.id); 
      
      params.append('pageNumber', currentPage);
      params.append('pageSize', 10);
      params.append('_t', new Date().getTime());
      
      const { data } = await axiosClient.get(`/api/v1/jobsearch/search?${params.toString()}`);
      
      setJobs(Array.isArray(data) ? data : []);
      // Eğer dönen ilan sayısı sayfa limitine (10) eşitse, sonraki sayfa da olabilir varsayımı
      setHasMore(data.length === 10);
    } catch (error) {
      console.error("Arama sonuçları getirilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URL değiştiğinde (yeni filtre eklendiğinde) veya kullanıcı girdiğinde aramayı baştan yap
    setPage(1);
    fetchJobs(1);
  }, [position, city, town, workingPreference, country, user]);

  useEffect(() => {
    // Sadece sayfa değiştiğinde çağırıyoruz
    if (page > 1) {
      fetchJobs(page);
    }
  }, [page]);

  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    if (filterCity) newParams.set('city', filterCity); else newParams.delete('city');
    if (filterTown) newParams.set('town', filterTown); else newParams.delete('town');
    if (filterPref) newParams.set('workingPreference', filterPref); else newParams.delete('workingPreference');
    if (filterCountry) newParams.set('country', filterCountry); else newParams.delete('country');
    
    // Yönlendirme (Render'ı tetikleyip useEffect'in çalışmasını sağlar)
    setSearchParams(newParams);
  };

  const removeFilter = (key) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
    
    if (key === 'city') setFilterCity('');
    if (key === 'town') setFilterTown('');
    if (key === 'workingPreference') setFilterPref('');
    if (key === 'country') setFilterCountry('');
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("İş alarmı oluşturabilmek için lütfen giriş yapın.");
      return;
    }
    
    setIsAlertSubmitting(true);
    try {
      await axiosClient.post('/api/v1/jobalerts', {
        userId: user.id,
        keywords: alertKeywords,
        country: alertCountry,
        city: alertCity,
        town: alertTown
      });
      alert("İş alarmınız başarıyla oluşturuldu! Uygun ilanlar bulunduğunda size bildireceğiz.");
      setIsAlertModalOpen(false);
    } catch (error) {
      console.error("Alarm oluşturulurken hata:", error);
      alert("Alarm kaydedilirken bir hata oluştu.");
    } finally {
      setIsAlertSubmitting(false);
    }
  };

  // Aktif filtreleri hazırlıyoruz
  const activeFilters = [];
  if (position) activeFilters.push({ key: 'position', label: `Pozisyon: ${position}` });
  if (country) activeFilters.push({ key: 'country', label: `Ülke: ${country}` });
  if (city) activeFilters.push({ key: 'city', label: `Şehir: ${city}` });
  if (town) activeFilters.push({ key: 'town', label: `İlçe: ${town}` });
  if (workingPreference) activeFilters.push({ key: 'workingPreference', label: `Tercih: ${workingPreference}` });

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 1. Sol Panel - Filtreler */}
      <aside className="w-full md:w-1/4 lg:w-1/5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit sticky top-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          Filtrele
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ülke</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
              placeholder="Örn: Türkiye"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şehir</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
              placeholder="Örn: İstanbul"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">İlçe</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
              placeholder="Örn: Kadıköy"
              value={filterTown}
              onChange={(e) => setFilterTown(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Çalışma Tercihi</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-white"
              value={filterPref}
              onChange={(e) => setFilterPref(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="İş Yerinde">İş Yerinde</option>
              <option value="Uzaktan">Uzaktan (Remote)</option>
              <option value="Hibrit">Hibrit</option>
            </select>
          </div>
          <button 
            onClick={applyFilters}
            className="w-full bg-blue-600 text-white font-bold py-3 mt-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Filtreleri Uygula
          </button>
        </div>
      </aside>

      {/* Sağ Taraf - Sonuçlar ve Top Bar */}
      <div className="w-full md:w-3/4 lg:w-4/5 flex flex-col">
        
        {/* 2. Aktif Filtreler (Top Bar) ve İş Alarmı Butonu */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-700 font-semibold mr-2 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Seçili Filtreler:
            </span>
            {activeFilters.length === 0 ? (
              <span className="text-sm text-gray-400 font-medium italic">Herhangi bir filtre seçilmedi</span>
            ) : (
              activeFilters.map(filter => (
                <span key={filter.key} className="inline-flex items-center bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 transition">
                  {filter.label}
                  <button 
                    onClick={() => removeFilter(filter.key)}
                    className="ml-2.5 text-blue-500 hover:text-red-500 focus:outline-none transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </span>
              ))
            )}
          </div>
          
          <button 
            onClick={() => {
              if(!user) { alert("Lütfen önce giriş yapın."); return; }
              setIsAlertModalOpen(true);
            }}
            className="flex items-center bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm"
          >
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            Bu Aramayı Kaydet (Alarm)
          </button>
        </div>

        {/* 3. Arama Sonuçları Listesi */}
        <div className="flex-grow">
          {loading && page === 1 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 text-center rounded-2xl border border-dashed border-gray-300 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Sonuç Bulunamadı</h3>
              <p>Aradığınız kriterlere uygun iş ilanı bulunmamaktadır. Lütfen filtrelerinizi hafifleterek tekrar deneyin.</p>
            </div>
          )}
        </div>

        {/* 3. Sayfalama (Pagination) */}
        {jobs.length > 0 && (
          <div className="mt-8 flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              &larr; Önceki Sayfa
            </button>
            <span className="text-gray-600 font-bold bg-gray-100 px-4 py-2 rounded-lg">
              Sayfa {page}
            </span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Sonraki Sayfa &rarr;
            </button>
          </div>
        )}
      </div>

      {/* İş Alarmı Modal'ı */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                İş Alarmı Oluştur
              </h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-white/70 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">Aşağıdaki kriterlere uygun yeni bir ilan yayınlandığında size bildirim (log) göndereceğiz.</p>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Anahtar Kelime (Pozisyon vb.)</label>
                <input type="text" required value={alertKeywords} onChange={(e) => setAlertKeywords(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Örn: React Developer" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ülke</label>
                  <input type="text" value={alertCountry} onChange={(e) => setAlertCountry(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Şehir</label>
                  <input type="text" value={alertCity} onChange={(e) => setAlertCity(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Örn: İstanbul" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">İlçe</label>
                <input type="text" value={alertTown} onChange={(e) => setAlertTown(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Örn: Kadıköy" />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                <button type="button" onClick={() => setIsAlertModalOpen(false)} className="px-5 py-2.5 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
                <button type="submit" disabled={isAlertSubmitting} className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {isAlertSubmitting ? 'Kaydediliyor...' : 'Alarmı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
