import config from "@/app.config";

// graphqlClient.ts
export type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

const endpoint = config.apiUrl;

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  getToken?: () => string | undefined
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(getToken?.() ? { authorization: `Bearer ${getToken!()}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  return res.json()
}
