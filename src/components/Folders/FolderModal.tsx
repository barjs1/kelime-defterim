import React, { useState, useEffect } from 'react';
import { X, Folder, FolderPlus, Check } from 'lucide-react';
import { WordFolder } from '../../types';
import { FOLDER_THEMES } from '../../utils/folderThemes';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, description?: string) => void;
  editingFolder?: WordFolder | null;
}

const PRESET_SUGGESTIONS = [
  { name: 'İş İngilizcesi', color: 'indigo', desc: 'Toplantılar, mülakatlar ve e-postalar' },
  { name: 'Seyahat & Tatil', color: 'purple', desc: 'Havalimanı, otel ve yön tarifleri' },
  { name: 'Akademik & Sınavlar', color: 'sky', desc: 'YDS, TOEFL, IELTS ve makaleler' },
  { name: 'Günlük Konuşma', color: 'emerald', desc: 'Sohbetler ve sık kullanılan deyimler' },
  { name: 'Teknoloji & Yazılım', color: 'teal', desc: 'Yazılım terimleri ve teknik kelimeler' },
  { name: 'Deyimler & Phrasal Verbs', color: 'rose', desc: 'Kalıplaşmış ifadeler ve fiiller' },
];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFolder,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('indigo');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setColor(editingFolder.color || 'indigo');
      setDescription(editingFolder.description || '');
    } else {
      setName('');
      setColor('indigo');
      setDescription('');
    }
    setError('');
  }, [editingFolder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen bir klasör adı yazın.');
      return;
    }

    onSave(name.trim(), color, description.trim());
    onClose();
  };

  const handleSelectPreset = (preset: (typeof PRESET_SUGGESTIONS)[0]) => {
    setName(preset.name);
    setColor(preset.color);
    setDescription(preset.desc);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              {editingFolder ? <Folder className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingFolder ? 'Klasörü Düzenle' : 'Yeni Kelime Klasörü'}
              </h2>
              <p className="text-xs text-slate-600">
                Kelimelerinizi ilgi alanı veya hedeflerinize göre gruplayın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Quick presets (only when creating new) */}
          {!editingFolder && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Hızlı Klasör Önerileri:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUGGESTIONS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Folder Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Klasör Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Mülakat Hazırlığı, B2 Deyimler..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Klasör Rengi:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Object.entries(FOLDER_THEMES).map(([colorKey, theme]) => {
                const isSelected = color === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setColor(colorKey)}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all ${theme.bg} text-white cursor-pointer ${
                      isSelected
                        ? 'ring-3 ring-offset-2 ring-indigo-500 scale-105 shadow-sm'
                        : 'opacity-80 hover:opacity-100 hover:scale-102'
                    }`}
                    title={theme.name}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Açıklama (İsteğe bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: Yurt dışı seyahatinde kullanılacak temel cümleler"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingFolder ? 'Değişiklikleri Kaydet' : 'Klasörü Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
