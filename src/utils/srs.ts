import { MasteryStatus, ReviewLog, ReviewRating, WordItem } from '../types';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isWordDueToday(word: WordItem, today = getTodayString()): boolean {
  if (!word.nextReviewDate) return true;
  return word.nextReviewDate <= today;
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 */
export function calculateSRSUpdate(
  word: WordItem,
  rating: ReviewRating,
  today = getTodayString()
): {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewedDate: string;
  masteryStatus: MasteryStatus;
  newLog: ReviewLog;
} {
  let repetitions = word.repetitions || 0;
  let interval = word.interval || 0;
  let easeFactor = word.easeFactor || 2.5;
  const previousInterval = interval;

  // Quality score:
  // again = 1, hard = 3, good = 4, easy = 5
  let quality = 4;
  switch (rating) {
    case 'again':
      quality = 1;
      break;
    case 'hard':
      quality = 3;
      break;
    case 'good':
      quality = 4;
      break;
    case 'easy':
      quality = 5;
      break;
  }

  // Update easeFactor based on SM-2 formula:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  if (easeFactor > 3.0) easeFactor = 3.0;

  if (rating === 'again') {
    repetitions = 0;
    interval = 1; // repeat tomorrow or later today
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = rating === 'easy' ? 3 : 1;
    } else if (repetitions === 2) {
      interval = rating === 'easy' ? 7 : rating === 'hard' ? 2 : 4;
    } else {
      if (rating === 'hard') {
        interval = Math.max(interval + 1, Math.round(interval * 1.2));
      } else if (rating === 'good') {
        interval = Math.round(interval * easeFactor);
      } else if (rating === 'easy') {
        interval = Math.round(interval * easeFactor * 1.3);
      }
    }
  }

  // Cap interval within realistic reasonable range
  if (interval > 365) interval = 365;

  const nextReviewDate = addDaysToDate(today, interval);

  // Determine mastery status
  let masteryStatus: MasteryStatus = 'learning';
  if (repetitions === 0) {
    masteryStatus = 'new';
  } else if (interval >= 21) {
    masteryStatus = 'mastered';
  } else if (interval >= 4) {
    masteryStatus = 'reviewing';
  } else {
    masteryStatus = 'learning';
  }

  const newLog: ReviewLog = {
    id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    date: today,
    timestamp: Date.now(),
    rating,
    interval,
    previousInterval,
  };

  return {
    repetitions,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate,
    lastReviewedDate: today,
    masteryStatus,
    newLog,
  };
}

export function getIntervalPreview(word: WordItem): Record<ReviewRating, string> {
  const ef = word.easeFactor || 2.5;
  const reps = word.repetitions || 0;
  const currInterval = word.interval || 0;

  // again: 1 day
  const againDays = 1;

  // hard:
  let hardDays = 1;
  if (reps === 0) hardDays = 1;
  else if (reps === 1) hardDays = 2;
  else hardDays = Math.max(currInterval + 1, Math.round(currInterval * 1.2));

  // good:
  let goodDays = 1;
  if (reps === 0) goodDays = 1;
  else if (reps === 1) goodDays = 4;
  else goodDays = Math.round(currInterval * ef);

  // easy:
  let easyDays = 3;
  if (reps === 0) easyDays = 3;
  else if (reps === 1) easyDays = 7;
  else easyDays = Math.round(currInterval * ef * 1.3);

  return {
    again: `${againDays} gün`,
    hard: `${hardDays} gün`,
    good: `${goodDays} gün`,
    easy: `${easyDays} gün`,
  };
}
