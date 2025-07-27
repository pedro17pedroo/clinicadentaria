import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        console.log('🔐 useAuth: Fazendo requisição para /api/auth/user');
        const response = await apiRequest("GET", "/api/auth/user");
        const userData = await response.json();
        console.log('👤 useAuth: Utilizador autenticado:', userData);
        return userData;
      } catch (error) {
        console.log('❌ useAuth: Erro na autenticação:', error);
        // Se não há token ou token inválido, retornar null
        if (error instanceof Error && error.message.includes('401')) {
          console.log('🚫 useAuth: Token inválido (401)');
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
