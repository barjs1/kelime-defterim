import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Tag,
  ListFilter,
  Folder,
  FolderPlus,
  Edit3,
  Trash2,
  AlertTriangle,
  Repeat,
  Check,
  ChevronRight,
} from 'lucide-react';
import { CEFRLevel, WordItem, WordFolder } from '../../types';
import { WordCard, LEVEL_COLORS } from './WordCard';
import { useWords } from '../../context/WordContext';
import { isWordDueToday } from '../../utils/srs';
import { isWeakWord, getWordMistakeCount } from '../../utils/weakWords';
import { getFolderTheme } from '../../utils/folderThemes';
import { FolderModal } from '../Folders/FolderModal';
import { MoveToFolderModal } from '../Folders/MoveToFolderModal';

interface WordListViewProps {
  onOpenAddModal: (folderId?: string) => void;
  onEditWord: (word: WordItem) => void;
  onStartStudy: (initialWord?: WordItem, filter?: 'due' | 'weak' | 'all') => void;
}

const ALL_LEVELS: { id: 'ALL' | CEFRLevel; label: string }[] = [
  { id: 'ALL', label: 'Tümü' },
  { id: 'A1', label: 'A1' },
  { id: 'A2', label: 'A2' },
  { id: 'B1', label: 'B1' },
  { id: 'B2', label: 'B2' },
  { id: 'C1', label: 'C1' },
  { id: 'C2', label: 'C2' },
];

type StatusFilter = 'all' | 'due' | 'weak' | 'learning' | 'mastered';

