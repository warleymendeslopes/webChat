"use client";

import { authService, AuthUser } from "@/lib/auth-service";
import { auth } from "@/lib/firebase";
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
  authUser: AuthUser | null;
  loading: boolean;
  firestoreUserId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  loading: true,
  firestoreUserId: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [firestoreUserId, setFirestoreUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Authenticate user with MongoDB
          const authenticatedUser = await authService.authenticateUser(
            firebaseUser
          );

          if (authenticatedUser) {
            setAuthUser(authenticatedUser);
            setFirestoreUserId(authenticatedUser._id);
          } else {
            console.warn("User not found in MongoDB or inactive");
            setAuthUser(null);
            setFirestoreUserId(null);
          }
        } catch (error) {
          console.error("Authentication error:", error);
          setAuthUser(null);
          setFirestoreUserId(null);
        }
      } else {
        setAuthUser(null);
        setFirestoreUserId(null);
        authService.logout();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, authUser, loading, firestoreUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
