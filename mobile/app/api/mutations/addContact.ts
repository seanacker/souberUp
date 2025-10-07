export const ADD_CONTACT_MUTATION = `
  mutation AddContact($mobileNumber: AddContactInput!) {
  addContact(mobileNumber: $mobileNumber) {
    id
    name
    usageGoalMinutes
  }
}
`;