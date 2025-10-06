// auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {jwtDecode} from "jwt-decode";
import { request } from "../api/request";

type Decoded = { exp?: number; sub?: string; type?: string };

type Tokens = { accessToken: string; refreshToken: string };
type AuthState = {
  userId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};
type AuthContextValue = AuthState & {
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  ensureAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue>({} as any);

const ACCESS_KEY = "auth.access";
const REFRESH_KEY = "auth.refresh";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({});

  // ---- bootstrap from storage
  useEffect(() => {
    (async () => {
      const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      const userId = accessToken ? safeDecode(accessToken)?.sub ?? null : null;
      setState({ accessToken, refreshToken, userId});
    })();
  }, []);

  const setTokens = async ({ accessToken, refreshToken }: Tokens) => {
    console.log("invoiking set tokens with", accessToken, refreshToken)
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    const userId = safeDecode(accessToken)?.sub ?? null;
    setState((s) => ({ ...s, accessToken, refreshToken, userId }));
  };

  const clearTokens = async () => {
    
    console.log("invoiking clear tokens ")
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setState({accessToken: null, refreshToken: null, userId: null });
  };

  const loginMutation = `mutation($phone:String!, $pw:String!){
        login(data:{phoneNumber:$phone, password:$pw}) { accessToken refreshToken }
      }`

  // ---- API calls
  const signIn = async (phoneNumber: string, password: string) => {
    const res = await request<{ login: Tokens }>(
      loginMutation,
      { phone: phoneNumber, pw: password },
    );
    console.log("res is ", res)
    await setTokens(res.login);
  };

  const signOut = async () => {
    await clearTokens();
  };

  // ---- token refresh machinery
  let refreshingPromise: Promise<string | null> | null = null;

  const ensureAccessToken = async (): Promise<string | null> => {
    console.log("ensureAccessToken state is ", state)
    const { accessToken, refreshToken } = state;
    if (!accessToken || !refreshToken) return null;

    const decoded = safeDecode(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const isNearExpiry = !decoded?.exp || decoded.exp - now < 30;

    if (!isNearExpiry) return accessToken;
    if (!refreshingPromise) {
      refreshingPromise = (async () => {
        try {
          const res = await request<{login:  Tokens }>(
            `mutation($rt:String!){ refreshToken(refreshToken:$rt){ accessToken refreshToken } }`,
            { rt: refreshToken },
          );
          console.log("res is", res)
          await setTokens(res.login);
          return res.login.accessToken;
        } catch {
          await clearTokens();
          return null;
        } finally {
          refreshingPromise = null;
        }
      })();
    }
    return refreshingPromise;
  };

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signOut, ensureAccessToken }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);


function safeDecode(token: string | null | undefined): Decoded | null {
  if (!token) return null;
  try {
    return jwtDecode<Decoded>(token);
  } catch {
    return null;
  }
}
