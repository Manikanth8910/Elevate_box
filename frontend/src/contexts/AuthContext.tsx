import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/api.client';
import { Role, Permission } from '@document-approval/shared';

// For the frontend, we replicate a lightweight version of the RolePermissions 
// mapping so the UI can synchronously check permissions without network roundtrips.
const FrontendRolePermissions: Record<Role, Permission[]> = {
  [Role.VIEWER]: [Permission.VIEW_PUBLISHED, Permission.VIEW_PROFILE],
  [Role.AUTHOR]: [
    Permission.VIEW_PUBLISHED, Permission.VIEW_PROFILE, Permission.CREATE_DRAFT,
    Permission.EDIT_OWN_DRAFT, Permission.SUBMIT_DRAFT, Permission.REOPEN_REJECTED,
    Permission.VIEW_OWN_HISTORY,
  ],
  [Role.REVIEWER]: [
    Permission.VIEW_PUBLISHED, Permission.VIEW_PROFILE, Permission.VIEW_REVIEW_QUEUE,
    Permission.APPROVE_DOC, Permission.REJECT_DOC, Permission.PUBLISH_DOC,
    Permission.VIEW_ANY_HISTORY,
  ],
  [Role.ADMIN]: [
    Permission.VIEW_PUBLISHED, Permission.VIEW_PROFILE, Permission.VIEW_ALL_DOCS,
    Permission.PUBLISH_DOC, Permission.ARCHIVE_ANY_DOC, Permission.VIEW_USERS,
    Permission.VIEW_AUDIT_LOGS, Permission.VIEW_ANALYTICS, Permission.MANAGE_SYSTEM,
  ],
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch current user on load
    const token = localStorage.getItem('access_token');
    if (token) {
      ApiClient.get<{ user: User }>('/auth/me')
        .then(res => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('access_token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: User, token: string) => {
    localStorage.setItem('access_token', token);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await ApiClient.post('/auth/logout', {});
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = FrontendRolePermissions[user.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
