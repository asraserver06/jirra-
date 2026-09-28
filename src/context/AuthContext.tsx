import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '../types/jira';
import { MOCK_USERS } from '../data/mockData';

interface AuthContextType {
  session: Session;
  signIn: (userId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchUser: (userId: string) => void;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>(() => {
    const savedUser = localStorage.getItem('jira_session_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          return {
            user: parsed,
            status: 'authenticated',
          };
        }
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
    // Default session: Alex Mercer
    return {
      user: MOCK_USERS[0],
      status: 'authenticated',
    };
  });

  useEffect(() => {
    if (session.user) {
      localStorage.setItem('jira_session_user', JSON.stringify(session.user));
    } else {
      localStorage.removeItem('jira_session_user');
    }
  }, [session]);

  const signIn = async (userId?: string) => {
    const targetUser = MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0];
    setSession({
      user: targetUser,
      status: 'authenticated',
    });
  };

  const signOut = async () => {
    localStorage.removeItem('jira_session_user');
    setSession({
      user: null,
      status: 'unauthenticated',
    });
  };

  const switchUser = (userId: string) => {
    const targetUser = MOCK_USERS.find((u) => u.id === userId);
    if (targetUser) {
      setSession({
        user: targetUser,
        status: 'authenticated',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        signIn,
        signOut,
        switchUser,
        availableUsers: MOCK_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
