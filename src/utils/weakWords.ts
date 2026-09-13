import { WordItem } from '../types';

/**
 * Calculates whether a word is currently considered a "weak spot" (zorlanılan kelime).
 * Criteria:
 * 1. Has recorded lapses or repeated again/hard ratings in reviewLogs.
 * 2. Ease factor dropped below 2.30 (indicating frequent difficulty).
 * 3. Repetitions reset to 0 despite having past reviews.
 * 4. Mastery status is still 'struggling' or has error logs.
 */
export const isWeakWord = (word: WordItem): boolean => {
  const mistakes = getWordMistakeCount(word);
  if (mistakes > 0) return true;
  if (word.easeFactor < 2.3) return true;
  if (word.repetitions === 0 && (word.reviewLogs?.length || 0) > 0) return true;
  return false;
};

/**
 * Total count of 'again' or 'hard' ratings logged during spaced repetition
 */
export const getWordMistakeCount = (word: WordItem): number => {
  if (!word.reviewLogs || word.reviewLogs.length === 0) return 0;
  return word.reviewLogs.filter((l) => l.rating === 'again' || l.rating === 'hard').length;
};

/**
 * Returns severity level of weakness for styling badges and sorting
 */
export const getWeaknessSeverity = (word: WordItem): 'high' | 'medium' | 'low' | 'none' => {
  const mistakes = getWordMistakeCount(word);
  if (mistakes >= 3 || (word.easeFactor < 2.0 && mistakes >= 2)) return 'high';
  if (mistakes >= 1 || word.easeFactor < 2.3) return 'medium';
  if (word.repetitions === 0 && (word.reviewLogs?.length || 0) > 0) return 'low';
  return 'none';
};

/**
 * Filters and sorts words by weakest first
 */
export const getWeakWords = (words: WordItem[]): WordItem[] => {
  return words
    .filter(isWeakWord)
    .sort((a, b) => {
      // Sort primarily by mistake count descending, then easeFactor ascending
      const mistakesDiff = getWordMistakeCount(b) - getWordMistakeCount(a);
      if (mistakesDiff !== 0) return mistakesDiff;
      return a.easeFactor - b.easeFactor;
    });
};
