import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, firstName: string, lastName: string, dateOfBirth: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, dateOfBirth: string) => {
    // First, sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    // If signup was successful and we have user data, insert into user table
    if (authData.user && firstName && lastName && dateOfBirth) {
      // Try using the database function first (bypasses RLS)
      const { error: functionError } = await supabase.rpc('create_user_profile', {
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
      });

      // If function doesn't exist or fails, try direct insert
      if (functionError) {
        console.warn('Function call failed, trying direct insert:', functionError);
        const { error: userError } = await supabase
          .from('user')
          .insert([
            {
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              date_of_birth: dateOfBirth,
            },
          ]);

        if (userError) {
          console.error('Error creating user record:', userError);
          throw new Error(`Failed to create user profile: ${userError.message}`);
        }
      }
    }

    return authData;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

