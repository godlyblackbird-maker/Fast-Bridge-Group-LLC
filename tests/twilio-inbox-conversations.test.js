const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeTwilioInboxConversations } = require('../twilio-inbox-conversations');

test('merges duplicate normalized-phone conversations into one visible thread with debug counters', () => {
  const result = mergeTwilioInboxConversations([
    {
      ownerEmail: 'admin@example.com',
      conversationKey: '+15551234567::MG-legacy',
      campaignName: 'Legacy Campaign',
      contactName: 'Taylor Seller',
      contactPhone: '+15551234567',
      platformIdentity: 'MG-legacy',
      searchText: 'older message body',
      lastMessageBody: 'Older inbound message',
      lastMessagePreview: 'Older inbound message',
      lastMessageAt: '2026-05-20T10:00:00.000Z',
      lastDirection: 'inbound',
      lastStatus: 'received',
      unreadCount: 1,
      hasInboundReplies: true,
      isBlocked: false
    },
    {
      ownerEmail: 'admin@example.com',
      conversationKey: '+15551234567::+18448755968',
      campaignName: 'Current Campaign',
      contactName: 'Taylor Seller',
      contactPhone: '+15551234567',
      platformIdentity: '+18448755968',
      searchText: 'newest message body',
      lastMessageBody: 'Newest outbound message',
      lastMessagePreview: 'Newest outbound message',
      lastMessageAt: '2026-05-21T14:30:00.000Z',
      lastDirection: 'outgoing',
      lastStatus: 'sent',
      unreadCount: 2,
      hasInboundReplies: false,
      isBlocked: false
    }
  ]);

  assert.equal(result.conversations.length, 1);
  assert.equal(result.debug.mergedConversationCount, 1);
  assert.equal(result.debug.mergedSourceConversationCount, 1);

  const mergedConversation = result.conversations[0];
  assert.equal(mergedConversation.conversationKey, '+15551234567::+18448755968');
  assert.equal(mergedConversation.lastMessageAt, '2026-05-21T14:30:00.000Z');
  assert.equal(mergedConversation.lastMessagePreview, 'Newest outbound message');
  assert.equal(mergedConversation.unreadCount, 3);
  assert.equal(mergedConversation.hasInboundReplies, true);
  assert.equal(mergedConversation.mergedSourceConversationCount, 2);
  assert.match(mergedConversation.searchText, /older message body/);
  assert.match(mergedConversation.searchText, /newest message body/);
});