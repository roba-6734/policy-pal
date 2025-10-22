import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthResponse, LoginPayload, RegisterPayload, RegisterResponse, login as loginRequest, register as registerRequest, setAuthToken } from "@/services/api";

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "auth.token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const persistToken = useCallback((value: string | null) => {
    setToken(value);
    try {
      if (value) {
        localStorage.setItem(TOKEN_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    persistToken(response.access_token);
    return response;
  }, [persistToken]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    await login(payload);
    return response;
  }, [login]);

  const logout = useCallback(() => {
    persistToken(null);
  }, [persistToken]);

  const value = useMemo(() => ({
    token,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
  }), [token, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