export const WordListView: React.FC<WordListViewProps> = ({
  onOpenAddModal,
  onEditWord,
  onStartStudy,
}) => {
  const {
    words,
    folders,
    folderCounts,
    deleteWord,
    resetWordSRS,
    wordsDueToday,
    levelCounts,
    addFolder,
    updateFolder,
    deleteFolder,
    assignWordToFolder,
  } = useWords();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | CEFRLevel>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'ALL' | 'UNASSIGNED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<
    'created_desc' | 'alpha_asc' | 'due_first' | 'weak_first' | 'level_asc'
  >('due_first');

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<WordFolder | null>(null);
  const [movingWord, setMovingWord] = useState<WordItem | null>(null);

  // Folder delete confirmation state
  const [folderToDelete, setFolderToDelete] = useState<WordFolder | null>(null);
  const [deleteInsideWords, setDeleteInsideWords] = useState(false);

  const weakWordsCount = useMemo(() => words.filter(isWeakWord).length, [words]);
  const unassignedCount = useMemo(
    () => words.filter((w) => !w.folderId).length,
    [words]
  );

  const currentFolder = useMemo(() => {
    if (selectedFolderId === 'ALL' || selectedFolderId === 'UNASSIGNED') return null;
    return folders.find((f) => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  // Filter logic
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchWord = w.word.toLowerCase().includes(query);
        const matchMeaning = w.meaning.toLowerCase().includes(query);
        const matchSentence = w.sentence.toLowerCase().includes(query);
        const matchTags = w.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchWord && !matchMeaning && !matchSentence && !matchTags) {
          return false;
        }
      }

      // Folder filter
      if (selectedFolderId === 'UNASSIGNED') {
        if (w.folderId) return false;
      } else if (selectedFolderId !== 'ALL') {
        if (w.folderId !== selectedFolderId) return false;
      }

      // Level filter
      if (selectedLevel !== 'ALL' && w.level !== selectedLevel) {
        return false;
      }

      // Status filter
      if (statusFilter === 'due' && !isWordDueToday(w)) {
        return false;
      }
      if (statusFilter === 'weak' && !isWeakWord(w)) {
        return false;
      }
      if (
        statusFilter === 'learning' &&
        (w.masteryStatus === 'mastered' || w.masteryStatus === 'new')
      ) {
        return false;
      }
      if (statusFilter === 'mastered' && w.masteryStatus !== 'mastered') {
        return false;
      }

      return true;
    });
  }, [words, searchQuery, selectedLevel, selectedFolderId, statusFilter]);

  const sortedWords = useMemo(() => {
    const list = [...filteredWords];
    const levelOrder: Record<CEFRLevel, number> = {
      A1: 1,
      A2: 2,
      B1: 3,
      B2: 4,
      C1: 5,
      C2: 6,
    };

    return list.sort((a, b) => {
      if (sortBy === 'weak_first') {
        const aWeak = isWeakWord(a) ? 1 : 0;
        const bWeak = isWeakWord(b) ? 1 : 0;
        if (aWeak !== bWeak) return bWeak - aWeak;
        return getWordMistakeCount(b) - getWordMistakeCount(a);
      }
      if (sortBy === 'due_first') {
        const aDue = isWordDueToday(a) ? 0 : 1;
        const bDue = isWordDueToday(b) ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return a.nextReviewDate.localeCompare(b.nextReviewDate);
      }
      if (sortBy === 'alpha_asc') {
        return a.word.localeCompare(b.word);
      }
      if (sortBy === 'level_asc') {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      // default: created_desc
      return b.createdAt - a.createdAt;
    });
  }, [filteredWords, sortBy]);

  // Handle Save Folder (New or Update)
  const handleSaveFolder = async (name: string, color: string, description?: string) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, { name, color, description });
      setEditingFolder(null);
    } else {
      const created = await addFolder(name, color, description);
      setSelectedFolderId(created.id);
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    await deleteFolder(folderToDelete.id, deleteInsideWords);
    if (selectedFolderId === folderToDelete.id) {
      setSelectedFolderId('ALL');
    }
    setFolderToDelete(null);
    setDeleteInsideWords(false);
  };

  const currentFolderTheme = currentFolder ? getFolderTheme(currentFolder.color) : null;

  return (
    <div className="space-y-4 pb-12">
      {/* Due Words Alert (Clean & Compact) */}
      {wordsDueToday.length > 0 && selectedFolderId === 'ALL' && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
              Bugün tekrar edilmesi gereken <strong className="text-amber-900">{wordsDueToday.length} kelime</strong> var.
            </p>
          </div>
          <button
            onClick={() => onStartStudy()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tekrara Başla</span>
          </button>
        </div>
      )}

      {/* Folders Bar (Clean & Streamlined) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Klasörler
            </span>
          </div>
          <button
            onClick={() => {
              setEditingFolder(null);
              setIsFolderModalOpen(true);
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Yeni Klasör</span>
          </button>
        </div>

        {/* Folder Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {/* All Words */}
          <button
            onClick={() => setSelectedFolderId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedFolderId === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Tümü</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedFolderId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {words.length}
            </span>
          </button>

          {/* Unassigned / General */}
          <button
            onClick={() => setSelectedFolderId('UNASSIGNED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              selectedFolderId === 'UNASSIGNED'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Genel</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedFolderId === 'UNASSIGNED'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {unassignedCount}
            </span>
          </button>

          {/* User Folders */}
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const theme = getFolderTheme(folder.color);
            const count = folderCounts[folder.id] || 0;

            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? `${theme.bg} text-white shadow-xs border-transparent`
                    : `${theme.lightBg} ${theme.text} ${theme.border} hover:brightness-95`
                }`}
              >
                <span className="truncate max-w-[120px]">{folder.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-white/80 font-extrabold shadow-2xs'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Folder Header Banner (Compact) */}
      {currentFolder && currentFolderTheme && (
        <div
          className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all ${currentFolderTheme.lightBg} ${currentFolderTheme.border}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl ${currentFolderTheme.bg} text-white flex items-center justify-center shadow-xs shrink-0`}
            >
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {currentFolder.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {folderCounts[currentFolder.id] || 0} Kelime
                </span>
              </div>
              {currentFolder.description && (
                <p className="text-xs text-slate-600 mt-0.5">{currentFolder.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onOpenAddModal(currentFolder.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Kelime Ekle
            </button>

            {(folderCounts[currentFolder.id] || 0) > 0 && (
              <button
                onClick={() => {
                  const firstWord = words.find((w) => w.folderId === currentFolder.id);
                  if (firstWord) onStartStudy(firstWord);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                Klasörü Çalış
              </button>
            )}

            <button
              onClick={() => {
                setEditingFolder(currentFolder);
                setIsFolderModalOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-white/80 rounded-lg transition-colors"
              title="Klasörü Düzenle"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFolderToDelete(currentFolder)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Klasörü Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Levels & Status Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Row 1: Search & Sort & Add */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Kelime, Türkçe anlam veya cümle ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all text-slate-900 bg-slate-50/60 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 sm:w-44 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-indigo-500 outline-hidden cursor-pointer"
            >
              <option value="due_first">⏳ Tekrar Öncelikli</option>
              <option value="weak_first">⚠️ Çok Hata Yapılanlar</option>
              <option value="created_desc">🆕 En Yeni Eklenenler</option>
              <option value="alpha_asc">🔤 Alfabetik (A-Z)</option>
              <option value="level_asc">🎯 Seviye (A1-C2)</option>
            </select>

            <button
              onClick={() => onOpenAddModal(currentFolder ? currentFolder.id : undefined)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Kelime Ekle</span>
            </button>
          </div>
        </div>

        {/* Row 2: Level Pills & Status Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* CEFR Level Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {ALL_LEVELS.map((item) => {
              const isSelected = selectedLevel === item.id;
              const count = item.id === 'ALL' ? words.length : levelCounts[item.id] || 0;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedLevel(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-1 py-0.1 rounded-full text-[9px] ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('due')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                statusFilter === 'due'
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Tekrar ({wordsDueToday.length})
            </button>
            <button
              onClick={() => setStatusFilter('weak')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                statusFilter === 'weak'
                  ? 'bg-rose-100 text-rose-900 font-bold border border-rose-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zayıf ({weakWordsCount})
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                statusFilter === 'mastered'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kalıcı
            </button>
          </div>
        </div>
      </div>

      {/* Weak Words Focus Banner */}
      {statusFilter === 'weak' && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Zayıf Noktalarım & Hata Yapılan Kelimeler
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/70 text-rose-800">
                  {filteredWords.length} Kelime
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Daha önce çalışırken zorlandığınız veya yanlış yaptığınız kelimeler. Bu kelimeleri pekiştirmek için odak seansı başlatabilirsiniz.
              </p>
            </div>
          </div>
          {filteredWords.length > 0 && (
            <button
              type="button"
              onClick={() => onStartStudy(undefined, 'weak')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Bu Kelimeleri Çalış</span>
            </button>
          )}
        </div>
      )}

      {/* Words Grid */}
      {sortedWords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWords.map((word) => {
            const folder = word.folderId ? folders.find((f) => f.id === word.folderId) : undefined;
            return (
              <WordCard
                key={word.id}
                word={word}
                folder={folder}
                onEdit={onEditWord}
                onDelete={deleteWord}
                onResetSRS={resetWordSRS}
                onQuickReview={() => onStartStudy(word)}
                onMoveToFolder={(w) => setMovingWord(w)}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {currentFolder
              ? `"${currentFolder.name}" klasöründe henüz kelime yok`
              : searchQuery || selectedLevel !== 'ALL' || statusFilter !== 'all' || selectedFolderId !== 'ALL'
              ? 'Aradığınız kriterlere uygun kelime bulunamadı'
              : 'Henüz kayıtlı kelimeniz bulunmuyor'}
          </h3>
          <p className="text-xs text-slate-600 mb-6">
            {currentFolder
              ? 'Bu klasöre ilk kelimenizi ekleyerek veya mevcut kelimeleri buraya taşıyarak düzenlemeye başlayın.'
              : searchQuery || selectedLevel !== 'ALL' || statusFilter !== 'all' || selectedFolderId !== 'ALL'
              ? 'Filtreleri temizleyebilir veya farklı bir arama terimi deneyebilirsiniz.'
              : 'Öğrenmek istediğiniz ilk İngilizce kelimeyi örnek cümlesiyle ekleyerek başlayın.'}
          </p>

          {currentFolder ? (
            <button
              onClick={() => onOpenAddModal(currentFolder.id)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Bu Klasöre Kelime Ekle
            </button>
          ) : searchQuery || selectedLevel !== 'ALL' || statusFilter !== 'all' || selectedFolderId !== 'ALL' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('ALL');
                setSelectedFolderId('ALL');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          ) : (
            <button
              onClick={() => onOpenAddModal()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              İlk Kelimemi Ekle
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
        editingFolder={editingFolder}
      />

      <MoveToFolderModal
        isOpen={!!movingWord}
        word={movingWord}
        folders={folders}
        onClose={() => setMovingWord(null)}
        onAssign={(folderId) => {
          if (movingWord) {
            assignWordToFolder(movingWord.id, folderId);
          }
        }}
        onCreateNewFolder={() => {
          setEditingFolder(null);
          setIsFolderModalOpen(true);
        }}
      />

      {/* Delete Folder Confirmation Dialog */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              "{folderToDelete.name}" Klasörünü Sil
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Bu klasörü silmek istediğinizden emin misiniz?
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteInsideWords}
                  onChange={(e) => setDeleteInsideWords(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>
                  Bu klasördeki <strong>{folderCounts[folderToDelete.id] || 0} kelimeyi</strong> de tamamen sil.
                  <span className="block text-[11px] text-slate-500">
                    İşaretlemezseniz kelimeler genel defterinizde kalır.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setFolderToDelete(null);
                  setDeleteInsideWords(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFolder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Klasörü Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
