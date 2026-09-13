import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Eye,
  ArrowRight,
  Trophy,
  Flame,
  Shuffle,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  Plus,
  Folder,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CEFRLevel, ReviewRating, StudyMode, WordItem } from '../../types';
import { speakEnglish } from '../../utils/speech';
import { getIntervalPreview, isWordDueToday } from '../../utils/srs';
import { isWeakWord, getWeakWords } from '../../utils/weakWords';
import { LEVEL_COLORS } from '../WordList/WordCard';
import { useAuth } from '../../context/AuthContext';
import { useWords } from '../../context/WordContext';
import { getFolderTheme } from '../../utils/folderThemes';

interface StudySessionProps {
  initialWord?: WordItem | null;
  initialFilter?: 'due' | 'weak' | 'all';
  onFinish: () => void;
  onOpenAddModal: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  initialWord,
  initialFilter = 'due',
  onFinish,
  onOpenAddModal,
}) => {
  const { user } = useAuth();
  const { words, reviewWord, wordsDueToday, folders } = useWords();

  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | CEFRLevel>('ALL');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<'ALL' | string>(
    initialWord?.folderId || 'ALL'
  );
  const [focusFilter, setFocusFilter] = useState<'due' | 'weak' | 'all'>(initialFilter);

  const weakWords = useMemo(() => getWeakWords(words), [words]);

  // Queue of words for the current session
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    goodOrEasy: 0,
    againOrHard: 0,
  });

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Cloze state
  const [clozeInput, setClozeInput] = useState('');
  const [clozeSubmitted, setClozeSubmitted] = useState(false);

  // Initialize queue
  const initQueue = useCallback(() => {
    let pool: WordItem[] = [];

    if (initialWord) {
      pool = [initialWord];
    } else {
      pool = words.filter((w) => {
        if (focusFilter === 'due' && !isWordDueToday(w)) return false;
        if (focusFilter === 'weak' && !isWeakWord(w)) return false;
        if (selectedLevelFilter !== 'ALL' && w.level !== selectedLevelFilter) return false;
        if (selectedFolderFilter !== 'ALL' && w.folderId !== selectedFolderFilter) return false;
        return true;
      });

      // If due pool is empty, fall back to all words in that level/folder
      if (pool.length === 0 && focusFilter === 'due') {
        pool = words.filter((w) => {
          if (selectedLevelFilter !== 'ALL' && w.level !== selectedLevelFilter) return false;
          if (selectedFolderFilter !== 'ALL' && w.folderId !== selectedFolderFilter) return false;
          return true;
        });
      }
    }

    // Shuffle pool for pleasant randomized practice
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionCompleted(false);
    setSessionStats({ reviewed: 0, goodOrEasy: 0, againOrHard: 0 });
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setClozeInput('');
    setClozeSubmitted(false);
  }, [words, focusFilter, selectedLevelFilter, selectedFolderFilter, initialWord]);

  useEffect(() => {
    initQueue();
  }, [initQueue]);

  const currentWord = queue[currentIndex] || null;

  // Auto-play audio when card appears if preferred
  useEffect(() => {
    if (currentWord && !isFlipped) {
      speakEnglish(currentWord.word, user?.preferredVoice || 'en-US', user?.speechRate || 0.9);
    }
  }, [currentWord, currentIndex, user]);

  // Setup quiz options when current word changes
  useEffect(() => {
    if (!currentWord || mode !== 'quiz') return;

    const correctAnswer = currentWord.meaning;
    // Get other distractors
    const otherWords = words.filter((w) => w.id !== currentWord.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3).map((w) => w.meaning);

    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
  }, [currentWord, mode, words]);

  // Keyboard navigation for power users (Space to flip, 1-4 for ratings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (sessionCompleted || !currentWord) return;

      if (mode === 'flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (isFlipped) {
          if (e.key === '1') handleRateWord('again');
          if (e.key === '2') handleRateWord('hard');
          if (e.key === '3') handleRateWord('good');
          if (e.key === '4') handleRateWord('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentWord, sessionCompleted, mode]);

  const handleRateWord = (rating: ReviewRating) => {
    if (!currentWord) return;

    reviewWord(currentWord.id, rating);

    const isPositive = rating === 'good' || rating === 'easy';
    setSessionStats((prev) => ({
      reviewed: prev.reviewed + 1,
      goodOrEasy: isPositive ? prev.goodOrEasy + 1 : prev.goodOrEasy,
      againOrHard: !isPositive ? prev.againOrHard + 1 : prev.againOrHard,
    }));

    // If rating is 'again', re-append to end of queue so user learns it in this session!
    if (rating === 'again') {
      setQueue((prev) => [...prev, currentWord]);
    }

    advanceNext();
  };

  const advanceNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setClozeInput('');
    setClozeSubmitted(false);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleQuizAnswer = (option: string) => {
    if (answerSubmitted || !currentWord) return;
    setSelectedAnswer(option);
    setAnswerSubmitted(true);

    const isCorrect = option === currentWord.meaning;
    if (isCorrect) {
      handleRateWord('good');
    } else {
      handleRateWord('again');
    }
  };

  const handleClozeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;
    setClozeSubmitted(true);

    const cleanInput = clozeInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanInput === cleanTarget;

    if (isCorrect) {
      handleRateWord('good');
    } else {
      handleRateWord('again');
    }
  };

  const intervals = currentWord ? getIntervalPreview(currentWord) : null;
  const levelStyle = currentWord ? LEVEL_COLORS[currentWord.level] : LEVEL_COLORS.B1;

  // Mask the word in sentence for cloze or hint
  const getMaskedSentence = (text: string, targetWord: string) => {
    const clean = targetWord.trim().toLowerCase();
    const regex = new RegExp(`\\b(${clean}\\w*)\\b`, 'gi');
    return text.replace(regex, '________');
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Defterinizde Henüz Kelime Yok
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Aralıklı tekrar algoritması ve test yöntemleriyle çalışmaya başlamak için önce öğrenmek istediğiniz kelimeleri ekleyin.
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-100 transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          İlk Kelimemi Ekle
        </button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {focusFilter === 'weak'
            ? 'Harika! Zayıf Noktanız Kalmadı'
            : 'Tüm tekrarlar tamamlandı!'}
        </h3>
        <p className="text-sm text-slate-700 mb-6">
          {focusFilter === 'weak'
            ? 'Hata yaptığınız veya zorlandığınız bir kelime bulunmuyor. Diğer kelimelerle aralıklı tekrar yapabilirsiniz.'
            : 'Şu an seçtiğin filtrede tekrar edilmesi gereken kelime kalmadı. İstersen tüm kelimelerle pratik yapabilir ya da yeni kelimeler ekleyebilirsin.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setFocusFilter('all');
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors"
          >
            Tüm Kelimelerle Pratik Yap
          </button>
          {weakWords.length > 0 && focusFilter !== 'weak' && (
            <button
              onClick={() => {
                setFocusFilter('weak');
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Zayıf Noktaları Çalış ({weakWords.length})
            </button>
          )}
          <button
            onClick={onOpenAddModal}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
          >
            Yeni Kelime Ekle
          </button>
        </div>
      </div>
    );
  }

  // Session Completed State
  if (sessionCompleted) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 max-w-lg mx-auto my-6 text-center shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-amber-100">
          <Trophy className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900 mb-1 font-['Outfit']">
          Tebrikler! Çalışma Tamamlandı
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 mb-6">
          Aralıklı tekrar seansını başarıyla bitirdin. Kelimeler hafızana daha sağlam kazındı!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-700 block">Çalışılan</span>
            <span className="text-xl font-extrabold text-slate-900">{sessionStats.reviewed}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-700 block">Başarılı</span>
            <span className="text-xl font-extrabold text-emerald-700">{sessionStats.goodOrEasy}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
            <span className="text-[11px] font-semibold text-indigo-700 block">Başarı Oranı</span>
            <span className="text-xl font-extrabold text-indigo-700">
              {sessionStats.reviewed > 0
                ? Math.round((sessionStats.goodOrEasy / sessionStats.reviewed) * 100)
                : 100}
              %
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={initQueue}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Tekrar Çalış
          </button>
          <button
            onClick={onFinish}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition-colors"
          >
            Kelimelerime Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Mode & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Practice Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('flashcard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'flashcard'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗂️ Flashcard
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'quiz'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎯 Quiz Testi
            </button>
            <button
              onClick={() => setMode('cloze')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'cloze'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✍️ Boşluk Doldur
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {folders.length > 0 && (
              <select
                value={selectedFolderFilter}
                onChange={(e) => setSelectedFolderFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">📁 Tüm Klasörler</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="ALL">Tüm Seviyeler</option>
              <option value="A1">A1 Seviyesi</option>
              <option value="A2">A2 Seviyesi</option>
              <option value="B1">B1 Seviyesi</option>
              <option value="B2">B2 Seviyesi</option>
              <option value="C1">C1 Seviyesi</option>
              <option value="C2">C2 Seviyesi</option>
            </select>
          </div>
        </div>

        {/* Study Pool Scope Selector */}
        {!initialWord && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-bold text-slate-600 shrink-0 mr-1">Havuz:</span>
            <button
              onClick={() => setFocusFilter('due')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                focusFilter === 'due'
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Tekrarı Gelenler ({wordsDueToday.length})
            </button>

            <button
              onClick={() => setFocusFilter('weak')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                focusFilter === 'weak'
                  ? 'bg-rose-100 text-rose-900 font-bold border border-rose-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${focusFilter === 'weak' ? 'text-rose-600' : 'text-amber-500'}`} />
              Zayıf Noktalarım ({weakWords.length})
            </button>

            <button
              onClick={() => setFocusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                focusFilter === 'all'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tüm Kelimeler ({words.length})
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar & Counter */}
      <div className="flex items-center justify-between text-xs text-slate-700 font-bold px-1">
        <span>
          Kelime {currentIndex + 1} / {queue.length}
        </span>
        <div className="flex-1 mx-4 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-slate-700">{queue.length - currentIndex} kaldı</span>
      </div>

      {/* Main Flashcard Mode */}
      {mode === 'flashcard' && currentWord && (
        <div className="perspective-1000">
          <div
            onClick={() => !isFlipped && setIsFlipped(true)}
            className={`w-full min-h-[360px] sm:min-h-[400px] bg-white rounded-3xl border transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none shadow-sm hover:shadow-md ${
              isFlipped
                ? 'border-indigo-300 bg-gradient-to-b from-indigo-50/20 to-white'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Card Header: Level & Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                >
                  {currentWord.level}
                </span>
                <span className="px-2 py-0.5 text-xs text-slate-700 bg-slate-100 rounded-md font-medium">
                  {currentWord.partOfSpeech}
                </span>
                {(() => {
                  const f = currentWord.folderId
                    ? folders.find((folder) => folder.id === currentWord.folderId)
                    : null;
                  if (!f) return null;
                  const theme = getFolderTheme(f.color);
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border ${theme.lightBg} ${theme.text} ${theme.border}`}
                      title={`Klasör: ${f.name}`}
                    >
                      <Folder className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{f.name}</span>
                    </span>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakEnglish(
                    currentWord.word,
                    user?.preferredVoice || 'en-US',
                    user?.speechRate || 0.9
                  );
                }}
                className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                title="Telaffuzu Dinle"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Front or Back Content */}
            {!isFlipped ? (
              /* FRONT SIDE */
              <div className="my-auto text-center py-6 space-y-4">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
                  {currentWord.word}
                </h2>

                {currentWord.phonetic && (
                  <p className="text-sm font-mono text-slate-700">{currentWord.phonetic}</p>
                )}

                {/* Hint toggle */}
                {showHint ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 max-w-md mx-auto italic">
                    💡 Cümle ipucu: "{getMaskedSentence(currentWord.sentence, currentWord.word)}"
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Cümle İpucunu Göster
                  </button>
                )}

                <div className="pt-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    Anlamı Gör (Kartı Çevir)
                  </span>
                </div>
              </div>
            ) : (
              /* BACK SIDE */
              <div className="my-auto py-2 space-y-5 animate-in fade-in duration-200">
                <div className="text-center border-b border-slate-100 pb-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{currentWord.word}</h3>
                  <p className="text-xl font-extrabold text-indigo-700">{currentWord.meaning}</p>
                </div>

                {/* Example sentence with highlight */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-1.5">
                  <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Örnek Cümle:
                  </p>
                  <p className="text-sm text-slate-800 italic leading-relaxed">
                    "{currentWord.sentence}"
                  </p>
                  {currentWord.sentenceMeaning && (
                    <p className="text-xs text-slate-600 pt-1 border-t border-indigo-100/60 font-medium">
                      🇹🇷 {currentWord.sentenceMeaning}
                    </p>
                  )}
                </div>

                {currentWord.notes && (
                  <p className="text-xs text-slate-700 text-center">
                    💡 <strong>Not:</strong> {currentWord.notes}
                  </p>
                )}
              </div>
            )}

            {/* Bottom: Keyboard helper or SRS Rating Buttons */}
            <div className="pt-4 border-t border-slate-100">
              {!isFlipped ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(true);
                    }}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Kartı Çevir & Anlamını Gör</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[11px] text-slate-700 hidden sm:block">
                    Klavyede <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">Boşluk</kbd> tuşuna basarak da çevirebilirsiniz
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 text-center">
                    Bu kelimeyi ne kadar iyi hatırladın?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Again */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRateWord('again');
                      }}
                      className="p-3 sm:p-2.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-center transition-all font-bold cursor-pointer"
                    >
                      <span className="block text-xs sm:text-sm">🔄 Tekrar Et</span>
                      <span className="block text-[10px] opacity-75 font-normal">
                        {intervals?.again} (1)
                      </span>
                    </button>

                    {/* Hard */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRateWord('hard');
                      }}
                      className="p-3 sm:p-2.5 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 text-center transition-all font-bold cursor-pointer"
                    >
                      <span className="block text-xs sm:text-sm">⚡ Zor</span>
                      <span className="block text-[10px] opacity-75 font-normal">
                        {intervals?.hard} (2)
                      </span>
                    </button>

                    {/* Good */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRateWord('good');
                      }}
                      className="p-3 sm:p-2.5 rounded-2xl border border-sky-200 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 text-center transition-all font-bold cursor-pointer"
                    >
                      <span className="block text-xs sm:text-sm">👍 İyi</span>
                      <span className="block text-[10px] opacity-75 font-normal">
                        {intervals?.good} (3)
                      </span>
                    </button>

                    {/* Easy */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRateWord('easy');
                      }}
                      className="p-3 sm:p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 text-center transition-all font-bold cursor-pointer"
                    >
                      <span className="block text-xs sm:text-sm">🌟 Kolay</span>
                      <span className="block text-[10px] opacity-75 font-normal">
                        {intervals?.easy} (4)
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Test Mode */}
      {mode === 'quiz' && currentWord && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
            >
              {currentWord.level} • {currentWord.partOfSpeech}
            </span>
            <button
              onClick={() =>
                speakEnglish(
                  currentWord.word,
                  user?.preferredVoice || 'en-US',
                  user?.speechRate || 0.9
                )
              }
              className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center py-4">
            <p className="text-xs text-slate-700 font-semibold mb-1">
              Bu kelimenin doğru Türkçe karşılığı hangisidir?
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              {currentWord.word}
            </h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {quizOptions.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentWord.meaning;
              let style = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-800';

              if (answerSubmitted) {
                if (isCorrect) {
                  style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300';
                } else if (isSelected) {
                  style = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                } else {
                  style = 'border-slate-200 opacity-50 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={answerSubmitted}
                  onClick={() => handleQuizAnswer(option)}
                  className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${style}`}
                >
                  <span>{option}</span>
                  {answerSubmitted && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {answerSubmitted && isSelected && !isCorrect && (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {answerSubmitted && (
            <div className="pt-2 animate-in fade-in duration-200 flex items-center justify-between border-t border-slate-100">
              <p className="text-xs text-slate-600 italic">
                "{currentWord.sentence}"
              </p>
              <button
                onClick={advanceNext}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Sonraki <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cloze / Fill in the blank Mode */}
      {mode === 'cloze' && currentWord && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
            >
              {currentWord.level} • Boşluk Doldurma
            </span>
            <span className="text-xs text-slate-700 font-medium">
              Anlam: <strong>{currentWord.meaning}</strong>
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
              "{getMaskedSentence(currentWord.sentence, currentWord.word)}"
            </p>
            {currentWord.sentenceMeaning && (
              <p className="text-xs text-slate-700 mt-2">
                🇹🇷 {currentWord.sentenceMeaning}
              </p>
            )}
          </div>

          <form onSubmit={handleClozeCheck} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Eksik olan İngilizce kelimeyi yazınız:
              </label>
              <input
                type="text"
                autoFocus
                disabled={clozeSubmitted}
                value={clozeInput}
                onChange={(e) => setClozeInput(e.target.value)}
                placeholder="Kelimeyi buraya yazın..."
                className="w-full px-4 py-3 text-base rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-900 outline-hidden"
              />
            </div>

            {!clozeSubmitted ? (
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-colors shadow-md shadow-indigo-100"
              >
                Cevabı Kontrol Et
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div
                  className={`p-4 rounded-2xl border ${
                    clozeInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase()
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <p className="text-sm font-bold mb-1">
                    {clozeInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase()
                      ? '🎉 Doğru bildin!'
                      : '❌ Doğru cevap:'}
                  </p>
                  <p className="text-xl font-extrabold">{currentWord.word}</p>
                </div>

                <button
                  type="button"
                  onClick={advanceNext}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  Sonraki Kelimeye Geç <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
