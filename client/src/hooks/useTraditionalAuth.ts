import { useState, useEffect, useCallback } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'admin' | 'employee' | 'doctor';
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
}

export function useTraditionalAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    mustChangePassword: false
  });

  // Verificar se há token salvo no localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          mustChangePassword: user.mustChangePassword || false
        });
        
        // Verificar se o token ainda é válido
        verifyToken(token);
      } catch (error) {
        console.error('Erro ao carregar dados do utilizador:', error);
        logout();
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/must-change-password', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Token inválido');
      }
      
      const data = await response.json();
      setAuthState(prev => ({
        ...prev,
        mustChangePassword: data.mustChangePassword
      }));
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      logout();
    }
  };

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: user.mustChangePassword || false
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mustChangePassword: false
    });
  }, []);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!authState.token) {
      throw new Error('Não autenticado');
    }

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao alterar password');
    }

    // Atualizar estado para remover flag de mudança obrigatória
    setAuthState(prev => ({
      ...prev,
      mustChangePassword: false,
      user: prev.user ? { ...prev.user, mustChangePassword: false } : null
    }));

    // Atualizar dados no localStorage
    if (authState.user) {
      const updatedUser = { ...authState.user, mustChangePassword: false };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }

    return data;
  };

  const forgotPassword = async (email: string) => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao solicitar reset de password');
    }

    return data;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao redefinir password');
    }

    return data;
  };

  // Função para fazer requests autenticados
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!authState.token) {
      throw new Error('Não autenticado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState.token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
      throw new Error('Sessão expirada');
    }

    return response;
  }, [authState.token, logout]);

  return {
    ...authState,
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    authenticatedFetch
  };
}