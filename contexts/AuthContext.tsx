"use client";

import { auth } from "@/lib/firebase";
import {
  getOrCreateUserByAuthUid,
  updateUserStatusByAuthUid,
} from "@/lib/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firestoreUserId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firestoreUserId: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUserId, setFirestoreUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Create or get Firestore user linked to this Firebase Auth user
        const userId = await getOrCreateUserByAuthUid(firebaseUser.uid, {
          name: firebaseUser.displayName || undefined,
          email: firebaseUser.email || undefined,
          phoneNumber: firebaseUser.phoneNumber || undefined,
        });
        setFirestoreUserId(userId);

        // Update user online status
        await updateUserStatusByAuthUid(firebaseUser.uid, true);

        // Set offline on window close
        const handleBeforeUnload = () => {
          updateUserStatusByAuthUid(firebaseUser.uid, false);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        setLoading(false);

        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        };
      } else {
        setFirestoreUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firestoreUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
