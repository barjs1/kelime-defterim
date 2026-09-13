import React, { useState } from 'react';
import {
  User,
  Settings,
  Volume2,
  Target,
  LogOut,
  Check,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWords } from '../../context/WordContext';
import { speakEnglish } from '../../utils/speech';

interface ProfileViewProps {
  onOpenAuthModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuthModal }) => {
  const { user, updateProfile, logout } = useAuth();
  const { words } = useWords();

  const [name, setName] = useState(user?.name || '');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoal || 10);
  const [preferredVoice, setPreferredVoice] = useState<'en-US' | 'en-GB'>(
    user?.preferredVoice || 'en-US'
  );
  const [speechRate, setSpeechRate] = useState<number>(user?.speechRate || 0.9);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || (user?.name || 'Kullanıcı'),
      dailyGoal: Number(dailyGoal),
      preferredVoice,
      speechRate: Number(speechRate),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestVoice = () => {
    speakEnglish(
      'Spaced repetition is the most effective method for long-term vocabulary retention.',
      preferredVoice,
      speechRate
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        {user ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Hesap Bağlı
                </span>
              </div>
              <p className="text-sm text-slate-600">{user.email}</p>
              <p className="text-xs text-slate-500">
                Kayıtlı Kelime Sayısı: <strong className="text-slate-800">{words.length}</strong> • Üyelik:{' '}
                {user.joinedDate}
              </p>
            </div>

            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Hesaptan Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 font-bold text-2xl flex items-center justify-center shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Çevrimdışı Ziyaretçi</h2>
                <p className="text-xs text-slate-600">
                  Kelimelerinizi güvenle veritabanında saklamak için ücretsiz giriş yapın veya kayıt olun.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAuthModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-100 transition-colors cursor-pointer flex items-center gap-2 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap / Kayıt Ol</span>
            </button>
          </div>
        )}
      </div>

      {/* Preferences Form */}
      <form
        onSubmit={handleSavePreferences}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Çalışma & Telaffuz Ayarları
            </h3>
            <p className="text-xs text-slate-600">Günlük hedeflerinizi ve seslendirme tercihlerini özelleştirin</p>
          </div>

          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Kaydedildi!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Görünen Adınız
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
          </div>

          {/* Daily Goal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Günlük Kelime Tekrar Hedefi
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-24 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden font-bold"
              />
              <span className="text-xs text-slate-500">kelime / gün</span>
            </div>
          </div>

          {/* Voice Accent */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              İngilizce Telaffuz Aksanı
            </label>
            <select
              value={preferredVoice}
              onChange={(e) => setPreferredVoice(e.target.value as any)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            >
              <option value="en-US">🇺🇸 Amerikan İngilizcesi (en-US)</option>
              <option value="en-GB">🇬🇧 İngiliz İngilizcesi (en-GB)</option>
            </select>
          </div>

          {/* Speech Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Telaffuz Hızı</label>
              <span className="text-xs font-mono font-bold text-indigo-600">{speechRate}x</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <button
                type="button"
                onClick={handleTestVoice}
                className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 shrink-0 cursor-pointer"
              >
                Test Et
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-indigo-100 transition-colors cursor-pointer"
          >
            Tercihleri Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};
