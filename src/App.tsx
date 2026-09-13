import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WordProvider, useWords } from './context/WordContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { WordListView } from './components/WordList/WordListView';
import { StudySession } from './components/Study/StudySession';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { ProfileView } from './components/Profile/ProfileView';
import { AddWordModal } from './components/AddWordModal';
import { AuthModal } from './components/Auth/AuthModal';
import { WordItem } from './types';

const MainAppContent: React.FC = () => {
  const { addWord, updateWord } = useWords();
  const [currentTab, setCurrentTab] = useState<TabType>('words');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [initialFolderId, setInitialFolderId] = useState<string | undefined>(undefined);
  const [studyInitialWord, setStudyInitialWord] = useState<WordItem | null>(null);
  const [studyFilter, setStudyFilter] = useState<'due' | 'weak' | 'all'>('due');

  const handleOpenAdd = (folderId?: string) => {
    setEditingWord(null);
    setInitialFolderId(folderId);
    setIsAddModalOpen(true);
  };

  const handleEditWord = (word: WordItem) => {
    setEditingWord(word);
    setInitialFolderId(word.folderId);
    setIsAddModalOpen(true);
  };

  const handleSaveWord = (data: Parameters<typeof addWord>[0]) => {
    if (editingWord) {
      updateWord(editingWord.id, data);
    } else {
      addWord(data);
    }
  };

  const handleStartStudy = (initialWord?: WordItem, filter: 'due' | 'weak' | 'all' = 'due') => {
    setStudyInitialWord(initialWord || null);
    setStudyFilter(filter);
    setCurrentTab('study');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900">
      {/* Top Header */}
      <Header
        onOpenAddModal={handleOpenAdd}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Navigation (Tabs for desktop, bottom bar for mobile) */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenAddModal={handleOpenAdd}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12">
        {currentTab === 'words' && (
          <WordListView
            onOpenAddModal={handleOpenAdd}
            onEditWord={handleEditWord}
            onStartStudy={handleStartStudy}
          />
        )}

        {currentTab === 'study' && (
          <StudySession
            initialWord={studyInitialWord}
            initialFilter={studyFilter}
            onFinish={() => {
              setStudyInitialWord(null);
              setStudyFilter('due');
              setCurrentTab('words');
            }}
            onOpenAddModal={handleOpenAdd}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsView />}

        {currentTab === 'profile' && (
          <ProfileView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}
      </main>

      {/* Modals */}
      <AddWordModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWord(null);
          setInitialFolderId(undefined);
        }}
        onSave={handleSaveWord}
        editingWord={editingWord}
        initialFolderId={initialFolderId}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WordProvider>
        <MainAppContent />
      </WordProvider>
    </AuthProvider>
  );
}
