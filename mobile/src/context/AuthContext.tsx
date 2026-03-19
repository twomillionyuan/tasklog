import * as SecureStore from "expo-secure-store";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";

import { login, register } from "@/src/lib/api";
import type { User } from "@/src/types/api";

const TOKEN_STORAGE_KEY = "spotlog.token";
const USER_STORAGE_KEY = "spotlog.user";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_STORAGE_KEY),
          SecureStore.getItemAsync(USER_STORAGE_KEY)
        ]);

        if (storedToken && storedUser) {
          startTransition(() => {
            setToken(storedToken);
            setUser(JSON.parse(storedUser) as User);
          });
        }
      } finally {
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, []);

  async function signIn(email: string, password: string) {
    const response = await login(email, password);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_STORAGE_KEY, response.token),
      SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(response.user))
    ]);

    startTransition(() => {
      setToken(response.token);
      setUser(response.user);
    });
  }

  async function signUp(email: string, password: string) {
    const response = await register(email, password);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_STORAGE_KEY, response.token),
      SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(response.user))
    ]);

    startTransition(() => {
      setToken(response.token);
      setUser(response.user);
    });
  }

  async function signOut() {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY),
      SecureStore.deleteItemAsync(USER_STORAGE_KEY)
    ]);

    startTransition(() => {
      setToken(null);
      setUser(null);
    });
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isRestoring,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
