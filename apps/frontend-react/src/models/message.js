/**
 * @typedef {Object} Message
 * @property {number} id
 * @property {number} senderId
 * @property {number} recipientId
 * @property {string|null} subject
 * @property {string|null} body
 * @property {string} sentAt
 * @property {string|null} senderAddress
 * @property {string|null} clientMessageId
 * @property {string|null} readAt
 * @property {string|null} readerAddress
 * @property {string|null} deletedBySender
 * @property {string|null} deletedByRecipient
 * @property {string} [senderName]
 * @property {string} [recipientName]
 */

/**
 * @typedef {Object} MessagePage
 * @property {Message[]} messages
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 */

/**
 * @typedef {Object} ReplyRequest
 * @property {string} clientMessageId
 * @property {number} replyToId
 * @property {number} senderId
 * @property {number} recipientId
 * @property {string} [subject]
 * @property {string} [body]
 */

/**
 * @typedef {Object} CreateMessageRequest
 * @property {string} clientMessageId
 * @property {number} senderId
 * @property {number} recipientId
 * @property {string} [subject]
 * @property {string} [body]
 * @property {string} [senderAddress]
 */
