import React from 'react';
import { BookOpen, Repeat, BarChart3, User, Plus } from 'lucide-react';
import { useWords } from '../context/WordContext';

export type TabType = 'words' | 'study' | 'analytics' | 'profile';

interface NavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenAddModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  onOpenAddModal,
}) => {
  const { wordsDueToday } = useWords();
  const dueCount = wordsDueToday.length;

  return (
    <>
      {/* Desktop Top Navigation Tabs */}
      <nav aria-label="Ana Menü" className="hidden md:block bg-white border-b border-slate-200 sticky top-16 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 py-2">
            <button
              id="nav-desktop-words"
              onClick={() => onChangeTab('words')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'words'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${currentTab === 'words' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Kelimelerim</span>
              {currentTab === 'words' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              id="nav-desktop-study"
              onClick={() => onChangeTab('study')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'study'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Repeat className={`w-4 h-4 ${currentTab === 'study' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Tekrar Et & Çalış</span>
              {dueCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {dueCount}
                </span>
              )}
              {currentTab === 'study' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              id="nav-desktop-analytics"
              onClick={() => onChangeTab('analytics')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${currentTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>İlerleme & Grafikler</span>
              {currentTab === 'analytics' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              id="nav-desktop-profile"
              onClick={() => onChangeTab('profile')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className={`w-4 h-4 ${currentTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Profil & Ayarlar</span>
              {currentTab === 'profile' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Ergonomic Bottom Navigation Bar */}
      <nav
        aria-label="Mobil Alt Menü"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto relative">
          {/* 1. Kelimeler */}
          <button
            id="nav-mobile-words"
            onClick={() => onChangeTab('words')}
            className={`relative flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-95 ${
              currentTab === 'words' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="relative p-1">
              <BookOpen
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'words' ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                }`}
              />
            </div>
            <span
              className={`text-[10px] mt-0.5 transition-colors ${
                currentTab === 'words' ? 'font-bold text-indigo-600' : 'font-medium text-slate-700'
              }`}
            >
              Kelimeler
            </span>
            {currentTab === 'words' && (
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 2. Tekrar Et (With Due Badge) */}
          <button
            id="nav-mobile-study"
            onClick={() => onChangeTab('study')}
            className={`relative flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-95 ${
              currentTab === 'study' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="relative p-1">
              <Repeat
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'study' ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                }`}
              />
              {dueCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[9px] font-bold rounded-full bg-rose-500 text-white shadow-xs animate-pulse">
                  {dueCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-0.5 transition-colors ${
                currentTab === 'study' ? 'font-bold text-indigo-600' : 'font-medium text-slate-700'
              }`}
            >
              Tekrar Et
            </span>
            {currentTab === 'study' && (
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 3. Center Elevated Action Button: Quick Add Word */}
          {onOpenAddModal && (
            <div className="flex-1 flex flex-col items-center justify-center -mt-5">
              <button
                id="nav-mobile-fab-add"
                onClick={onOpenAddModal}
                aria-label="Yeni Kelime Ekle"
                className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-300 ring-4 ring-white active:scale-90 transition-all cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[10px] font-bold text-indigo-700 mt-1">Ekle</span>
            </div>
          )}

          {/* 4. Grafikler & İlerleme */}
          <button
            id="nav-mobile-analytics"
            onClick={() => onChangeTab('analytics')}
            className={`relative flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-95 ${
              currentTab === 'analytics' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="relative p-1">
              <BarChart3
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'analytics' ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                }`}
              />
            </div>
            <span
              className={`text-[10px] mt-0.5 transition-colors ${
                currentTab === 'analytics' ? 'font-bold text-indigo-600' : 'font-medium text-slate-700'
              }`}
            >
              Grafikler
            </span>
            {currentTab === 'analytics' && (
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5" />
            )}
          </button>

          {/* 5. Profil */}
          <button
            id="nav-mobile-profile"
            onClick={() => onChangeTab('profile')}
            className={`relative flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-95 ${
              currentTab === 'profile' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="relative p-1">
              <User
                className={`w-5 h-5 transition-transform ${
                  currentTab === 'profile' ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                }`}
              />
            </div>
            <span
              className={`text-[10px] mt-0.5 transition-colors ${
                currentTab === 'profile' ? 'font-bold text-indigo-600' : 'font-medium text-slate-700'
              }`}
            >
              Profil
            </span>
            {currentTab === 'profile' && (
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
