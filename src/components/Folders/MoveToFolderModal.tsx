import React from 'react';
import { X, Folder, FolderPlus, Check, Sparkles } from 'lucide-react';
import { WordFolder, WordItem } from '../../types';
import { getFolderTheme } from '../../utils/folderThemes';

interface MoveToFolderModalProps {
  isOpen: boolean;
  word: WordItem | null;
  folders: WordFolder[];
  onClose: () => void;
  onAssign: (folderId: string | undefined) => void;
  onCreateNewFolder: () => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  isOpen,
  word,
  folders,
  onClose,
  onAssign,
  onCreateNewFolder,
}) => {
  if (!isOpen || !word) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Klasöre Ekle / Taşı</h2>
            <p className="text-xs text-slate-600 truncate max-w-[240px]">
              "{word.word}" ({word.meaning})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {/* Unassigned / Default option */}
          <button
            onClick={() => {
              onAssign(undefined);
              onClose();
            }}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              !word.folderId
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
                📁
              </div>
              <div>
                <div className="text-xs font-bold">Genel Defter (Klasörsüz)</div>
                <div className="text-[11px] text-slate-500 font-normal">Hiçbir klasöre bağlı değil</div>
              </div>
            </div>
            {!word.folderId && <Check className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* List of user folders */}
          {folders.map((folder) => {
            const theme = getFolderTheme(folder.color);
            const isCurrent = word.folderId === folder.id;

            return (
              <button
                key={folder.id}
                onClick={() => {
                  onAssign(folder.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg ${theme.lightBg} ${theme.text} flex items-center justify-center font-bold text-xs`}
                  >
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{folder.name}</div>
                    {folder.description && (
                      <div className="text-[11px] text-slate-500 font-normal truncate max-w-[190px]">
                        {folder.description}
                      </div>
                    )}
                  </div>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>

        {/* Create new folder button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewFolder();
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Yeni Klasör Oluştur
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
