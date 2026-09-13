import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  FirebaseUser,
} from '../lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isFirebaseUser: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<boolean>;
  loginAsPreviewGuest: (customName?: string) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_ACTIVE_USER_ID = 'kelime_defterim_active_user_id';
const STORAGE_LOCAL_USER = 'kelime_defterim_active_local_user';
const STORAGE_LOCAL_ACCOUNTS = 'kelime_defterim_local_accounts_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          // Fetch or initialize user profile from cloud
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);

          let profileData: UserProfile;
          if (docSnap.exists()) {
            const data = docSnap.data();
            profileData = {
              id: fbUser.uid,
              name: data.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Kullanıcı',
              email: fbUser.email || '',
              avatarSeed: data.avatarSeed || fbUser.uid.slice(0, 5),
              joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
              dailyGoal: data.dailyGoal || 10,
              preferredVoice: data.preferredVoice || 'en-US',
              speechRate: data.speechRate || 0.9,
              isFirebaseUser: true,
              photoURL: fbUser.photoURL || undefined,
            };
          } else {
            profileData = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Kullanıcı',
              email: fbUser.email || '',
              avatarSeed: fbUser.uid.slice(0, 5),
              joinedDate: new Date().toISOString().split('T')[0],
              dailyGoal: 10,
              preferredVoice: 'en-US',
              speechRate: 0.9,
              isFirebaseUser: true,
              photoURL: fbUser.photoURL || undefined,
            };
            // Save initial profile to cloud
            await setDoc(userDocRef, {
              uid: fbUser.uid,
              displayName: profileData.name,
              email: profileData.email,
              dailyGoal: profileData.dailyGoal,
              preferredVoice: profileData.preferredVoice,
              speechRate: profileData.speechRate,
              joinedDate: profileData.joinedDate,
              updatedAt: new Date().toISOString(),
            });
          }

          setUser(profileData);
          localStorage.setItem(STORAGE_ACTIVE_USER_ID, profileData.id);
          localStorage.removeItem(STORAGE_LOCAL_USER);
        } catch (err) {
          console.warn('User profile fetch error, using basic auth:', err);
          const fallbackProfile: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Kullanıcı',
            email: fbUser.email || '',
            avatarSeed: fbUser.uid.slice(0, 5),
            joinedDate: new Date().toISOString().split('T')[0],
            dailyGoal: 10,
            preferredVoice: 'en-US',
            speechRate: 0.9,
            isFirebaseUser: true,
            photoURL: fbUser.photoURL || undefined,
          };
          setUser(fallbackProfile);
          localStorage.setItem(STORAGE_ACTIVE_USER_ID, fallbackProfile.id);
        }
      } else {
        // If no Firebase user, check if active local user exists
        try {
          const storedLocal = localStorage.getItem(STORAGE_LOCAL_USER);
          if (storedLocal) {
            const parsed = JSON.parse(storedLocal);
            if (parsed && parsed.id) {
              setUser(parsed);
              localStorage.setItem(STORAGE_ACTIVE_USER_ID, parsed.id);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        setUser(null);
        localStorage.removeItem(STORAGE_ACTIVE_USER_ID);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  // Quick Instant Preview Guest Login
  const loginAsPreviewGuest = (customName = 'Önizleme Kullanıcısı') => {
    setAuthError(null);
    const localId = 'preview_' + Math.random().toString(36).substring(2, 8);
    const previewUser: UserProfile = {
      id: localId,
      name: customName,
      email: 'onizleme@kelimedefterim.local',
      avatarSeed: localId.slice(0, 5),
      joinedDate: new Date().toISOString().split('T')[0],
      dailyGoal: 10,
      preferredVoice: 'en-US',
      speechRate: 0.9,
      isFirebaseUser: false,
    };
    setUser(previewUser);
    localStorage.setItem(STORAGE_ACTIVE_USER_ID, previewUser.id);
    localStorage.setItem(STORAGE_LOCAL_USER, JSON.stringify(previewUser));
  };

  // Sign In with Google
  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Giriş penceresi kapatıldı.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Tarayıcınız açılır pencereyi engelledi. Lütfen izin verin.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('Giriş isteği iptal edildi.');
      } else if (err.code === 'auth/unauthorized-domain') {
        // If domain unauthorized in preview, provide automatic preview fallback
        loginAsPreviewGuest('Google Kullanıcısı (Önizleme)');
        return true;
      } else {
        setAuthError('Google ile giriş yapılırken bir sorun oluştu.');
      }
      return false;
    }
  };

  // Sign in with Email & Password
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
      return true;
    } catch (err: any) {
      console.warn('Firebase Email Login failed, checking local accounts:', err.code);

      // Check if user exists in local accounts registry
      try {
        const existingUsersStr = localStorage.getItem(STORAGE_LOCAL_ACCOUNTS);
        if (existingUsersStr) {
          const localAccounts = JSON.parse(existingUsersStr);
          const found = localAccounts.find((acc: any) => acc.email === cleanEmail);
          if (found) {
            if (found.pass === pass || found.passHash === btoa(pass)) {
              setUser(found.profile);
              localStorage.setItem(STORAGE_ACTIVE_USER_ID, found.profile.id);
              localStorage.setItem(STORAGE_LOCAL_USER, JSON.stringify(found.profile));
              return true;
            } else {
              setAuthError('Şifre hatalı. Lütfen tekrar deneyin.');
              return false;
            }
          }
        }
      } catch (e) {
        console.warn('Local account verification error:', e);
      }

      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setAuthError('E-posta veya şifre hatalı.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Geçerli bir e-posta adresi giriniz.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Çok fazla başarısız deneme yapıldı. Lütfen biraz sonra tekrar deneyin.');
      } else {
        setAuthError('E-posta veya şifre hatalı.');
      }
      return false;
    }
  };

  // Register with Email & Password (with guaranteed local preview fallback)
  const registerWithEmail = async (name: string, email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAuthError('Geçerli bir e-posta adresi giriniz.');
      return false;
    }

    if (pass.length < 6) {
      setAuthError('Şifreniz en az 6 karakter olmalıdır.');
      return false;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        // Save initial profile in cloud database
        try {
          const userDocRef = doc(db, 'users', cred.user.uid);
          await setDoc(userDocRef, {
            uid: cred.user.uid,
            displayName: cleanName,
            email: cleanEmail,
            dailyGoal: 10,
            preferredVoice: 'en-US',
            speechRate: 0.9,
            joinedDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Initial profile doc save warning:', e);
        }
      }
      return true;
    } catch (err: any) {
      console.warn('Firebase Email Register notice/error:', err.code, err.message);

      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Bu e-posta adresi ile zaten kayıtlı bir hesap var. Lütfen giriş yapın.');
        return false;
      }
      if (err.code === 'auth/invalid-email') {
        setAuthError('Geçerli bir e-posta adresi giriniz.');
        return false;
      }
      if (err.code === 'auth/weak-password') {
        setAuthError('Şifreniz en az 6 karakter olmalıdır.');
        return false;
      }

      // If Firebase Auth blocked the creation (e.g. auth/operation-not-allowed, auth/unauthorized-domain, auth/network-request-failed, iframe restrictions):
      // Gracefully create a full preview/local account so the user is NEVER blocked!
      const localId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newLocalProfile: UserProfile = {
        id: localId,
        name: cleanName || 'Kullanıcı',
        email: cleanEmail,
        avatarSeed: localId.slice(0, 5),
        joinedDate: new Date().toISOString().split('T')[0],
        dailyGoal: 10,
        preferredVoice: 'en-US',
        speechRate: 0.9,
        isFirebaseUser: false,
      };

      try {
        const existingUsersStr = localStorage.getItem(STORAGE_LOCAL_ACCOUNTS);
        const localAccounts = existingUsersStr ? JSON.parse(existingUsersStr) : [];
        if (localAccounts.some((acc: any) => acc.email === cleanEmail)) {
          setAuthError('Bu e-posta adresiyle zaten kayıtlı bir hesap var. Lütfen giriş yapın.');
          return false;
        }
        localAccounts.push({
          email: cleanEmail,
          pass,
          passHash: btoa(pass),
          profile: newLocalProfile,
        });
        localStorage.setItem(STORAGE_LOCAL_ACCOUNTS, JSON.stringify(localAccounts));
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }

      setUser(newLocalProfile);
      localStorage.setItem(STORAGE_ACTIVE_USER_ID, newLocalProfile.id);
      localStorage.setItem(STORAGE_LOCAL_USER, JSON.stringify(newLocalProfile));
      return true;
    }
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('Signout warning:', err);
    }
    setUser(null);
    localStorage.removeItem(STORAGE_ACTIVE_USER_ID);
    localStorage.removeItem(STORAGE_LOCAL_USER);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (user.isFirebaseUser && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(
          userDocRef,
          {
            displayName: updated.name,
            dailyGoal: updated.dailyGoal,
            preferredVoice: updated.preferredVoice,
            speechRate: updated.speechRate,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to sync profile updates to cloud:', err);
      }
    } else {
      // Update local storage
      try {
        localStorage.setItem(STORAGE_LOCAL_USER, JSON.stringify(updated));
        const existingUsersStr = localStorage.getItem(STORAGE_LOCAL_ACCOUNTS);
        if (existingUsersStr) {
          const list = JSON.parse(existingUsersStr);
          const idx = list.findIndex((u: any) => u.profile?.id === updated.id);
          if (idx !== -1) {
            list[idx].profile = updated;
            localStorage.setItem(STORAGE_LOCAL_ACCOUNTS, JSON.stringify(list));
          }
        }
      } catch (e) {
        console.warn('Local profile update error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isFirebaseUser: !!user?.isFirebaseUser,
        isLoading,
        authError,
        clearAuthError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsPreviewGuest,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
