// useGQL.ts
import { graphqlRequest } from "./graphqlRequest";
import React from "react";


export function useGQLQuery<TData>(
  query: string,
  variables?: Record<string, unknown>,
  getToken?: () => string | undefined,

) {
  return React.useMemo(() => () => graphqlRequest<TData>(query, variables, getToken), [query, variables, getToken])

}

export function useGQLMutation<TData>(
  mutation: (mutation: string) => string,
  variables?: Record<string, unknown>,
  getToken?: () => string | undefined,
) {
  return React.useMemo(() => (mutationInput: string) => graphqlRequest<TData>(mutation(mutationInput), variables, getToken), [mutation, variables, getToken])
}
