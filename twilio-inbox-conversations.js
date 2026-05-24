function mergeTwilioInboxConversations(conversations) {
  const source = Array.isArray(conversations) ? conversations : [];
  const mergedConversationMap = new Map();

  source.forEach((conversation) => {
    const normalizedConversation = conversation && typeof conversation === 'object' ? conversation : {};
    const normalizedContactPhone = String(normalizedConversation.contactPhone || '').trim();
    const mergeKey = normalizedContactPhone || String(normalizedConversation.conversationKey || '').trim();
    const existing = mergedConversationMap.get(mergeKey);

    if (!existing) {
      mergedConversationMap.set(mergeKey, {
        ...normalizedConversation,
        contactPhone: normalizedContactPhone,
        mergedSourceConversationCount: Math.max(1, Number(normalizedConversation.mergedSourceConversationCount) || 1),
        searchText: String(normalizedConversation.searchText || '').trim()
      });
      return;
    }

    const existingTime = Date.parse(String(existing.lastMessageAt || '')) || 0;
    const nextTime = Date.parse(String(normalizedConversation.lastMessageAt || '')) || 0;
    const preferredConversation = nextTime >= existingTime ? normalizedConversation : existing;
    const mergedSourceConversationCount = Math.max(1, Number(existing.mergedSourceConversationCount) || 1)
      + Math.max(1, Number(normalizedConversation.mergedSourceConversationCount) || 1);

    mergedConversationMap.set(mergeKey, {
      ...existing,
      ...preferredConversation,
      contactPhone: normalizedContactPhone || String(preferredConversation.contactPhone || '').trim(),
      mergedSourceConversationCount,
      unreadCount: Math.max(0, Number(existing.unreadCount) || 0) + Math.max(0, Number(normalizedConversation.unreadCount) || 0),
      hasInboundReplies: Boolean(existing.hasInboundReplies || normalizedConversation.hasInboundReplies),
      isBlocked: Boolean(existing.isBlocked || normalizedConversation.isBlocked),
      searchText: [existing.searchText, normalizedConversation.searchText].filter(Boolean).join(' ').trim()
    });
  });

  const mergedConversations = Array.from(mergedConversationMap.values()).sort((left, right) => {
    const rightTime = Date.parse(String(right.lastMessageAt || '')) || 0;
    const leftTime = Date.parse(String(left.lastMessageAt || '')) || 0;
    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }
    return String(left.contactName || '').localeCompare(String(right.contactName || ''), undefined, { sensitivity: 'base' });
  });

  return {
    conversations: mergedConversations,
    debug: {
      mergedConversationCount: mergedConversations.filter((conversation) => Number(conversation.mergedSourceConversationCount) > 1).length,
      mergedSourceConversationCount: mergedConversations.reduce((total, conversation) => {
        return total + Math.max(0, (Number(conversation.mergedSourceConversationCount) || 1) - 1);
      }, 0)
    }
  };
}

module.exports = {
  mergeTwilioInboxConversations
};