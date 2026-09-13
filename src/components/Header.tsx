import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Volume2,
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWords } from '../context/WordContext';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenProfile: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenProfile,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const { todayReviewsCount, wordsDueToday } = useWords();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const dailyGoal = user?.dailyGoal || 10;
  const goalProgress = Math.min(100, Math.round((todayReviewsCount / dailyGoal) * 100));

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
                  Kelime <span className="text-indigo-600">Defterim</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium hidden sm:block">
                İngilizce Kelime & Öğrenme Platformu
              </p>
            </div>
          </div>

          {/* Center Stats (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Daily Goal Progress */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
              <CheckCircle2
                className={`w-4 h-4 ${
                  todayReviewsCount >= dailyGoal
                    ? 'text-emerald-500 fill-emerald-500'
                    : 'text-slate-400'
                }`}
              />
              <span className="text-xs font-semibold">
                Bugünkü Tekrar: <strong className="text-slate-900">{todayReviewsCount}</strong> / {dailyGoal}
              </span>
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Add Word (Desktop / Tablet) */}
            <button
              id="header-add-word-btn"
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Kelime Ekle</span>
            </button>

            {/* User Dropdown / Profile */}
            <div className="relative">
              {user ? (
                <div className="flex items-center">
                  <button
                    id="header-user-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate max-w-[110px]">
                        {user.email}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Giriş yapıldı:</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-600 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={onOpenProfile}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Profil & Hedef Ayarları
                        </button>
                      </div>

                      <div className="py-1 border-t border-slate-100">
                        <button
                          onClick={logout}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="header-login-btn"
                  onClick={onOpenAuthModal}
                  className="px-3.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Giriş Yap / Kayıt Ol
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Quick Stats Strip */}
      <div className="flex md:hidden items-center justify-between px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              todayReviewsCount >= dailyGoal ? 'text-emerald-500 fill-emerald-500' : 'text-slate-400'
            }`}
          />
          <span>
            Bugünkü Hedef: <strong className="text-slate-900">{todayReviewsCount}</strong> / {dailyGoal}
          </span>
        </div>
        {wordsDueToday.length > 0 && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {wordsDueToday.length} tekrar bekliyor
          </span>
        )}
      </div>
    </header>
  );
};
