import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function Header() {
  const { user, signOut, signIn, signUp } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [status, setStatus] = useState({ message: '', type: '' });

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
      case 'auth/weak-password':
        return 'Şifreniz çok zayıf. Lütfen en az 6 karakterli daha güçlü bir şifre belirleyin.';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi sistemde zaten kayıtlı. Lütfen giriş yapmayı deneyin.';
      case 'auth/user-not-found':
        return 'Bu e-posta adresine ait bir kullanıcı bulunamadı.';
      case 'auth/wrong-password':
        return 'Yanlış şifre girdiniz, lütfen tekrar deneyin.';
      case 'auth/invalid-email':
        return 'Geçersiz bir e-posta adresi formati girdiniz.';
      case 'auth/too-many-requests':
        return 'Çok fazla başarısız deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.';
      default:
        return 'Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus({ message: '', type: '' });
    try {
      if (isLoginMode) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      // Başarılı olunca popup'ı sessizce kapatıyoruz. Arayüz zaten anında kullanıcı adını gösterecek.
      setIsModalOpen(false);
      setEmail('');
      setPassword('');
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
              <div className="flex items-center gap-4">
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
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold">
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              {isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}
            </h2>

            {status.message && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="E-posta Adresi"
                className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Şifre"
                className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-700 transition">
                {isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              {isLoginMode ? "Hesabın yok mu? " : "Zaten üye misin? "}
              <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-blue-600 font-semibold hover:underline">
                {isLoginMode ? 'Hemen Üye Ol' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
