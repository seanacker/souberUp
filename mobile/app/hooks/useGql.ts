import { useAuth } from "../auth/AuthContext";
import { request } from "../api/request";

// graphqlClient.ts
export type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

export function useGql() {
  const { ensureAccessToken } = useAuth();

  const call = async <T>(query: string, variables?: Record<string, any>) => {
    const token = await ensureAccessToken();
    console.log("requesting", query, "with", token)
    const res = await request<T>(query, variables, token)
    
    return res
  };

  return { call };
}