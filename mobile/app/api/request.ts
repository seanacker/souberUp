import config from "@/app.config";

// graphqlClient.ts
export type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

//@ts-ignore
const endpoint = config.extra?.apiUrl;

export async function request<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null
): Promise<T> {
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  
  let json: GraphQLResponse<T>;
  try {
    json = JSON.parse(text);
  } catch (e){
    throw new Error(`Non-JSON response: ${text.slice(0, 300)}`);
  }
  
  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "fetching error");
  }
  console.log("request succeeded with:", json.data)
  return json.data as T;
}
