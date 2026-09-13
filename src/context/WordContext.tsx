import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  WordItem,
  WordFolder,
  ReviewRating,
  CEFRLevel,
  DailyActivityLog,
  StreakInfo,
} from '../types';
import {
  calculateSRSUpdate,
  getTodayString,
  isWordDueToday,
  addDaysToDate,
} from '../utils/srs';
import { useAuth } from './AuthContext';
import {
  db,
  auth,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from '../lib/firebase';

interface WordContextType {
  words: WordItem[];
  folders: WordFolder[];
  isLoading: boolean;
  isCloudConnected: boolean;
  isSyncing: boolean;
  syncStatusMessage: string;
  wordsDueToday: WordItem[];
  todayReviewsCount: number;
  streak: StreakInfo;
  activityLogs: DailyActivityLog[];
  levelCounts: Record<CEFRLevel, number>;
  folderCounts: Record<string, number>;
  addWord: (data: {
    word: string;
    meaning: string;
    sentence: string;
    sentenceMeaning?: string;
    level: CEFRLevel;
    partOfSpeech: WordItem['partOfSpeech'];
    phonetic?: string;
    notes?: string;
    tags?: string[];
    folderId?: string;
  }) => WordItem;
  updateWord: (id: string, updates: Partial<WordItem>) => void;
  deleteWord: (id: string) => void;
  reviewWord: (id: string, rating: ReviewRating) => void;
  resetWordSRS: (id: string) => void;
  importWords: (imported: WordItem[]) => void;
  getWordsByLevel: (level: CEFRLevel) => WordItem[];
  uploadLocalWordsToCloud: () => Promise<number>;
  addFolder: (name: string, color?: string, description?: string) => Promise<WordFolder>;
  updateFolder: (id: string, updates: Partial<WordFolder>) => Promise<void>;
  deleteFolder: (id: string, deleteWordsInside?: boolean) => Promise<void>;
  assignWordToFolder: (wordId: string, folderId: string | undefined) => void;
}

const WordContext = createContext<WordContextType | undefined>(undefined);

export const WordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const isCloudUser = !!(auth.currentUser && user?.isFirebaseUser);

  const storageKeyWords = `kelime_defterim_words_v3_${userId}`;
  const storageKeyFolders = `kelime_defterim_folders_v3_${userId}`;
  const storageKeyActivity = `kelime_defterim_activity_v3_${userId}`;
  const storageKeyStreak = `kelime_defterim_streak_v3_${userId}`;

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('Hazır');

  // Words start at 0 (empty array) for new accounts or clean guest
  const [words, setWords] = useState<WordItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKeyWords);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any leftover sample/seed words from previous demo versions
          const clean = parsed.filter((w) => !w.id?.startsWith('seed-'));
          return clean;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Custom User Folders
  const [folders, setFolders] = useState<WordFolder[]>(() => {
    try {
      const stored = localStorage.getItem(storageKeyFolders);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Clean initial activity logs
  const [activityLogs, setActivityLogs] = useState<DailyActivityLog[]>(() => {
    try {
      const stored = localStorage.getItem(storageKeyActivity);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  // Clean initial streak
  const [streak, setStreak] = useState<StreakInfo>(() => {
    try {
      const stored = localStorage.getItem(storageKeyStreak);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
    };
  });

  const isFirestoreActive = useRef(false);

  // Real-time Cloud Sync when User is signed in
  useEffect(() => {
    if (!isCloudUser || !user) {
      isFirestoreActive.current = false;
      try {
        const storedWords = localStorage.getItem(storageKeyWords);
        if (storedWords) {
          const parsed = JSON.parse(storedWords);
          if (Array.isArray(parsed)) {
            setWords(parsed.filter((w) => !w.id?.startsWith('seed-')));
          }
        } else {
          setWords([]);
        }

        const storedFolders = localStorage.getItem(storageKeyFolders);
        if (storedFolders) {
          const parsedF = JSON.parse(storedFolders);
          if (Array.isArray(parsedF)) {
            setFolders(parsedF);
          }
        } else {
          setFolders([]);
        }
      } catch {
        setWords([]);
        setFolders([]);
      }
      return;
    }

    setIsLoading(true);
    setIsSyncing(true);
    setSyncStatusMessage('Veritabanına bağlanılıyor...');
    isFirestoreActive.current = true;

    const wordsColRef = collection(db, 'users', user.id, 'words');
    const foldersColRef = collection(db, 'users', user.id, 'folders');
    const activityColRef = collection(db, 'users', user.id, 'activity');

    // Auto-migrate any pre-existing local words/folders directly to cloud database
    try {
      const storedLocal = localStorage.getItem(storageKeyWords) || localStorage.getItem('kelime_defterim_words_v3_guest');
      if (storedLocal) {
        const parsed: WordItem[] = JSON.parse(storedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item) => {
            if (item && item.id && !item.id.startsWith('seed-')) {
              setDoc(doc(db, 'users', user.id, 'words', item.id), item, { merge: true }).catch((err) => {
                console.warn('Auto-save word to database:', err);
              });
            }
          });
        }
      }
      const storedFolders = localStorage.getItem(storageKeyFolders) || localStorage.getItem('kelime_defterim_folders_v3_guest');
      if (storedFolders) {
        const parsedF: WordFolder[] = JSON.parse(storedFolders);
        if (Array.isArray(parsedF) && parsedF.length > 0) {
          parsedF.forEach((f) => {
            if (f && f.id) {
              setDoc(doc(db, 'users', user.id, 'folders', f.id), f, { merge: true }).catch((err) => {
                console.warn('Auto-save folder to database:', err);
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Auto migration error:', e);
    }

    // Subscribe to real-time word updates from cloud database
    const unsubscribeWords = onSnapshot(
      wordsColRef,
      (snapshot) => {
        setIsLoading(false);
        setIsSyncing(false);
        if (!snapshot.empty) {
          const cloudWords: WordItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as WordItem;
            cloudWords.push({ ...data, id: docSnap.id });
          });
          cloudWords.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setWords(cloudWords);
          setSyncStatusMessage(`${cloudWords.length} kelime veritabanında`);
        } else {
          // If cloud database is empty, check if we had any active words to write directly
          setWords((prev) => {
            if (prev.length > 0) {
              prev.forEach((w) => {
                if (!w.id.startsWith('seed-')) {
                  setDoc(doc(db, 'users', user.id, 'words', w.id), w, { merge: true }).catch(console.warn);
                }
              });
              return prev;
            }
            return [];
          });
          setSyncStatusMessage('Hazır');
        }
      },
      (error) => {
        console.error('Cloud words listener error:', error);
        setIsLoading(false);
        setIsSyncing(false);
        setSyncStatusMessage('Yerel depolama devrede');
      }
    );

    // Subscribe to real-time folders from cloud database
    const unsubscribeFolders = onSnapshot(
      foldersColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudFolders: WordFolder[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as WordFolder;
            cloudFolders.push({ ...data, id: docSnap.id });
          });
          cloudFolders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setFolders(cloudFolders);
        } else {
          setFolders((prev) => {
            if (prev.length > 0) {
              prev.forEach((f) => {
                setDoc(doc(db, 'users', user.id, 'folders', f.id), f, { merge: true }).catch(console.warn);
              });
              return prev;
            }
            return [];
          });
        }
      },
      (error) => {
        console.warn('Cloud folders listener error:', error);
      }
    );

    // Subscribe to cloud activity logs
    const unsubscribeActivity = onSnapshot(
      activityColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const logs: DailyActivityLog[] = [];
          snapshot.forEach((docSnap) => {
            logs.push(docSnap.data() as DailyActivityLog);
          });
          logs.sort((a, b) => a.date.localeCompare(b.date));
          setActivityLogs(logs);
        }
      },
      (error) => {
        console.warn('Cloud activity listener error:', error);
      }
    );

    return () => {
      unsubscribeWords();
      unsubscribeFolders();
      unsubscribeActivity();
    };
  }, [isCloudUser, user?.id, storageKeyWords, storageKeyFolders]);

  // Persist words locally as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyWords, JSON.stringify(words));
    } catch {
      // ignore
    }
  }, [words, storageKeyWords]);

  // Persist folders locally as offline cache
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFolders, JSON.stringify(folders));
    } catch {
      // ignore
    }
  }, [folders, storageKeyFolders]);

  // Persist activity locally
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyActivity, JSON.stringify(activityLogs));
    } catch {
      // ignore
    }
  }, [activityLogs, storageKeyActivity]);

  // Persist streak locally
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyStreak, JSON.stringify(streak));
    } catch {
      // ignore
    }
  }, [streak, storageKeyStreak]);

  const wordsDueToday = useMemo(() => {
    const today = getTodayString();
    return words.filter((w) => isWordDueToday(w, today));
  }, [words]);

  const todayReviewsCount = useMemo(() => {
    const today = getTodayString();
    const todayLog = activityLogs.find((l) => l.date === today);
    return todayLog ? todayLog.reviewsCount : 0;
  }, [activityLogs]);

  const levelCounts = useMemo<Record<CEFRLevel, number>>(() => {
    const counts: Record<CEFRLevel, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };
    words.forEach((w) => {
      if (counts[w.level] !== undefined) {
        counts[w.level]++;
      }
    });
    return counts;
  }, [words]);

  const folderCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => {
      counts[f.id] = 0;
    });
    words.forEach((w) => {
      if (w.folderId && counts[w.folderId] !== undefined) {
        counts[w.folderId]++;
      }
    });
    return counts;
  }, [words, folders]);

  const logActivity = async (isReview: boolean, isCorrect: boolean = false, isNewWord: boolean = false) => {
    const today = getTodayString();

    setActivityLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === today);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          reviewsCount: isReview ? updated[idx].reviewsCount + 1 : updated[idx].reviewsCount,
          correctReviews: isCorrect ? updated[idx].correctReviews + 1 : updated[idx].correctReviews,
          newWordsAdded: isNewWord ? updated[idx].newWordsAdded + 1 : updated[idx].newWordsAdded,
        };
        return updated;
      } else {
        const newLog: DailyActivityLog = {
          date: today,
          reviewsCount: isReview ? 1 : 0,
          correctReviews: isCorrect ? 1 : 0,
          newWordsAdded: isNewWord ? 1 : 0,
        };
        return [...prev, newLog];
      }
    });

    // Update streak
    setStreak((prev) => {
      if (prev.lastActiveDate === today) return prev;
      const yesterday = addDaysToDate(today, -1);
      const isConsecutive = prev.lastActiveDate === yesterday;
      const newStreak = isConsecutive ? prev.currentStreak + 1 : 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastActiveDate: today,
      };
    });

    // If user is signed in, sync activity to cloud database
    if (isCloudUser && user) {
      try {
        await setDoc(
          doc(db, 'users', user.id, 'activity', today),
          {
            date: today,
            reviewsCount: isReview ? todayReviewsCount + 1 : todayReviewsCount,
            correctReviews: isCorrect ? 1 : 0,
            newWordsAdded: isNewWord ? 1 : 0,
            streak: streak.currentStreak,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to sync activity to cloud:', err);
      }
    }
  };

  const addWord = (data: {
    word: string;
    meaning: string;
    sentence: string;
    sentenceMeaning?: string;
    level: CEFRLevel;
    partOfSpeech: WordItem['partOfSpeech'];
    phonetic?: string;
    notes?: string;
    tags?: string[];
    folderId?: string;
  }): WordItem => {
    const today = getTodayString();
    const newWord: WordItem = {
      id: 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      word: data.word.trim(),
      meaning: data.meaning.trim(),
      sentence: data.sentence.trim(),
      sentenceMeaning: data.sentenceMeaning?.trim() || '',
      level: data.level,
      partOfSpeech: data.partOfSpeech,
      phonetic: data.phonetic?.trim() || '',
      notes: data.notes?.trim() || '',
      tags: data.tags || [],
      folderId: data.folderId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today, // Ready to review immediately
      masteryStatus: 'new',
      reviewLogs: [],
    };

    setWords((prev) => [newWord, ...prev]);
    logActivity(false, false, true);

    // Save directly to cloud database when user is signed in
    if (isCloudUser && user) {
      setDoc(doc(db, 'users', user.id, 'words', newWord.id), newWord).catch((err) => {
        console.error('Failed to add word to cloud database:', err);
      });
    }

    return newWord;
  };

  const updateWord = (id: string, updates: Partial<WordItem>) => {
    const now = Date.now();
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: now } : w))
    );

    // Sync to cloud database
    if (isCloudUser && user) {
      setDoc(doc(db, 'users', user.id, 'words', id), { ...updates, updatedAt: now }, { merge: true }).catch(
        (err) => console.error('Failed to update word in cloud:', err)
      );
    }
  };

  const deleteWord = (id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));

    // Sync deletion to cloud database
    if (isCloudUser && user) {
      deleteDoc(doc(db, 'users', user.id, 'words', id)).catch((err) =>
        console.error('Failed to delete word in cloud:', err)
      );
    }
  };

  const reviewWord = (id: string, rating: ReviewRating) => {
    const target = words.find((w) => w.id === id);
    if (!target) return;

    const srs = calculateSRSUpdate(target, rating);
    const isCorrect = rating === 'good' || rating === 'easy';
    const now = Date.now();

    const updatedWord: Partial<WordItem> = {
      repetitions: srs.repetitions,
      interval: srs.interval,
      easeFactor: srs.easeFactor,
      nextReviewDate: srs.nextReviewDate,
      lastReviewedDate: srs.lastReviewedDate,
      masteryStatus: srs.masteryStatus,
      reviewLogs: [srs.newLog, ...target.reviewLogs],
      updatedAt: now,
    };

    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updatedWord } : w))
    );

    logActivity(true, isCorrect, false);

    // Sync review result to cloud database
    if (isCloudUser && user) {
      setDoc(doc(db, 'users', user.id, 'words', id), updatedWord, { merge: true }).catch((err) =>
        console.error('Failed to save review in cloud:', err)
      );
    }
  };

  const resetWordSRS = (id: string) => {
    const today = getTodayString();
    const now = Date.now();
    const updates = {
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      masteryStatus: 'new' as const,
      updatedAt: now,
    };

    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );

    if (isCloudUser && user) {
      setDoc(doc(db, 'users', user.id, 'words', id), updates, { merge: true }).catch((err) =>
        console.error('Failed to reset word SRS in cloud:', err)
      );
    }
  };

  const importWords = (imported: WordItem[]) => {
    setWords((prev) => {
      const existingMap = new Map(prev.map((w) => [w.word.toLowerCase(), w]));
      const newItems = imported.filter((item) => !existingMap.has(item.word.toLowerCase()));

      // If signed in, upload imported items to cloud
      if (isCloudUser && user) {
        newItems.forEach((item) => {
          setDoc(doc(db, 'users', user.id, 'words', item.id), item).catch((e) =>
            console.warn('Import cloud upload error:', e)
          );
        });
      }

      return [...newItems, ...prev];
    });
  };

  const getWordsByLevel = (level: CEFRLevel) => {
    return words.filter((w) => w.level === level);
  };

  // Folder operations
  const addFolder = async (name: string, color: string = 'indigo', description: string = ''): Promise<WordFolder> => {
    const now = Date.now();
    const newFolder: WordFolder = {
      id: 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      color: color || 'indigo',
      description: description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    setFolders((prev) => [newFolder, ...prev]);

    if (isCloudUser && user) {
      try {
        await setDoc(doc(db, 'users', user.id, 'folders', newFolder.id), newFolder);
      } catch (err) {
        console.error('Failed to add folder to cloud:', err);
      }
    }

    return newFolder;
  };

  const updateFolder = async (id: string, updates: Partial<WordFolder>): Promise<void> => {
    const now = Date.now();
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: now } : f))
    );

    if (isCloudUser && user) {
      try {
        await setDoc(doc(db, 'users', user.id, 'folders', id), { ...updates, updatedAt: now }, { merge: true });
      } catch (err) {
        console.error('Failed to update folder in cloud:', err);
      }
    }
  };

  const deleteFolder = async (id: string, deleteWordsInside: boolean = false): Promise<void> => {
    // 1. Remove folder from state
    setFolders((prev) => prev.filter((f) => f.id !== id));

    // 2. Handle words inside the folder
    if (deleteWordsInside) {
      const wordsToDelete = words.filter((w) => w.folderId === id);
      setWords((prev) => prev.filter((w) => w.folderId !== id));

      if (isCloudUser && user) {
        for (const w of wordsToDelete) {
          deleteDoc(doc(db, 'users', user.id, 'words', w.id)).catch(console.error);
        }
      }
    } else {
      // Unassign words from the deleted folder
      const now = Date.now();
      setWords((prev) =>
        prev.map((w) => (w.folderId === id ? { ...w, folderId: undefined, updatedAt: now } : w))
      );

      if (isCloudUser && user) {
        const wordsToUnassign = words.filter((w) => w.folderId === id);
        for (const w of wordsToUnassign) {
          setDoc(doc(db, 'users', user.id, 'words', w.id), { folderId: '', updatedAt: now }, { merge: true }).catch(
            console.error
          );
        }
      }
    }

    // 3. Delete folder document in cloud
    if (isCloudUser && user) {
      try {
        await deleteDoc(doc(db, 'users', user.id, 'folders', id));
      } catch (err) {
        console.error('Failed to delete folder in cloud:', err);
      }
    }
  };

  const assignWordToFolder = (wordId: string, folderId: string | undefined) => {
    updateWord(wordId, { folderId: folderId || undefined });
  };

  // Upload local words and folders to cloud
  const uploadLocalWordsToCloud = async (): Promise<number> => {
    if (!user) return 0;
    setIsSyncing(true);
    let count = 0;
    for (const w of words) {
      try {
        await setDoc(doc(db, 'users', user.id, 'words', w.id), w, { merge: true });
        count++;
      } catch (err) {
        console.error('Upload word error:', err);
      }
    }

    for (const f of folders) {
      try {
        await setDoc(doc(db, 'users', user.id, 'folders', f.id), f, { merge: true });
      } catch (err) {
        console.error('Upload folder error:', err);
      }
    }

    setIsSyncing(false);
    setSyncStatusMessage(`${count} kelime ve klasörler bulut hesabınıza eşitlendi.`);
    return count;
  };

  return (
    <WordContext.Provider
      value={{
        words,
        folders,
        isLoading,
        isCloudConnected: isCloudUser,
        isSyncing,
        syncStatusMessage,
        wordsDueToday,
        todayReviewsCount,
        streak,
        activityLogs,
        levelCounts,
        folderCounts,
        addWord,
        updateWord,
        deleteWord,
        reviewWord,
        resetWordSRS,
        importWords,
        getWordsByLevel,
        uploadLocalWordsToCloud,
        addFolder,
        updateFolder,
        deleteFolder,
        assignWordToFolder,
      }}
    >
      {children}
    </WordContext.Provider>
  );
};

export const useWords = () => {
  const context = useContext(WordContext);
  if (!context) {
    throw new Error('useWords must be used within a WordProvider');
  }
  return context;
};
