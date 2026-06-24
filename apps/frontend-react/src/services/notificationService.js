let _lastChecked = new Date();

export function resetLastChecked() {
  _lastChecked = new Date();
}

/**
 * Compares newly fetched inbox messages against the last-checked timestamp
 * and returns any messages that arrived since then.
 *
 * @param {number} userId
 * @param {Function} getInboxFn  - (recipientId, page, limit) => Promise<MessagePage>
 * @returns {Promise<{newMessages: Message[], total: number}>}
 */
export async function checkForNewMessages(userId, getInboxFn) {
  const since = _lastChecked;
  _lastChecked = new Date();
  const result = await getInboxFn(userId, 1, 10);
  const newMessages = result.messages.filter(
    (m) => !m.readAt && new Date(m.sentAt) > since,
  );
  return { newMessages, total: result.total };
}
