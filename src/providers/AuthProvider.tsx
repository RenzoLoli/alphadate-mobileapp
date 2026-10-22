import { type ReactNode, createContext, useEffect, useState } from "react";

import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";

export type AuthContextValue = {
  session: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        await getCurrentUser();
        await fetchAuthSession();

        if (mounted) {
          setSession(true);
        }
      } catch {
        if (mounted) {
          setSession(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const result = await amplifySignIn({
      username: email,
      password,
    });

    if (!result.isSignedIn) {
      throw new Error(
        `Sign in requires additional step: ${result.nextStep.signInStep}`
      );
    }

    const { tokens } = await fetchAuthSession();

    if (!tokens?.accessToken) {
      throw new Error("Could not obtain a valid session");
    }

    setSession(true);
  }

  async function signUp(email: string, password: string) {
    await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
        autoSignIn: false,
      },
    });

    setSession(false);
  }

  async function signOut() {
    await amplifySignOut();
    setSession(false);
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
