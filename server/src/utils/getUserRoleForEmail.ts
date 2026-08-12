import {
  COMPANY_DOMAIN,
  USER_ROLES,
  type UserRole,
} from "@/utils/constants.ts";

/**
 * The role assigned to a newly registered email: `admin` for company
 * addresses, `user` otherwise. Centralised here so the rule lives in one place.
 *
 * @param {string} email - The email being registered.
 * @returns {UserRole} The role for that email.
 */
const getUserRoleForEmail = (email: string): UserRole => {
  return email.endsWith(COMPANY_DOMAIN) ? USER_ROLES.ADMIN : USER_ROLES.USER;
};

export { getUserRoleForEmail };
