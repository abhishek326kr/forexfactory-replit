import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import LoginModal from '@/components/LoginModal';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar?: string;
  bio?: string;
}

interface IntendedAction {
  type: 'download' | 'comment' | 'favorite' | 'custom';
  payload?: any;
  postId?: string | number;
  callback?: () => void;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // Modal control
  loginModalOpen: boolean;
  loginModalMode: 'login' | 'signup';
  openLoginModal: (mode?: 'login' | 'signup', intendedAction?: IntendedAction) => void;
  closeLoginModal: () => void;
  // Intended action tracking
  intendedAction: IntendedAction | null;
  setIntendedAction: (action: IntendedAction | null) => void;
  executeIntendedAction: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'signup'>('login');
  
  // Intended action state
  const [intendedAction, setIntendedAction] = useState<IntendedAction | null>(null);

  // Query to check authentication status
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/check'],
    queryFn: async () => {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to check auth');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: false
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return await response.json();
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['/api/auth/check'], {
        authenticated: true,
        user: response.user
      });
      toast({
        title: 'Login successful',
        description: `Welcome back, ${response.user.username}!`
      });
      
      // Close the login modal
      setLoginModalOpen(false);
      
      // Execute intended action if any
      if (intendedAction) {
        executeIntendedAction();
      } else if (response.user.role === 'admin') {
        // Redirect to admin dashboard only if no intended action
        setLocation('/admin');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive'
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/check'], {
        authenticated: false,
        user: null
      });
      queryClient.clear();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out'
      });
      // Redirect to home
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Logout failed',
        description: error.message || 'Failed to logout',
        variant: 'destructive'
      });
    }
  });

  const login = async (email: string, password: string, rememberMe = false) => {
    await loginMutation.mutateAsync({ email, password });
    
    // Handle remember me functionality
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const checkAuth = async () => {
    await refetch();
  };
  
  // Modal control methods
  const openLoginModal = (mode: 'login' | 'signup' = 'login', action?: IntendedAction) => {
    setLoginModalMode(mode);
    if (action) {
      setIntendedAction(action);
    }
    setLoginModalOpen(true);
  };
  
  const closeLoginModal = () => {
    setLoginModalOpen(false);
    // Don't clear intended action immediately in case of success
  };
  
  // Execute intended action after successful login
  const executeIntendedAction = () => {
    if (!intendedAction) return;
    
    const { type, payload, callback } = intendedAction;
    
    switch (type) {
      case 'download':
        // The download section will handle the actual download
        if (callback) {
          callback();
        }
        break;
      case 'comment':
        // Handle comment action
        if (callback) {
          callback();
        }
        break;
      case 'favorite':
        // Handle favorite action
        if (callback) {
          callback();
        }
        break;
      case 'custom':
        // Execute custom callback
        if (callback) {
          callback();
        }
        break;
    }
    
    // Clear the intended action after execution
    setIntendedAction(null);
  };

  const value: AuthContextValue = {
    user: data?.user || null,
    isLoading,
    isAuthenticated: data?.authenticated || false,
    isAdmin: data?.user?.role === 'admin',
    login,
    logout,
    checkAuth,
    // Modal control
    loginModalOpen,
    loginModalMode,
    openLoginModal,
    closeLoginModal,
    // Intended action tracking
    intendedAction,
    setIntendedAction,
    executeIntendedAction
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={loginModalOpen}
        onClose={closeLoginModal}
        mode={loginModalMode}
        onModeChange={setLoginModalMode}
        onSuccess={(user) => {
          // Execute intended action after successful login
          if (intendedAction) {
            executeIntendedAction();
          }
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route component
export function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}: { 
  children: ReactNode; 
  requireAdmin?: boolean;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [location] = useLocation();

  // DEVELOPMENT MODE: Bypass authentication for development
  // Remove this in production!
  if (import.meta.env.DEV) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted location for redirect after login
    sessionStorage.setItem('redirectAfterLogin', location);
    return <Redirect to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}