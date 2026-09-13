import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Volume2,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Check,
  Folder,
  FolderPlus,
} from 'lucide-react';
import { CEFRLevel, PartOfSpeech, WordItem } from '../types';
import { speakEnglish } from '../utils/speech';
import { useAuth } from '../context/AuthContext';
import { useWords } from '../context/WordContext';
import { getFolderTheme, FOLDER_THEMES } from '../utils/folderThemes';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    word: string;
    meaning: string;
    sentence: string;
    sentenceMeaning?: string;
    level: CEFRLevel;
    partOfSpeech: PartOfSpeech;
    phonetic?: string;
    notes?: string;
    tags?: string[];
    folderId?: string;
  }) => void;
  editingWord?: WordItem | null;
  initialFolderId?: string;
}

const CEFR_LEVELS: { level: CEFRLevel; label: string; desc: string; color: string }[] = [
  { level: 'A1', label: 'A1', desc: 'Başlangıç', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { level: 'A2', label: 'A2', desc: 'Temel', color: 'border-teal-300 bg-teal-50 text-teal-800' },
  { level: 'B1', label: 'B1', desc: 'Orta', color: 'border-sky-300 bg-sky-50 text-sky-800' },
  { level: 'B2', label: 'B2', desc: 'İyi / Orta-Üst', color: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
  { level: 'C1', label: 'C1', desc: 'İleri Seviye', color: 'border-purple-300 bg-purple-50 text-purple-800' },
  { level: 'C2', label: 'C2', desc: 'Ana Dil / Yetkin', color: 'border-rose-300 bg-rose-50 text-rose-800' },
];

const PARTS_OF_SPEECH: { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'İsim (Noun)' },
  { value: 'verb', label: 'Fiil (Verb)' },
  { value: 'adjective', label: 'Sıfat (Adjective)' },
  { value: 'adverb', label: 'Zarf (Adverb)' },
  { value: 'phrasal_verb', label: 'Deyimsel Fiil (Phrasal Verb)' },
  { value: 'idiom', label: 'Deyim / Kalıp (Idiom)' },
  { value: 'other', label: 'Diğer' },
];

const SAMPLE_INSPIRATIONS = [
  {
    word: 'perseverance',
    meaning: 'azim, sebat, kararlılık',
    sentence: 'Through sheer perseverance, she mastered the language in under two years.',
    sentenceMeaning: 'Büyük bir azim sayesinde dili iki yıldan kısa sürede ana dili gibi öğrendi.',
    level: 'B2' as CEFRLevel,
    partOfSpeech: 'noun' as PartOfSpeech,
    phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
    notes: 'Zorluklara rağmen vazgeçmeme tutumu.',
    tags: ['Kişisel Gelişim'],
  },
  {
    word: 'comprehend',
    meaning: 'kavramak, tam olarak anlamak',
    sentence: 'It was hard to comprehend the scale of the ancient library.',
    sentenceMeaning: 'Antik kütüphanenin büyüklüğünü kavramak zordu.',
    level: 'B1' as CEFRLevel,
    partOfSpeech: 'verb' as PartOfSpeech,
    phonetic: '/ˌkɒm.prɪˈhend/',
    notes: 'Understand kelimesine göre daha derin anlama vurgular.',
    tags: ['Eğitim'],
  },
  {
    word: 'pragmatic',
    meaning: 'faydacı, uygulamacı, pratik çözüme odaklı',
    sentence: 'We need a pragmatic solution rather than theoretical debate.',
    sentenceMeaning: 'Teorik tartışma yerine pratik ve uygulanabilir bir çözüme ihtiyacımız var.',
    level: 'C1' as CEFRLevel,
    partOfSpeech: 'adjective' as PartOfSpeech,
    phonetic: '/præɡˈmæt.ɪk/',
    notes: 'Gerçekçi ve pratik davranan kişiler için.',
    tags: ['İş Hayatı'],
  },
];

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWord,
  initialFolderId,
}) => {
  const { user } = useAuth();
  const { folders, addFolder } = useWords();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [sentence, setSentence] = useState('');
  const [sentenceMeaning, setSentenceMeaning] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('B1');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('noun');
  const [phonetic, setPhonetic] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('indigo');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingWord) {
      setWord(editingWord.word);
      setMeaning(editingWord.meaning);
      setSentence(editingWord.sentence);
      setSentenceMeaning(editingWord.sentenceMeaning || '');
      setLevel(editingWord.level);
      setPartOfSpeech(editingWord.partOfSpeech);
      setPhonetic(editingWord.phonetic || '');
      setNotes(editingWord.notes || '');
      setTags(editingWord.tags || []);
      setFolderId(editingWord.folderId || '');
    } else {
      setWord('');
      setMeaning('');
      setSentence('');
      setSentenceMeaning('');
      setLevel('B1');
      setPartOfSpeech('noun');
      setPhonetic('');
      setNotes('');
      setTags([]);
      setFolderId(initialFolderId || '');
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
    setError('');
  }, [editingWord, isOpen, initialFolderId]);

  if (!isOpen) return null;

  const handleQuickCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const created = await addFolder(newFolderName.trim(), newFolderColor);
      setFolderId(created.id);
      setIsCreatingFolder(false);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setError('Lütfen İngilizce kelimeyi giriniz.');
      return;
    }
    if (!meaning.trim()) {
      setError('Lütfen kelimenin Türkçe karşılığını giriniz.');
      return;
    }
    if (!sentence.trim()) {
      setError('Kalıcı öğrenme için lütfen en az bir örnek cümle yazınız.');
      return;
    }

    onSave({
      word,
      meaning,
      sentence,
      sentenceMeaning,
      level,
      partOfSpeech,
      phonetic,
      notes,
      tags,
      folderId: folderId || undefined,
    });
    onClose();
  };

  const handlePlayAudio = () => {
    if (word.trim()) {
      speakEnglish(word.trim(), user?.preferredVoice || 'en-US');
    }
  };

  const handleApplyPreset = (preset: (typeof SAMPLE_INSPIRATIONS)[0]) => {
    setWord(preset.word);
    setMeaning(preset.meaning);
    setSentence(preset.sentence);
    setSentenceMeaning(preset.sentenceMeaning);
    setLevel(preset.level);
    setPartOfSpeech(preset.partOfSpeech);
    setPhonetic(preset.phonetic);
    setNotes(preset.notes);
    setTags(preset.tags);
    setError('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-50/90">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              {editingWord ? <BookOpen className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {editingWord ? 'Kelimeyi Düzenle' : 'Yeni Kelime Kaydet'}
              </h2>
              <p className="text-xs text-slate-700 hidden sm:block">
                Örnek cümle ve seviye belirleyerek aralıklı tekrar listene ekle.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 pb-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {error}
              </div>
            )}

          {/* Preset Inspirations (Only for new word) */}
          {!editingWord && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Hızlı Örnek Şablonlar:
                </span>
                <span className="text-[11px] text-indigo-700">Tıklayıp inceleyebilirsiniz</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_INSPIRATIONS.map((item) => (
                  <button
                    key={item.word}
                    type="button"
                    onClick={() => handleApplyPreset(item)}
                    className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-md border border-indigo-200 font-medium transition-colors shadow-2xs"
                  >
                    + {item.word} ({item.level})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row 1: Word & Meaning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                İngilizce Kelime <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="örn: Eloquent, Resilient..."
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-semibold text-slate-900 outline-hidden transition-all"
                />
                {word.trim() && (
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    title="Telaffuzu Dinle"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Türkçe Anlamı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="örn: Güzel konuşan, etkili konuşmacı"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* CEFR Level Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Seviye Grubu (CEFR) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = level === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setLevel(lvl.level)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? `${lvl.color} border-current ring-2 ring-offset-1 font-bold shadow-xs scale-102`
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{lvl.level}</span>
                    <span className="text-[10px] opacity-80 leading-tight mt-0.5">{lvl.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part of Speech & Phonetic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kelime Türü
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 bg-white outline-hidden"
              >
                {PARTS_OF_SPEECH.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Fonetik / Okunuş İpucu (İsteğe bağlı)
              </label>
              <input
                type="text"
                placeholder="örn: /ˈel.ə.kwənt/"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Example Sentence & Sentence Meaning */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Örnek İngilizce Cümle <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-700">
                  Kelimeyi bağlamında görmek hafızayı 4x güçlendirir
                </span>
              </div>
              <textarea
                required
                rows={2}
                placeholder="The speaker delivered an eloquent speech that captivated the entire audience."
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 outline-hidden transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Örnek Cümlenin Türkçe Çevirisi (İsteğe bağlı ama tavsiye edilir)
              </label>
              <input
                type="text"
                placeholder="Konuşmacı, tüm dinleyicileri büyüleyen etkileyici bir konuşma yaptı."
                value={sentenceMeaning}
                onChange={(e) => setSentenceMeaning(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Notes / Mnemonic & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Aklında Tutma İpucu / Özel Not
              </label>
              <textarea
                rows={2}
                placeholder="örn: 'Eloquence' kelimesiyle bağ kur, hitabetle ilgili."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 outline-hidden resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori / Etiketler
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="örn: İş, YDS, Günlük..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[28px]">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Folder Selection & Quick Create */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-600" />
                Kelime Klasörü (İsteğe bağlı)
              </label>
              {!isCreatingFolder && (
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Yeni Klasör Oluştur
                </button>
              )}
            </div>

            {isCreatingFolder ? (
              <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5 shadow-2xs">
                <div className="text-[11px] font-bold text-indigo-900">Yeni Klasör Oluştur</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Klasör adı (örn: Mülakat, Tatil...)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 outline-hidden"
                  />
                  <select
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
                  >
                    {Object.entries(FOLDER_THEMES).map(([k, t]) => (
                      <option key={k} value={k}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer"
                  >
                    Oluştur & Seç
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 outline-hidden font-medium"
                >
                  <option value="">📁 Genel Defter (Klasörsüz)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name} {f.description ? `— ${f.description}` : ''}
                    </option>
                  ))}
                </select>
                {folderId && (
                  <button
                    type="button"
                    onClick={() => setFolderId('')}
                    title="Klasör seçimini kaldır"
                    className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                  >
                    Temizle
                  </button>
                )}
              </div>
            )}
          </div>

          </div>

          {/* Sticky Footer Actions */}
          <div
            className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              {editingWord ? 'Değişiklikleri Kaydet' : 'Kelimeyi Listeme Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
