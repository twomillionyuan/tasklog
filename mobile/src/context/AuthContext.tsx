import { createContext, startTransition, useContext, useState } from "react";

import { login, register } from "@/src/lib/api";
import type { User } from "@/src/types/api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  async function signIn(email: string, password: string) {
    const response = await login(email, password);

    startTransition(() => {
      setToken(response.token);
      setUser(response.user);
    });
  }

  async function signUp(email: string, password: string) {
    const response = await register(email, password);

    startTransition(() => {
      setToken(response.token);
      setUser(response.user);
    });
  }

  function signOut() {
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
