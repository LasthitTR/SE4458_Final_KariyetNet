import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';

export default function AdminPage() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    city: '',
    town: '',
    workingPreference: '',
    workingType: '',
    positionLevel: '',
    department: '',
    description: '',
    experience: '',
    educationLevel: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Herkesin erişimine açık işveren sayfası

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Axios interceptor JWT Bearer token'ı zaten ekliyor, sadece post atıyoruz
      await axiosClient.post('/api/v1/jobpostings', formData);

      setSuccessMessage('İlan başarıyla oluşturuldu! Arama sonuçlarında ve ana sayfada hemen listelenecektir.');

      // Formu temizle
      setFormData({
        title: '',
        companyName: '',
        city: '',
        town: '',
        workingPreference: '',
        workingType: '',
        positionLevel: '',
        department: '',
        description: '',
        experience: '',
        educationLevel: ''
      });

      // 5 saniye sonra success mesajını kaldır
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error("İlan eklenirken hata:", error);
      setErrorMessage("İlan kaydedilirken bir hata oluştu. Lütfen bağlantınızı ve yetkinizi kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">İşveren Yönetim Paneli</h1>
        <p className="text-gray-500">Sisteme yeni bir iş ilanı ekleyin. Eklenen ilanlar anında yayına alınır ve adaylar tarafından aranabilir hale gelir.</p>
      </div>

      {/* İşlem Sonucu Toast/Bildirimleri */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 rounded-r-xl shadow-sm animate-fade-in-up">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-emerald-700 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl shadow-sm animate-fade-in-up">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-red-700 font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Yeni İlan Oluştur
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">İlan Başlığı <span className="text-red-500">*</span></label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: Kıdemli .NET Geliştirici" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Şirket Adı <span className="text-red-500">*</span></label>
              <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: KariyerTech A.Ş." />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Departman</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: Bilgi Teknolojileri" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Şehir <span className="text-red-500">*</span></label>
              <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: İstanbul" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">İlçe</label>
              <input type="text" name="town" value={formData.town} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: Kadıköy" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Çalışma Tercihi</label>
              <select name="workingPreference" value={formData.workingPreference} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white">
                <option value="">Seçiniz...</option>
                <option value="İş Yerinde">İş Yerinde</option>
                <option value="Uzaktan">Uzaktan (Remote)</option>
                <option value="Hibrit">Hibrit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Çalışma Şekli</label>
              <select name="workingType" value={formData.workingType} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white">
                <option value="">Seçiniz...</option>
                <option value="Tam Zamanlı">Tam Zamanlı</option>
                <option value="Yarı Zamanlı">Yarı Zamanlı</option>
                <option value="Serbest Zamanlı">Serbest Zamanlı (Freelance)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pozisyon Seviyesi</label>
              <input type="text" name="positionLevel" value={formData.positionLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: Uzman / Kıdemli" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tecrübe Beklentisi</label>
              <input type="text" name="experience" value={formData.experience} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: En az 3 yıl tecrübeli" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Eğitim Seviyesi</label>
              <input type="text" name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white" placeholder="Örn: Üniversite Mezunu" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Genel Nitelikler ve İş Tanımı <span className="text-red-500">*</span></label>
              <textarea name="description" required value={formData.description} onChange={handleChange} rows="6" className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white resize-y" placeholder="Adaylarda aradığınız özellikleri, işin tanımını ve sunulan yan hakları detaylıca yazın..."></textarea>
            </div>
          </div>

          <div className="flex justify-end pt-5 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-10 rounded-xl transition-all shadow-md hover:shadow-blue-500/40 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  İlanınız Yayınlanıyor...
                </>
              ) : (
                'İlanı Yayınla'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
