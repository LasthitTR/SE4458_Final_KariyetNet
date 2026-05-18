import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';
import AutocompleteInput from '../components/AutocompleteInput';
import JobCard from '../components/JobCard';

export default function HomePage() {
  const [position, setPosition] = useState('');
  const [city, setCity] = useState('');
  const [localJobs, setLocalJobs] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [detectedCity, setDetectedCity] = useState('İzmir'); // Geolocation API ile bulunamasa bile İzmir varsayılan
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // HTML5 Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Gerçekte burada bir Geocoding API (örn: Google Maps) kullanılarak lat/lng şehir ismine çevrilir.
          // Basitlik adına tespit edilemediğinde İzmir'de olduğumuzu varsayıyoruz.
          setDetectedCity('İzmir'); 
        },
        () => {
          // Konum reddedildi
          setDetectedCity('İzmir');
        }
      );
    } else {
      setDetectedCity('İzmir');
    }
  }, []);

  useEffect(() => {
    const fetchLocalJobs = async () => {
      try {
        const timestamp = new Date().getTime();
        const { data } = await axiosClient.get(`/api/v1/jobsearch/search?city=${encodeURIComponent(detectedCity)}&_t=${timestamp}`);
        const cityJobs = Array.isArray(data) ? data : [];

        if (cityJobs.length > 0) {
          setLocalJobs(cityJobs.slice(0, 5));
          return;
        }

        const fallbackResponse = await axiosClient.get(`/api/v1/jobsearch/search?pageSize=1000&_t=${timestamp}`);
        const fallbackJobs = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
        const shuffledJobs = [...fallbackJobs].sort(() => Math.random() - 0.5);

        setLocalJobs(shuffledJobs.slice(0, 5));
      } catch (error) {
        console.error("Local jobs error:", error);
      }
    };
    fetchLocalJobs();
  }, [detectedCity]);

  useEffect(() => {
    // Giriş yapmış bir kullanıcı varsa MongoDB'den son aramalarını çek
    const fetchRecentSearches = async () => {
      if (user) {
        try {
          const timestamp = new Date().getTime();
          const { data } = await axiosClient.get(`/api/v1/jobsearch/recent-searches/${user.id}?_t=${timestamp}`);
          setRecentSearches(data);
        } catch (error) {
          console.error("Recent searches error:", error);
        }
      }
    };
    fetchRecentSearches();
  }, [user]);

  const handleSearch = () => {
    // Arama butonuna tıklandığında /search rotasına yönlendiriyoruz
    navigate(`/search?position=${position}&city=${city}`);
  };

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Arama Bölümü */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-12 text-center shadow-2xl text-white relative overflow-hidden">
        {/* Dekoratif arka plan çemberleri */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight relative z-10">Kariyer Fırsatlarını Keşfet</h1>
        <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto font-light relative z-10">
          Hayalinizdeki işe ulaşmak için binlerce ilanı anında filtreleyin ve başvurun.
        </p>
        
        <div className="bg-white p-3 rounded-2xl flex flex-col md:flex-row gap-3 max-w-4xl mx-auto shadow-2xl relative z-10">
          <div className="flex-1">
            <AutocompleteInput 
              placeholder="Pozisyon, şirket veya kelime ara"
              value={position}
              onChange={setPosition}
              icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}
            />
          </div>
          <div className="w-px bg-gray-200 hidden md:block mx-1"></div>
          <div className="flex-1">
            <AutocompleteInput 
              placeholder="Şehir"
              value={city}
              onChange={setCity}
              icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/50 w-full md:w-auto flex-shrink-0"
          >
            İş Bul
          </button>
        </div>
      </section>

      {/* 3. Son Aramalarım (Sadece Giriş Yapılmışsa) */}
      {user && recentSearches.length > 0 && (
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Son Aramalarım
          </h2>
          <div className="flex flex-wrap gap-3">
            {recentSearches.map((search, idx) => (
              <div 
                key={idx} 
                onClick={() => { setPosition(search.positionKeyword); setCity(search.city); }}
                className="bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-medium text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer shadow-sm transition-all"
              >
                {search.positionKeyword || 'Tüm İşler'} {search.city ? `- ${search.city}` : ''}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Konum Bazlı İlan Listeleme */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Sizin İçin Seçilen İlanlar ({detectedCity})
          </h2>
          <button 
            onClick={() => navigate(`/search?city=${detectedCity}`)}
            className="text-blue-600 font-semibold hover:text-blue-800 text-sm"
          >
            Tümünü Gör
          </button>
        </div>
        
        {localJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {localJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <p className="text-lg">Şu an <strong>{detectedCity}</strong> konumu için aktif ilan bulunmuyor.</p>
          </div>
        )}
      </section>

    </div>
  );
}
