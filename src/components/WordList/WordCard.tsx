import React, { useState } from 'react';
import {
  Volume2,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Tag,
  CheckCircle,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import { CEFRLevel, WordItem, WordFolder } from '../../types';
import { speakEnglish } from '../../utils/speech';
import { isWordDueToday, getDaysDifference, getTodayString } from '../../utils/srs';
import { isWeakWord, getWordMistakeCount } from '../../utils/weakWords';
import { useAuth } from '../../context/AuthContext';
import { getFolderTheme } from '../../utils/folderThemes';

interface WordCardProps {
  word: WordItem;
  folder?: WordFolder;
  onEdit: (word: WordItem) => void;
  onDelete: (id: string) => void;
  onResetSRS: (id: string) => void;
  onQuickReview?: (word: WordItem) => void;
  onMoveToFolder?: (word: WordItem) => void;
}

export const LEVEL_COLORS: Record<CEFRLevel, { bg: string; text: string; border: string }> = {
  A1: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  A2: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  B1: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  B2: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  C1: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  C2: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const POS_LABELS: Record<string, string> = {
  noun: 'İsim',
  verb: 'Fiil',
  adjective: 'Sıfat',
  adverb: 'Zarf',
  phrasal_verb: 'Phrasal Verb',
  idiom: 'Deyim',
  phrase: 'Kalıp',
  other: 'Kelime',
};

export const WordCard: React.FC<WordCardProps> = ({
  word,
  folder,
  onEdit,
  onDelete,
  onResetSRS,
  onQuickReview,
  onMoveToFolder,
}) => {
  const { user } = useAuth();
  const [showTranslation, setShowTranslation] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isDue = isWordDueToday(word);
  const today = getTodayString();
  const daysUntil = getDaysDifference(today, word.nextReviewDate);
  const levelStyle = LEVEL_COLORS[word.level] || LEVEL_COLORS.B1;
  const folderTheme = folder ? getFolderTheme(folder.color) : null;

  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    await speakEnglish(word.word, user?.preferredVoice || 'en-US', user?.speechRate || 0.9);
    setIsPlayingAudio(false);
  };

  // Helper to highlight the target word inside the example sentence
  const renderSentenceWithHighlight = () => {
    const text = word.sentence;
    const cleanWord = word.word.trim().toLowerCase();
    
    // Simple regex to match root or inflections roughly
    const regex = new RegExp(`\\b(${cleanWord}\\w*)\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase().startsWith(cleanWord)) {
        return (
          <span
            key={index}
            className="font-bold text-indigo-700 bg-indigo-50/80 px-1 py-0.5 rounded underline decoration-indigo-300"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all duration-200 hover:shadow-md">
      <div className="p-5">
        {/* Top bar: badges & actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* CEFR Level */}
            <span
              className={`px-2 py-0.5 text-xs font-extrabold rounded-md border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
            >
              {word.level}
            </span>

            {/* Part of Speech */}
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {POS_LABELS[word.partOfSpeech] || word.partOfSpeech}
            </span>

            {/* Status */}
            {word.masteryStatus === 'mastered' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Kalıcı ({word.interval}g)
              </span>
            ) : word.masteryStatus === 'new' ? (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                Yeni
              </span>
            ) : null}

            {/* Folder badge */}
            {folder && folderTheme && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border ${folderTheme.lightBg} ${folderTheme.text} ${folderTheme.border}`}
                title={`Klasör: ${folder.name}`}
              >
                <Folder className="w-3 h-3" />
                <span className="truncate max-w-[110px]">{folder.name}</span>
              </span>
            )}

            {/* Weak spot badge */}
            {isWeakWord(word) && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200"
                title={`${getWordMistakeCount(word)} kez zor veya tekrar olarak işaretlendi`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Zayıf Nokta</span>
                {getWordMistakeCount(word) > 0 && (
                  <span className="text-[10px] opacity-75">({getWordMistakeCount(word)} hata)</span>
                )}
              </span>
            )}
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Daha fazla seçenek"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20"
                onClick={() => setShowMenu(false)}
              >
                <button
                  onClick={() => onEdit(word)}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  Düzenle
                </button>
                {onMoveToFolder && (
                  <button
                    onClick={() => onMoveToFolder(word)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                  >
                    <Folder className="w-3.5 h-3.5 text-indigo-500" />
                    {word.folderId ? 'Klasörü Değiştir' : 'Klasöre Ekle'}
                  </button>
                )}
                <button
                  onClick={() => onResetSRS(word.id)}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  İlerlemeyi Sıfırla
                </button>
                <button
                  onClick={() => onDelete(word.id)}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Kelimeyi Sil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Word and Audio */}
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors">
            {word.word}
          </h3>

          {word.phonetic && (
            <span className="text-xs font-mono text-slate-700">{word.phonetic}</span>
          )}

          <button
            onClick={handlePlayAudio}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              isPlayingAudio
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-600 hover:bg-indigo-100 bg-indigo-50'
            }`}
            title="Telaffuzu Dinle"
            aria-label="Telaffuz dinle"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Meaning in Turkish */}
        <p className="text-sm font-semibold text-slate-700 mb-3 leading-relaxed">
          {word.meaning}
        </p>

        {/* Example Sentence Container */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 space-y-1.5">
          <p className="text-xs text-slate-800 leading-relaxed italic">
            "{renderSentenceWithHighlight()}"
          </p>

          {word.sentenceMeaning && (
            <div>
              {showTranslation ? (
                <div className="pt-1 border-t border-slate-200/60 flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-700 font-medium">
                    {word.sentenceMeaning}
                  </p>
                  <button
                    onClick={() => setShowTranslation(false)}
                    className="text-[11px] text-slate-600 hover:text-slate-800 flex items-center gap-1 shrink-0"
                  >
                    <EyeOff className="w-3 h-3" /> Gizle
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTranslation(true)}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" /> Türkçe Çevirisini Gör
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notes & Tags Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1">
          {word.notes ? (
            <span className="truncate max-w-[220px] text-slate-600" title={word.notes}>
              💡 {word.notes}
            </span>
          ) : (
            <span />
          )}

          {word.tags && word.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600 font-medium">
                {word.tags.slice(0, 2).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Repeat Button on card if due */}
      {isDue && onQuickReview && (
        <div className="px-5 pb-3">
          <button
            onClick={() => onQuickReview(word)}
            className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-amber-300"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Hemen Tekrar Et
          </button>
        </div>
      )}
    </div>
  );
};
