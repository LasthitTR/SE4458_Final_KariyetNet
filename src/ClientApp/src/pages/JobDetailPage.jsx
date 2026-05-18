import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        // 1. İlan detayını Gateway'den (JobPosting servisi) getir
        const { data: jobData } = await axiosClient.get(`/api/v1/jobpostings/${id}`);
        setJob(jobData);

        // 2. İlgili ilanları JobSearch servisinden (Aynı şehirdeki benzer ilanları) getir
        if (jobData && jobData.city) {
          const { data: relatedData } = await axiosClient.get(`/api/v1/jobsearch/search?city=${jobData.city}&pageSize=4`);
          // Kendisini filtrele ve en fazla 3 tane al
          const filtered = relatedData.filter(j => j.id !== jobData.id).slice(0, 3);
          setRelatedJobs(filtered);
        }

        // 3. Kullanıcı giriş yapmışsa başvurup başvurmadığını kontrol et
        if (user && id) {
          const { data: appData } = await axiosClient.get(`/api/v1/jobsearch/has-applied?userId=${user.uid}&jobId=${id}`);
          setApplied(appData.hasApplied);
        }
      } catch (error) {
        console.error("İlan detayı yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    // id veya kullanıcı her değiştiğinde resetle ve baştan yükle
    setApplied(false);
    setErrorMsg("");
    fetchJobDetails();
    window.scrollTo(0, 0); // Sayfa başına kaydır
  }, [id, user]);

  const handleApply = async () => {
    if (!user) {
      navigate('/login', { replace: true, state: { from: `/job/${id}` } });
      return;
    }

    setErrorMsg("");

    setApplying(true);
    try {
      // 1. MongoDB'de başvuruyu kaydet (Tekrar başvurmayı önlemek için)
      await axiosClient.post(`/api/v1/jobsearch/apply?userId=${user.uid}&jobId=${id}`);

      // 2. PostgreSQL'de applicationCount alanını bir arttırıp PUT atarak güncelle
      const updatedJob = { ...job, applicationCount: (job.applicationCount || 0) + 1 };

      await axiosClient.put(`/api/v1/jobpostings/${id}`, updatedJob);

      setJob(updatedJob);
      setApplied(true);
    } catch (error) {
      console.error("Başvuru sırasında hata:", error);
      setErrorMsg("Başvuru işlemi sırasında bir hata oluştu. Zaten başvurmuş olabilirsiniz.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-500">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">İlan Bulunamadı</h3>
        <p>Aradığınız ilan yayından kaldırılmış veya hatalı bir bağlantıya tıkladınız.</p>
        <button onClick={() => navigate(-1)} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Geri Dön</button>
      </div>
    );
  }

  // Tarih formatlama
  const dateFormatted = new Date(job.updatedAt || job.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 1. Sol Panel - İlan Ana Detayları */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">

        {/* İlan Başlığı ve Özet Bilgiler */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          {/* Arka plan deseni */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-blue-600 font-bold">{job.companyName}</p>
            </div>
            {/* Şirket Logosu Placeholder */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-3xl shadow-sm border border-blue-200">
              {job.companyName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 border-t border-b border-gray-100 py-5 mb-6 relative z-10">
            <span className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {job.city}{job.town ? `, ${job.town}` : ''}
            </span>
            <span className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              {job.workingPreference || 'Belirtilmemiş'}
            </span>
            <span className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {job.workingType || 'Tam Zamanlı'}
            </span>
            <span className="flex items-center bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 text-orange-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {job.applicationCount || 0} Kişi Başvurdu
            </span>
          </div>

          {/* Custom Banners */}
          {applied && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm relative z-10 animate-fadeIn">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-base mb-1">Başvurunuz Başarıyla Alındı!</h4>
                <p className="text-sm text-emerald-800 leading-relaxed font-medium">İlan sahibi en kısa sürede sizinle iletişime geçecektir. Bol şans dileriz! 🚀</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm relative z-10 animate-fadeIn">
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                !
              </div>
              <div>
                <h4 className="font-extrabold text-rose-950 text-base mb-1">Dikkat</h4>
                <p className="text-sm text-rose-800 leading-relaxed font-medium">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <span className="text-sm text-gray-400 font-medium">Son Güncelleme: {dateFormatted}</span>
            <button
              onClick={handleApply}
              disabled={applying || applied}
              className={`w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-lg shadow-md transition-all ${applied
                  ? 'bg-emerald-500 text-white cursor-not-allowed shadow-emerald-500/30'
                  : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-orange-500/40'
                }`}
            >
              {applying ? 'İşleniyor...' : applied ? 'Başvuru Yapıldı ✓' : 'Hemen Başvur'}
            </button>
          </div>
        </div>

        {/* İlan Açıklaması (Description) */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Genel Nitelikler ve İş Tanımı</h2>

          <div className="prose max-w-none text-gray-700 leading-loose whitespace-pre-wrap text-[15px]">
            {job.description || 'Bu ilan için detaylı bir açıklama girilmemiştir.'}
          </div>

          {(job.positionLevel || job.department || job.experience || job.educationLevel) && (
            <div className="mt-10 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
              {job.positionLevel && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pozisyon Seviyesi</span>
                  <span className="font-medium text-gray-800">{job.positionLevel}</span>
                </div>
              )}
              {job.department && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Departman</span>
                  <span className="font-medium text-gray-800">{job.department}</span>
                </div>
              )}
              {job.experience && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tecrübe</span>
                  <span className="font-medium text-gray-800">{job.experience}</span>
                </div>
              )}
              {job.educationLevel && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Eğitim Seviyesi</span>
                  <span className="font-medium text-gray-800">{job.educationLevel}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Sağ Panel - İlgili İlanlar */}
      <aside className="w-full lg:w-1/3">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm sticky top-6">
          <h3 className="text-xl font-bold text-blue-900 mb-5 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            İlgini Çekebilecek İlanlar
          </h3>

          <div className="space-y-4">
            {relatedJobs.length > 0 ? (
              relatedJobs.map(rJob => (
                <div
                  key={rJob.id}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-all hover:shadow-md group cursor-pointer"
                  onClick={() => navigate(`/job/${rJob.id}`)}
                >
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1">{rJob.title}</h4>
                  <p className="text-sm font-medium text-gray-500 mb-3">{rJob.companyName}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path></svg>
                      {rJob.city}
                    </span>
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-md font-semibold">
                      {rJob.workingPreference || 'Belirtilmemiş'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white bg-opacity-60 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-500 font-medium">Bu şehre veya kritere uygun başka aktif ilan bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </aside>

    </div>
  );
}
