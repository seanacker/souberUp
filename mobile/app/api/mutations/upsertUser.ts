export const UPSERT_USER_MUTATION = `
  mutation UpdateUser($data: UserUpdateInput!) {
  updateUser(data: $data) {
    id
    name
    usageGoalMinutes
  }
}
`;