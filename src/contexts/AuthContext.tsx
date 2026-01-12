import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  shortcode: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  // Future: accessToken for real API calls
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "demo-user-001",
  name: "Arnav Popley",
  email: "ap123@imperial.ac.uk",
  shortcode: "ap123",
};

const STORAGE_KEY = "imperial_library_wrapped_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setAccessToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (): Promise<void> => {
    // Simulate SSO login delay
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In production, this would:
    // 1. Redirect to Imperial SSO
    // 2. Handle OAuth callback
    // 3. Exchange code for tokens
    // 4. Fetch user profile

    const mockToken = "mock-jwt-token-" + Date.now();
    setUser(DEMO_USER);
    setAccessToken(mockToken);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: DEMO_USER,
        token: mockToken,
      }),
    );

    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);

    // In production, also:
    // 1. Revoke tokens
    // 2. Clear SSO session
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
