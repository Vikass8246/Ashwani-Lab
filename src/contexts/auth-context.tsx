
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, signOut, type User, updatePassword, getIdTokenResult, GoogleAuthProvider, signInWithPopup, reload } from 'firebase/auth';
import { getFirebaseAuth, getDb, getMessagingInstance } from '@/lib/firebase/config';
import { usePathname, useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

type UserRole = 'patient' | 'staff' | 'admin' | 'phlebo' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  isSessionExpired: boolean;
  clearSessionExpired: () => void;
  userRole: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const requestNotificationPermission = async (userId: string, role: UserRole) => {
  const messaging = getMessagingInstance();
  if (!messaging || !role || role === 'admin') {
    console.log("Firebase Messaging is not available, or user is an admin.");
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging, {
        vapidKey: 'BDSr4jY3c5w7JvIyA1p_pD4Y1hFh1f6w-pE9j0d4m3g0k1i5n3w8s5H7c9yY4b1d9sR8vK6oI7Q', // Use your actual VAPID key
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        const db = getDb();
        let collectionName = "staff"; // default for staff
        if (role === "phlebo") collectionName = "phlebos";
        if (role === "patient") collectionName = "patients";

        const userDocRef = doc(db, 'ashwani/data', collectionName, userId);
        await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });
        console.log(`FCM token saved for ${role} ${userId}`);
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission. ', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const previousUserRef = useRef<User | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const publicPages = ['/', '/login', '/register', '/privacy', '/terms', '/forgot-password'];
      const isPublicPage = publicPages.includes(pathname);

      if (previousUserRef.current && !currentUser && !isPublicPage) {
        setIsSessionExpired(true);
      }
      
      let role: UserRole = null;
      if (currentUser) {
        try {
            const idTokenResult = await getIdTokenResult(currentUser, true); // Force refresh
            role = (idTokenResult.claims.role as UserRole) || 'patient';
            setUserRole(role);

            if (!previousUserRef.current) {
                requestNotificationPermission(currentUser.uid, role);
            }
        } catch (error: any) {
            if (error.code === 'auth/user-token-expired') {
                console.warn("User token expired. Signing out.");
                await signOut(auth); // This will trigger onAuthStateChanged again with currentUser=null
                setIsSessionExpired(true);
                setUser(null);
                setUserRole(null);
                setLoading(false);
                return; 
            } else {
                console.error("Error getting user token:", error);
            }
        }
      } else {
        setUserRole(null);
      }

      setUser(currentUser);
      previousUserRef.current = currentUser;
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push('/');
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const db = getDb();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const patientDocRef = doc(db, "ashwani/data/patients", user.uid);
    const docSnap = await getDoc(patientDocRef);
    if (!docSnap.exists()) {
        await setDoc(patientDocRef, {
            name: user.displayName || "Google User",
            email: user.email,
            contact: user.phoneNumber || "",
            age: 0, 
            sex: "Other", 
            address: "",
        });
    }
  };

  const resetPassword = async (newPassword: string) => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    } else {
      throw new Error("No user is currently signed in.");
    }
  };
  
  const clearSessionExpired = () => {
    setIsSessionExpired(false);
  };

  const value = {
    user,
    userRole,
    loading,
    logout,
    signInWithGoogle,
    resetPassword,
    isSessionExpired,
    clearSessionExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
