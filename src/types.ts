export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrasal_verb'
  | 'idiom'
  | 'phrase'
  | 'other';

export type MasteryStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  rating: ReviewRating;
  interval: number; // in days
  previousInterval: number;
}

export interface WordFolder {
  id: string;
  name: string;
  color: string; // e.g. 'indigo', 'emerald', 'amber', 'rose', 'sky', 'purple', 'teal', 'orange'
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WordItem {
  id: string;
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
  createdAt: number;
  updatedAt: number;
  
  // SRS (Spaced Repetition System) parameters
  repetitions: number;
  interval: number; // days until next review
  easeFactor: number; // default 2.5
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string; // YYYY-MM-DD
  masteryStatus: MasteryStatus;
  reviewLogs: ReviewLog[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
  joinedDate: string;
  dailyGoal: number; // e.g. 10 words/day
  preferredVoice: 'en-US' | 'en-GB';
  speechRate: number; // 0.8 to 1.2
  isFirebaseUser?: boolean;
  photoURL?: string;
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  reviewsCount: number;
  newWordsAdded: number;
  correctReviews: number; // 'good' or 'easy'
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export type StudyMode = 'flashcard' | 'quiz' | 'cloze' | 'spelling';
