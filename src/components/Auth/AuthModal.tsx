import React, { useState } from 'react';
import { X, User, Mail, Lock, Check, LogIn, Cloud, ShieldCheck, Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginAsPreviewGuest,
    authError,
    clearAuthError,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLocalError('');
    clearAuthError();
    setIsSubmitting(true);
    const ok = await loginWithGoogle();
    setIsSubmitting(false);
    if (ok) {
      setSuccessMsg('Google ile başarıyla giriş yapıldı!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearAuthError();
    setSuccessMsg('');

    if (!email.trim()) {
      setLocalError('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (tab === 'register') {
      if (!name.trim()) {
        setLocalError('Lütfen adınızı ve soyadınızı giriniz.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (tab === 'register') {
        const ok = await registerWithEmail(name, email, password);
        if (ok) {
          setSuccessMsg('Hesabınız oluşturuldu! Kelime defteriniz hazır.');
          setTimeout(() => {
            onClose();
            setSuccessMsg('');
          }, 600);
        }
      } else {
        const ok = await loginWithEmail(email, password);
        if (ok) {
          setSuccessMsg('Giriş başarılı! Kelimeleriniz senkronize ediliyor.');
          setTimeout(() => {
            onClose();
            setSuccessMsg('');
          }, 500);
        }
      }
    } catch {
      setLocalError('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              {tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {tab === 'login' ? 'Hesabınıza Giriş Yapın' : 'Yeni Hesap Oluşturun'}
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-indigo-500" />
                Kelimelerinizi güvenle bulutta saklayın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Google Sign In & Quick Preview Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                loginAsPreviewGuest('Önizleme Kullanıcısı');
                setSuccessMsg('Önizleme hesabıyla başarıyla giriş yapıldı!');
                setTimeout(() => {
                  onClose();
                  setSuccessMsg('');
                }, 400);
              }}
              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-200/60 border border-indigo-200 rounded-xl text-indigo-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Hızlı Önizleme Hesabı ile Başla</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google ile Devam Et</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              veya e-posta ile
            </span>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setLocalError('');
                clearAuthError();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setLocalError('');
                clearAuthError();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {displayedError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{displayedError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adınız ve Soyadınız
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ornek@eposta.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Şifrenizi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 outline-hidden"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all mt-2 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>İşleniyor...</span>
              ) : tab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Giriş Yap</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Kayıt Ol ve Başla</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kelimeleriniz ve çalışma geçmişiniz güvenle bulutta saklanır</span>
          </div>
        </div>
      </div>
    </div>
  );
};
