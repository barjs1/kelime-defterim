export interface FolderTheme {
  id: string;
  name: string;
  bg: string;
  lightBg: string;
  text: string;
  border: string;
  dot: string;
}

export const FOLDER_THEMES: Record<string, FolderTheme> = {
  indigo: {
    id: 'indigo',
    name: 'İndigo',
    bg: 'bg-indigo-600',
    lightBg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  emerald: {
    id: 'emerald',
    name: 'Zümrüt Yeşili',
    bg: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  amber: {
    id: 'amber',
    name: 'Kehribar',
    bg: 'bg-amber-600',
    lightBg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  rose: {
    id: 'rose',
    name: 'Gül Kurusu',
    bg: 'bg-rose-600',
    lightBg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  sky: {
    id: 'sky',
    name: 'Gök Mavisi',
    bg: 'bg-sky-600',
    lightBg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  purple: {
    id: 'purple',
    name: 'Mor',
    bg: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  teal: {
    id: 'teal',
    name: 'Camgöbeği',
    bg: 'bg-teal-600',
    lightBg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  orange: {
    id: 'orange',
    name: 'Turuncu',
    bg: 'bg-orange-600',
    lightBg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
};

export const getFolderTheme = (color?: string): FolderTheme => {
  if (color && FOLDER_THEMES[color]) {
    return FOLDER_THEMES[color];
  }
  return FOLDER_THEMES.indigo;
};
