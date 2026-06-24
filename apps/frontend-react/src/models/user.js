/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string|null} deviceAddress
 * @property {string|null} dateCreated
 * @property {string|null} lastLogin
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} username
 * @property {string} token
 * @property {string|null} refreshToken
 * @property {number|null} userId
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} [username]
 * @property {string} [email]
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} username
 * @property {string} token
 * @property {string} [refreshToken]
 */
