(function () {
    const usersList = document.getElementById('messages-chat-users-list');
    const panelTitle = document.getElementById('messages-chat-panel-title');
    const panelSubtitle = document.getElementById('messages-chat-panel-subtitle');
    const thread = document.getElementById('messages-chat-thread');
    const form = document.getElementById('messages-chat-form');
    const input = document.getElementById('messages-chat-input');
    const sendButton = document.getElementById('messages-chat-send');
    const attachButton = document.getElementById('messages-chat-attach');
    const attachmentInput = document.getElementById('messages-chat-attachment-input');
    const editingBar = document.getElementById('messages-editing-bar');
    const editingMeta = document.getElementById('messages-editing-meta');
    const editingCancel = document.getElementById('messages-editing-cancel');
    const clearConversationButton = document.getElementById('messages-chat-clear');
    const status = document.getElementById('messages-chat-status');
    const pendingShare = document.getElementById('messages-pending-share');
    const pendingShareTitle = document.getElementById('messages-pending-share-title');
    const pendingShareMeta = document.getElementById('messages-pending-share-meta');
    const pendingShareClear = document.getElementById('messages-pending-share-clear');
    const pendingAttachments = document.getElementById('messages-pending-attachments');
    const bottomSection = document.getElementById('community-fbg-messaging-bottom');

    if (!usersList || !panelTitle || !panelSubtitle || !thread || !form || !input || !sendButton || !attachButton || !attachmentInput || !status) {
        return;
    }

    const authToken = String((window.getAuthToken && window.getAuthToken()) || localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
    const MESSAGES_TIMEZONE = 'America/Los_Angeles';
    const messageDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: MESSAGES_TIMEZONE,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
    const MESSAGE_REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
    const ISAAC_PREVIEW_USER_ID = 900001;
    const ISAAC_PREVIEW_FALLBACK_REACTION_USER_ID = 900099;
    const ISAAC_PREVIEW_ALLOWED_EMAILS = new Set([
        'isaac.haro@fastbridgegroupllc.com',
        'isaacs.hesed@fastbridgegroup.com',
        'isaacs.hesed@gmail.com'
    ]);

    let selectedUserId = null;
    let selectedUserRecord = null;
    let usersCache = [];
    let pollTimer = null;
    let pendingSharedProperty = null;
    let pendingAttachmentItems = [];
    let editingMessageState = null;

    function getCurrentMessagingUserContext() {
        const parseStoredObject = (key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || '{}');
            } catch (error) {
                return {};
            }
        };

        const user = parseStoredObject('user');
        const profile = parseStoredObject('userProfile');
        return {
            id: Number(user.id || profile.id) || 0,
            email: String(user.email || profile.email || '').trim().toLowerCase(),
            name: String(user.name || profile.name || '').trim(),
            role: String(user.role || profile.role || '').trim().toLowerCase()
        };
    }

    const currentMessagingUser = getCurrentMessagingUserContext();
    const currentMessagingUserId = currentMessagingUser.id;

    function canShowIsaacPreviewConversation() {
        const normalizedName = String(currentMessagingUser.name || '').trim().toLowerCase();
        return currentMessagingUser.role === 'admin'
            && (ISAAC_PREVIEW_ALLOWED_EMAILS.has(currentMessagingUser.email) || normalizedName === 'isaac haro');
    }

    function getPreviewReactionUserId() {
        return currentMessagingUserId || ISAAC_PREVIEW_FALLBACK_REACTION_USER_ID;
    }

    function isIsaacPreviewUserId(userId) {
        return Number.parseInt(String(userId || ''), 10) === ISAAC_PREVIEW_USER_ID;
    }

    function createIsaacPreviewUserRecord() {
        return {
            id: ISAAC_PREVIEW_USER_ID,
            name: 'Preview Contact Demo',
            email: 'preview.demo@fast.local',
            role: 'preview demo',
            unreadCount: 2,
            lastLogin: null,
            lastMessage: 'This is a fake thread for Isaac only. Test hover reactions here.',
            lastMessageAt: new Date(Date.now() - (2 * 60000)).toISOString()
        };
    }

    function buildIsaacPreviewMessages() {
        const previewReactionUserId = getPreviewReactionUserId();
        const previewContactUserId = ISAAC_PREVIEW_USER_ID;
        const now = Date.now();
        return [
            {
                id: 90000101,
                senderUserId: previewContactUserId,
                recipientUserId: previewReactionUserId,
                body: 'Hey Isaac, this is a fake preview contact so you can test the hover emoji reaction bubble without messaging a real FAST user.',
                reactions: [
                    { emoji: '👀', userId: previewContactUserId, createdAt: new Date(now - (44 * 60000)).toISOString() }
                ],
                createdAt: new Date(now - (46 * 60000)).toISOString(),
                editedAt: null,
                editWindowEndsAt: null,
                canEdit: false,
                readAt: new Date(now - (45 * 60000)).toISOString(),
                direction: 'incoming'
            },
            {
                id: 90000102,
                senderUserId: previewReactionUserId,
                recipientUserId: previewContactUserId,
                body: 'Perfect. I only want this preview thread visible to my Isaac admin session, and I want the reaction bubble to show on hover at the top-right edge.',
                reactions: [
                    { emoji: '🔥', userId: previewReactionUserId, createdAt: new Date(now - (31 * 60000)).toISOString() }
                ],
                createdAt: new Date(now - (34 * 60000)).toISOString(),
                editedAt: null,
                editWindowEndsAt: null,
                canEdit: false,
                readAt: new Date(now - (33 * 60000)).toISOString(),
                direction: 'outgoing'
            },
            {
                id: 90000103,
                senderUserId: previewContactUserId,
                recipientUserId: previewReactionUserId,
                body: 'That is exactly it. Hover any of these bubbles and click the emoji icon to see how reactions feel on a realistic-looking thread.',
                reactions: [
                    { emoji: '👍', userId: previewContactUserId, createdAt: new Date(now - (14 * 60000)).toISOString() },
                    { emoji: '❤️', userId: previewReactionUserId, createdAt: new Date(now - (12 * 60000)).toISOString() }
                ],
                createdAt: new Date(now - (16 * 60000)).toISOString(),
                editedAt: null,
                editWindowEndsAt: null,
                canEdit: false,
                readAt: new Date(now - (15 * 60000)).toISOString(),
                direction: 'incoming'
            }
        ];
    }

    let isaacPreviewMessages = buildIsaacPreviewMessages();

    function injectIsaacPreviewUser(users) {
        const safeUsers = Array.isArray(users) ? users.slice() : [];
        if (!canShowIsaacPreviewConversation()) {
            return safeUsers;
        }

        const previewUser = createIsaacPreviewUserRecord();
        return [previewUser, ...safeUsers.filter((user) => Number(user && user.id) !== ISAAC_PREVIEW_USER_ID)];
    }

    function toggleIsaacPreviewMessageReaction(message, emoji) {
        const normalizedMessageId = Number(message && message.id) || 0;
        const reactingUserId = getPreviewReactionUserId();
        isaacPreviewMessages = isaacPreviewMessages.map((entry) => {
            if (Number(entry && entry.id) !== normalizedMessageId) {
                return entry;
            }

            const currentReactions = Array.isArray(entry.reactions) ? entry.reactions.slice() : [];
            const existingIndex = currentReactions.findIndex((reaction) => String(reaction && reaction.emoji || '').trim() === emoji && Number(reaction && reaction.userId) === reactingUserId);
            if (existingIndex >= 0) {
                currentReactions.splice(existingIndex, 1);
            } else {
                currentReactions.push({
                    emoji,
                    userId: reactingUserId,
                    createdAt: new Date().toISOString()
                });
            }

            return {
                ...entry,
                reactions: currentReactions
            };
        });
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function parseMessageTimestamp(value) {
        if (value === null || value === undefined) {
            return null;
        }

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        if (typeof value === 'number') {
            const fromNumber = new Date(value);
            return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
        }

        const rawValue = String(value || '').trim();
        if (!rawValue) {
            return null;
        }

        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(rawValue)) {
            const sqliteUtc = new Date(`${rawValue.replace(' ', 'T')}Z`);
            return Number.isNaN(sqliteUtc.getTime()) ? null : sqliteUtc;
        }

        const parsed = new Date(rawValue);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function formatDateTime(value) {
        const date = parseMessageTimestamp(value);
        if (!date) {
            return '';
        }

        return messageDateTimeFormatter.format(date);
    }

    function getMessagePreviewText(value, fallback) {
        if (typeof window.getFastMessagePreviewText === 'function') {
            return window.getFastMessagePreviewText(value, fallback);
        }
        return String(value || fallback || '').trim();
    }

    function parseSharedPropertyMessage(value) {
        if (typeof window.parseFastSharedPropertyMessage === 'function') {
            return window.parseFastSharedPropertyMessage(value);
        }
        return null;
    }

    function parseMessageBundle(value) {
        if (typeof window.parseFastMessageBundle === 'function') {
            return window.parseFastMessageBundle(value);
        }
        return null;
    }

    function formatEditDeadline(value) {
        const date = parseMessageTimestamp(value);
        return date ? messageDateTimeFormatter.format(date) : 'about 1 minute';
    }

    function normalizeMessageReactionEntries(message) {
        const reactions = Array.isArray(message && message.reactions) ? message.reactions : [];
        return reactions
            .map((entry) => {
                const source = entry && typeof entry === 'object' ? entry : null;
                if (!source) {
                    return null;
                }

                const emoji = String(source.emoji || '').trim();
                const userId = Number(source.userId) || 0;
                if (!emoji || !userId) {
                    return null;
                }

                return {
                    emoji,
                    userId,
                    createdAt: String(source.createdAt || '').trim()
                };
            })
            .filter(Boolean);
    }

    function buildMessageReactionGroups(message) {
        const groups = new Map();
        normalizeMessageReactionEntries(message).forEach((entry) => {
            const existing = groups.get(entry.emoji) || {
                emoji: entry.emoji,
                count: 0,
                hasCurrentUser: false
            };
            existing.count += 1;
            if (currentMessagingUserId && entry.userId === currentMessagingUserId) {
                existing.hasCurrentUser = true;
            }
            groups.set(entry.emoji, existing);
        });

        return Array.from(groups.values()).sort((left, right) => {
            const leftIndex = MESSAGE_REACTION_OPTIONS.indexOf(left.emoji);
            const rightIndex = MESSAGE_REACTION_OPTIONS.indexOf(right.emoji);
            if (leftIndex !== rightIndex) {
                return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
            }
            return left.emoji.localeCompare(right.emoji, undefined, { sensitivity: 'base' });
        });
    }

    async function toggleMessageReaction(message, emoji) {
        if (!selectedUserId || !message || !Number(message.id) || !emoji) {
            return;
        }

        if (isIsaacPreviewUserId(selectedUserId)) {
            toggleIsaacPreviewMessageReaction(message, emoji);
            renderConversation(isaacPreviewMessages);
            setChatStatus('Updated the Isaac-only preview reaction locally.', false);
            return;
        }

        setChatStatus('Updating reaction...', false);
        await apiRequest(`/api/messages/conversations/${selectedUserId}/messages/${message.id}/reactions`, {
            method: 'PUT',
            body: JSON.stringify({ emoji })
        });
        await openConversation(selectedUserId, { focusInput: false, suppressUserReload: true });
        setChatStatus('', false);
    }

    function buildMessageReactionRow(message) {
        if (!message || !Number(message.id)) {
            return null;
        }
        const reactionGroups = buildMessageReactionGroups(message);

        const row = document.createElement('div');
        row.className = 'messages-chat-reaction-row';
        if (!reactionGroups.length) {
            row.classList.add('is-empty');
        }

        const list = document.createElement('div');
        list.className = 'messages-chat-reaction-list';
        reactionGroups.forEach((reaction) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'messages-chat-reaction-pill';
            if (reaction.hasCurrentUser) {
                button.classList.add('is-active');
            }
            button.innerHTML = `<span>${escapeHtml(reaction.emoji)}</span><strong>${reaction.count}</strong>`;
            button.setAttribute('aria-label', `${reaction.hasCurrentUser ? 'Remove' : 'Add'} ${reaction.emoji} reaction`);
            button.addEventListener('click', async () => {
                try {
                    await toggleMessageReaction(message, reaction.emoji);
                } catch (error) {
                    setChatStatus(String(error && error.message || 'Unable to update the reaction.'), true);
                }
            });
            list.appendChild(button);
        });
        row.appendChild(list);

        const menu = document.createElement('details');
        menu.className = 'messages-chat-reaction-menu';

        const trigger = document.createElement('summary');
        trigger.className = 'messages-chat-reaction-trigger';
        trigger.setAttribute('aria-label', 'Add emoji reaction');
    trigger.textContent = '😊';
        menu.appendChild(trigger);

        const picker = document.createElement('div');
        picker.className = 'messages-chat-reaction-picker';
        MESSAGE_REACTION_OPTIONS.forEach((emoji) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'messages-chat-reaction-option';
            option.textContent = emoji;
            option.setAttribute('aria-label', `React with ${emoji}`);
            option.addEventListener('click', async (event) => {
                event.preventDefault();
                menu.open = false;
                try {
                    await toggleMessageReaction(message, emoji);
                } catch (error) {
                    setChatStatus(String(error && error.message || 'Unable to update the reaction.'), true);
                }
            });
            picker.appendChild(option);
        });
        menu.appendChild(picker);
        row.appendChild(menu);

        return row;
    }

    function getEditableMessageText(message) {
        const body = String(message && message.body || '').trim();
        const bundle = parseMessageBundle(body);
        if (bundle) {
            return String(bundle.text || '').trim();
        }

        const shared = parseSharedPropertyMessage(body);
        if (shared) {
            return String(shared.introMessage || '').trim();
        }

        return body;
    }

    function buildEditedMessageBody(message, nextText) {
        const normalizedText = String(nextText || '').trim();
        const body = String(message && message.body || '').trim();
        const bundle = parseMessageBundle(body);
        if (bundle && typeof window.buildFastMessageBundle === 'function') {
            return window.buildFastMessageBundle({
                text: normalizedText,
                sharedProperty: bundle.sharedProperty || null,
                attachments: bundle.attachments || [],
                senderLike: null
            });
        }

        const shared = parseSharedPropertyMessage(body);
        if (shared && typeof window.buildFastSharedPropertyMessage === 'function') {
            return window.buildFastSharedPropertyMessage(shared.property, normalizedText, null);
        }

        return normalizedText;
    }

    function canQueueAttachments() {
        return Boolean(authToken) && usersCache.length > 0 && !editingMessageState;
    }

    function updateComposerModeUi() {
        if (editingBar) {
            if (editingMessageState) {
                editingBar.classList.add('active');
                editingBar.removeAttribute('hidden');
            } else {
                editingBar.classList.remove('active');
                editingBar.setAttribute('hidden', 'hidden');
            }
        }

        if (editingMeta) {
            editingMeta.textContent = editingMessageState
                ? `Save before ${formatEditDeadline(editingMessageState.editWindowEndsAt)}.`
                : 'You have 1 minute from send time to update a message.';
        }

        attachButton.disabled = !canQueueAttachments();
        sendButton.setAttribute('aria-label', editingMessageState ? 'Save edited message' : 'Send message');
        sendButton.setAttribute('title', editingMessageState ? 'Save edited message' : 'Send message');
    }

    function cancelMessageEdit(options) {
        const config = options && typeof options === 'object' ? options : {};
        editingMessageState = null;
        updateComposerModeUi();
        if (!config.preserveInput) {
            input.value = '';
        }
    }

    function startEditingMessage(message) {
        if (!message || !message.canEdit || message.direction !== 'outgoing') {
            return;
        }

        clearPendingSharedProperty();
        pendingAttachmentItems = [];
        renderPendingAttachments();

        editingMessageState = {
            id: Number(message.id) || 0,
            body: String(message.body || '').trim(),
            editWindowEndsAt: message.editWindowEndsAt || '',
            message
        };
        input.value = getEditableMessageText(message);
        updateComposerModeUi();
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        setChatStatus('Editing message...', false);
    }

    function formatFileSize(bytes) {
        const value = Math.max(Number(bytes) || 0, 0);
        if (value >= 1024 * 1024) {
            return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
        }
        if (value >= 1024) {
            return `${Math.round(value / 1024)} KB`;
        }
        return `${value} B`;
    }

    function getAttachmentFileName(attachment) {
        return String(attachment && attachment.fileName || '').trim();
    }

    function getAttachmentFileType(attachment) {
        return String(attachment && attachment.fileType || '').trim().toLowerCase();
    }

    function getAttachmentExtension(attachment) {
        const match = getAttachmentFileName(attachment).match(/(\.[^.]+)$/);
        return match ? match[1].toLowerCase() : '';
    }

    function isImageAttachment(attachment) {
        return /^image\//i.test(getAttachmentFileType(attachment))
            || /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif|jfif|tiff?)$/i.test(getAttachmentFileName(attachment));
    }

    function isPdfAttachment(attachment) {
        return getAttachmentFileType(attachment) === 'application/pdf' || getAttachmentExtension(attachment) === '.pdf';
    }

    function isVideoAttachment(attachment) {
        return /^video\//i.test(getAttachmentFileType(attachment))
            || /\.(mp4|mov|avi|webm)$/i.test(getAttachmentFileName(attachment));
    }

    function isAudioAttachment(attachment) {
        return /^audio\//i.test(getAttachmentFileType(attachment))
            || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(getAttachmentFileName(attachment));
    }

    function getAttachmentKind(attachment) {
        if (isImageAttachment(attachment)) return 'image';
        if (isPdfAttachment(attachment)) return 'pdf';
        if (isVideoAttachment(attachment)) return 'video';
        if (isAudioAttachment(attachment)) return 'audio';
        if (/\.(xls|xlsx|csv)$/i.test(getAttachmentExtension(attachment))) return 'spreadsheet';
        if (/\.(doc|docx|rtf|txt|md)$/i.test(getAttachmentExtension(attachment))) return 'document';
        if (/\.(ppt|pptx)$/i.test(getAttachmentExtension(attachment))) return 'presentation';
        if (/\.(zip|rar|7z)$/i.test(getAttachmentExtension(attachment))) return 'archive';
        return 'file';
    }

    function getAttachmentBadgeLabel(attachment) {
        const extension = getAttachmentExtension(attachment).replace('.', '').toUpperCase();
        if (extension) {
            return extension.length > 6 ? extension.slice(0, 6) : extension;
        }

        const kind = getAttachmentKind(attachment);
        if (kind === 'spreadsheet') return 'SHEET';
        if (kind === 'presentation') return 'SLIDE';
        return kind.toUpperCase();
    }

    function buildAttachmentBadge(attachment) {
        const badge = document.createElement('span');
        badge.className = `messages-attachment-badge kind-${getAttachmentKind(attachment)}`;
        badge.textContent = getAttachmentBadgeLabel(attachment);
        return badge;
    }

    function buildAttachmentPreviewNode(attachment) {
        if (isImageAttachment(attachment)) {
            const previewLink = document.createElement('a');
            previewLink.className = 'messages-chat-attachment-link';
            previewLink.href = attachment.downloadPath || attachment.contentPath;
            previewLink.target = '_blank';
            previewLink.rel = 'noopener noreferrer';

            const image = document.createElement('img');
            image.className = 'messages-chat-attachment-preview';
            image.src = attachment.contentPath;
            image.alt = attachment.fileName || 'Attachment preview';
            previewLink.appendChild(image);
            return previewLink;
        }

        if (isPdfAttachment(attachment)) {
            const frame = document.createElement('iframe');
            frame.className = 'messages-chat-attachment-embed';
            frame.src = attachment.contentPath;
            frame.loading = 'lazy';
            frame.title = attachment.fileName || 'PDF attachment preview';
            return frame;
        }

        if (isVideoAttachment(attachment)) {
            const video = document.createElement('video');
            video.className = 'messages-chat-attachment-video';
            video.src = attachment.contentPath;
            video.controls = true;
            video.preload = 'metadata';
            return video;
        }

        if (isAudioAttachment(attachment)) {
            const audio = document.createElement('audio');
            audio.className = 'messages-chat-attachment-audio';
            audio.src = attachment.contentPath;
            audio.controls = true;
            audio.preload = 'metadata';
            return audio;
        }

        return null;
    }

    function buildMessageAttachmentPayload(documentItem) {
        const documentId = String(documentItem && documentItem.id || '').trim();
        const basePath = `/api/messages/attachments/${encodeURIComponent(documentId)}/content`;
        return {
            id: documentId,
            fileName: String(documentItem && documentItem.fileName || 'Attachment').trim() || 'Attachment',
            fileType: String(documentItem && documentItem.fileType || '').trim(),
            fileSize: Math.max(Number(documentItem && documentItem.fileSize) || 0, 0),
            contentPath: basePath,
            downloadPath: `${basePath}?download=1`,
            kind: getAttachmentKind(documentItem)
        };
    }

    function renderPendingAttachments() {
        pendingAttachments.innerHTML = '';
        if (!pendingAttachmentItems.length) {
            pendingAttachments.classList.remove('active');
            pendingAttachments.setAttribute('hidden', 'hidden');
            return;
        }

        pendingAttachments.classList.add('active');
        pendingAttachments.removeAttribute('hidden');

        pendingAttachmentItems.forEach((attachment, index) => {
            const chip = document.createElement('div');
            chip.className = 'messages-pending-attachment-chip';
            chip.innerHTML = `
                <div class="messages-pending-attachment-copy">
                    <div class="messages-pending-attachment-top">
                        <p class="messages-pending-attachment-name">${escapeHtml(attachment.fileName || 'Attachment')}</p>
                    </div>
                    <p class="messages-pending-attachment-meta">${escapeHtml(formatFileSize(attachment.fileSize))}${attachment.fileType ? ` • ${escapeHtml(attachment.fileType)}` : ''}</p>
                </div>
            `;
            const pendingTop = chip.querySelector('.messages-pending-attachment-top');
            if (pendingTop) {
                pendingTop.prepend(buildAttachmentBadge(attachment));
            }

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'messages-pending-attachment-remove';
            removeButton.setAttribute('aria-label', `Remove ${attachment.fileName || 'attachment'}`);
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => {
                pendingAttachmentItems = pendingAttachmentItems.filter((_, pendingIndex) => pendingIndex !== index);
                renderPendingAttachments();
            });

            chip.appendChild(removeButton);
            pendingAttachments.appendChild(chip);
        });
    }

    function openSharedPropertyDetail(messageBody) {
        const sharedMessage = parseSharedPropertyMessage(messageBody);
        if (!sharedMessage || !sharedMessage.property) {
            return;
        }

        const serializedDetail = JSON.stringify(sharedMessage.property);
        try {
            localStorage.setItem('selectedPropertyDetail', serializedDetail);
        } catch (error) {
            // Ignore localStorage failures and try sessionStorage.
        }
        try {
            sessionStorage.setItem('selectedPropertyDetail', serializedDetail);
        } catch (error) {
            // Ignore sessionStorage failures.
        }
        window.location.href = 'property-details.html';
    }

    function getPersistedSelectedPropertyDetail() {
        const candidates = [
            () => localStorage.getItem('selectedPropertyDetail'),
            () => sessionStorage.getItem('selectedPropertyDetail')
        ];

        for (const reader of candidates) {
            try {
                const rawValue = reader();
                if (!rawValue) {
                    continue;
                }
                const parsedValue = JSON.parse(rawValue);
                if (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
                    return parsedValue;
                }
            } catch (error) {
                // Ignore storage read failures.
            }
        }

        return null;
    }

    function renderPendingSharedProperty() {
        if (!pendingSharedProperty || typeof pendingSharedProperty !== 'object') {
            pendingShare.classList.remove('active');
            pendingShare.setAttribute('hidden', 'hidden');
            return;
        }

        pendingShare.classList.add('active');
        pendingShare.removeAttribute('hidden');
        pendingShareTitle.textContent = String(pendingSharedProperty.address || pendingSharedProperty.propertyCover || 'Property').trim() || 'Property';
        pendingShareMeta.textContent = [
            String(pendingSharedProperty.listPrice || '').trim(),
            String(pendingSharedProperty.marketInfo || '').trim(),
            String(pendingSharedProperty.propertyDetails || '').trim()
        ].filter(Boolean).join(' • ') || 'This property will send as a clickable item in the thread.';
    }

    function syncPendingSharedPropertyFromUrl() {
        const url = new URL(window.location.href);
        if (url.searchParams.get('shareProperty') !== '1') {
            return;
        }

        const detail = getPersistedSelectedPropertyDetail();
        if (!detail) {
            return;
        }

        pendingSharedProperty = detail;
        renderPendingSharedProperty();
        setChatStatus('Property link ready. Pick a teammate and press send.', false);
    }

    function clearPendingSharedProperty() {
        pendingSharedProperty = null;
        renderPendingSharedProperty();
        const url = new URL(window.location.href);
        if (url.searchParams.get('shareProperty') === '1') {
            url.searchParams.delete('shareProperty');
            window.history.replaceState({}, '', url.toString());
        }
    }

    async function uploadAttachmentFile(file) {
        if (!authToken) {
            throw new Error('Sign in again before uploading attachments.');
        }

        const formData = new FormData();
        formData.append('scope', 'fbg-message');
        formData.append('contextKey', selectedUserId ? `conversation-${selectedUserId}` : 'draft');
        formData.append('file', file);

        const response = await fetch('/api/user-uploads', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authToken}`
            },
            body: formData
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || 'Unable to upload the selected file.');
        }

        return buildMessageAttachmentPayload(payload && payload.document);
    }

    async function queueAttachmentFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) {
            return;
        }

        setChatStatus(files.length === 1 ? 'Uploading attachment...' : `Uploading ${files.length} attachments...`, false);
        attachButton.disabled = true;
        sendButton.disabled = true;

        try {
            const uploadedAttachments = [];
            for (const file of files) {
                uploadedAttachments.push(await uploadAttachmentFile(file));
            }
            pendingAttachmentItems = [...pendingAttachmentItems, ...uploadedAttachments];
            renderPendingAttachments();
            setChatStatus(
                selectedUserId
                    ? (uploadedAttachments.length === 1 ? 'Attachment ready to send.' : `${uploadedAttachments.length} attachments ready to send.`)
                    : (uploadedAttachments.length === 1 ? 'Attachment ready. Pick a teammate and press send.' : `${uploadedAttachments.length} attachments ready. Pick a teammate and press send.`),
                false
            );
        } finally {
            attachButton.disabled = !canQueueAttachments();
            sendButton.disabled = !selectedUserId;
            attachmentInput.value = '';
        }
    }

    function buildSharedPropertyCard(sharedMessage, messageBody) {
        const property = sharedMessage && sharedMessage.property && typeof sharedMessage.property === 'object' ? sharedMessage.property : {};
        const wrapper = document.createElement('div');
        wrapper.className = 'messages-shared-property-card';

        const linkButton = document.createElement('button');
        linkButton.type = 'button';
        linkButton.className = 'messages-shared-property-link';
        linkButton.addEventListener('click', () => {
            openSharedPropertyDetail(messageBody);
        });

        const label = document.createElement('span');
        label.className = 'messages-shared-property-label';
        label.textContent = 'Shared Property';
        linkButton.appendChild(label);

        const title = document.createElement('h4');
        title.className = 'messages-shared-property-title';
        title.textContent = property.address || property.propertyCover || 'Property';
        linkButton.appendChild(title);

        const meta = document.createElement('p');
        meta.className = 'messages-shared-property-meta';
        meta.textContent = [property.listPrice || '', property.marketInfo || ''].filter(Boolean).join(' • ') || 'Open this property in FAST.';
        linkButton.appendChild(meta);

        if (property.propertyDetails) {
            const details = document.createElement('p');
            details.className = 'messages-shared-property-details';
            details.textContent = property.propertyDetails;
            linkButton.appendChild(details);
        }

        if (sharedMessage && sharedMessage.introMessage) {
            const note = document.createElement('p');
            note.className = 'messages-shared-property-note';
            note.textContent = sharedMessage.introMessage;
            linkButton.appendChild(note);
        }

        wrapper.appendChild(linkButton);
        return wrapper;
    }

    function setChatStatus(message, isError) {
        status.textContent = String(message || '').trim();
        status.style.color = isError ? 'var(--danger)' : 'var(--text-secondary)';
    }

    function setComposerEnabled(enabled) {
        const nextEnabled = Boolean(enabled);
        input.disabled = !nextEnabled;
        attachButton.disabled = !nextEnabled || !canQueueAttachments();
        sendButton.disabled = !nextEnabled;
        if (clearConversationButton) {
            clearConversationButton.disabled = true;
        }
        updateComposerModeUi();
    }

    async function apiRequest(url, options) {
        if (!authToken) {
            throw new Error('Sign in again before using FBG Messages.');
        }

        const response = await fetch(url, {
            ...(options || {}),
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                ...((options && options.headers) || {})
            }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || 'Request failed.');
        }
        return payload;
    }

    function publishUnreadState(users) {
        const unreadTotal = (Array.isArray(users) ? users : []).reduce((total, user) => total + Math.max(0, Number(user && user.unreadCount) || 0), 0);
        window.dispatchEvent(new CustomEvent('fbgmessages:unreadchange', {
            detail: {
                hasUnread: unreadTotal > 0,
                unreadTotal
            }
        }));
    }

    function renderUsers(users) {
        usersCache = Array.isArray(users) ? users.slice() : [];
        publishUnreadState(usersCache);
        usersList.innerHTML = '';

        if (usersCache.length === 0) {
            usersList.innerHTML = '<p class="messages-chat-empty">No other users are available yet.</p>';
            return;
        }

        usersCache.forEach((user) => {
            const labelSource = String(user.name || user.email || 'U').trim();
            const initials = labelSource.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'U';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'messages-chat-user-btn';
            if (Number(user.id) === Number(selectedUserId)) {
                button.classList.add('active');
            }
            button.dataset.userId = String(user.id || '');
            button.innerHTML = `
                <span class="messages-chat-user-avatar">${escapeHtml(initials)}</span>
                <div class="messages-chat-user-copy">
                    <div class="messages-chat-user-top">
                        <span class="messages-chat-user-name">${escapeHtml(user.name || user.email || 'User')}</span>
                        ${user.unreadCount > 0 ? `<span class="messages-chat-unread">${Math.min(Number(user.unreadCount) || 0, 99)}</span>` : `<span class="messages-chat-time">${escapeHtml(formatDateTime(user.lastMessageAt || user.lastLogin || ''))}</span>`}
                    </div>
                    <div class="messages-chat-user-email">${escapeHtml(user.email || '')}</div>
                    <div class="messages-chat-user-meta">
                        <span class="messages-chat-role">${escapeHtml(user.role || 'user')}</span>
                        <span class="messages-chat-time">${escapeHtml(formatDateTime(user.lastMessageAt || user.lastLogin || ''))}</span>
                    </div>
                    <div class="messages-chat-user-preview">${escapeHtml(getMessagePreviewText(user.lastMessage, 'No messages yet. Start the conversation.'))}</div>
                </div>
            `;
            button.addEventListener('click', () => {
                openConversation(user.id, { focusInput: true });
            });
            usersList.appendChild(button);
        });
    }

    function renderConversation(messages) {
        const items = Array.isArray(messages) ? messages : [];
        thread.innerHTML = '';

        if (items.length === 0) {
            thread.innerHTML = '<p class="messages-chat-placeholder">No messages yet. Start the conversation here.</p>';
            return;
        }

        items.forEach((message) => {
            const article = document.createElement('article');
            article.className = `messages-chat-bubble ${message.direction === 'outgoing' ? 'outgoing' : 'incoming'}`;
            if (message.direction === 'outgoing' && message.canEdit) {
                article.classList.add('can-edit');
                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'messages-chat-bubble-edit';
                editButton.textContent = 'Edit?';
                editButton.addEventListener('click', () => {
                    startEditingMessage(message);
                });
                article.appendChild(editButton);
            }

            const messageBundle = parseMessageBundle(message.body || '');
            const sharedMessage = parseSharedPropertyMessage(message.body || '');

            const appendMeta = () => {
                const meta = document.createElement('div');
                meta.className = 'messages-chat-bubble-meta';
                meta.textContent = `${formatDateTime(message.createdAt || '')}${message.editedAt ? ' • edited' : ''}`;
                article.appendChild(meta);

                const reactions = buildMessageReactionRow(message);
                if (reactions) {
                    article.appendChild(reactions);
                }
            };

            if (messageBundle) {
                if (messageBundle.text) {
                    const textNode = document.createElement('div');
                    textNode.className = 'messages-chat-bubble-text';
                    textNode.textContent = messageBundle.text;
                    article.appendChild(textNode);
                }

                if (messageBundle.sharedProperty) {
                    article.classList.add('is-shared-property');
                    article.appendChild(buildSharedPropertyCard({ property: messageBundle.sharedProperty, introMessage: '' }, message.body || ''));
                }

                if (Array.isArray(messageBundle.attachments) && messageBundle.attachments.length > 0) {
                    const attachmentsWrap = document.createElement('div');
                    attachmentsWrap.className = 'messages-chat-attachments';

                    messageBundle.attachments.forEach((attachment) => {
                        const item = document.createElement('div');
                        const attachmentKind = getAttachmentKind(attachment);
                        item.className = `messages-chat-attachment is-${attachmentKind}${attachmentKind === 'image' ? ' is-image' : ''}`;

                        const previewNode = buildAttachmentPreviewNode(attachment);
                        if (previewNode) {
                            item.appendChild(previewNode);
                        }

                        const link = document.createElement('a');
                        link.className = 'messages-chat-attachment-link';
                        link.href = attachment.downloadPath || attachment.contentPath;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.innerHTML = `
                            <div class="messages-chat-attachment-copy">
                                <div class="messages-chat-attachment-head">
                                    <strong>${escapeHtml(attachment.fileName || 'Attachment')}</strong>
                                </div>
                                <span>${escapeHtml(formatFileSize(attachment.fileSize))}${attachment.fileType ? ` • ${escapeHtml(attachment.fileType)}` : ''}</span>
                            </div>
                        `;
                        const attachmentHead = link.querySelector('.messages-chat-attachment-head');
                        if (attachmentHead) {
                            attachmentHead.prepend(buildAttachmentBadge(attachment));
                        }
                        item.appendChild(link);
                        attachmentsWrap.appendChild(item);
                    });

                    article.appendChild(attachmentsWrap);
                }

                appendMeta();
            } else if (sharedMessage) {
                article.classList.add('is-shared-property');
                article.appendChild(buildSharedPropertyCard(sharedMessage, message.body || ''));
                appendMeta();
            } else {
                const textNode = document.createElement('div');
                textNode.className = 'messages-chat-bubble-text';
                textNode.textContent = message.body || '';
                article.appendChild(textNode);
                appendMeta();
            }

            thread.appendChild(article);
        });

        thread.scrollTop = thread.scrollHeight;
    }

    async function loadUsers(options) {
        const config = options && typeof options === 'object' ? options : {};
        const payload = await apiRequest('/api/messages/users');
        renderUsers(injectIsaacPreviewUser(payload.users || []));

        if (!selectedUserId && usersCache.length > 0) {
            await openConversation(usersCache[0].id, { focusInput: false, suppressUserReload: true });
            return;
        }

        if (!config.preserveSelection && selectedUserId && !usersCache.some((item) => Number(item.id) === Number(selectedUserId))) {
            selectedUserId = null;
            selectedUserRecord = null;
            setComposerEnabled(false);
        }
    }

    async function openConversation(userId, options) {
        const config = options && typeof options === 'object' ? options : {};
        const normalizedUserId = Number.parseInt(String(userId || ''), 10);
        if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
            return;
        }

        if (selectedUserId && Number(selectedUserId) !== normalizedUserId && pendingAttachmentItems.length > 0) {
            pendingAttachmentItems = [];
            renderPendingAttachments();
        }

        if (selectedUserId && Number(selectedUserId) !== normalizedUserId) {
            cancelMessageEdit({ preserveInput: false });
        }

        selectedUserId = normalizedUserId;
        if (!config.suppressUserReload) {
            renderUsers(usersCache);
        }

        if (isIsaacPreviewUserId(normalizedUserId) && canShowIsaacPreviewConversation()) {
            selectedUserRecord = createIsaacPreviewUserRecord();
            panelTitle.textContent = selectedUserRecord.name;
            panelSubtitle.textContent = `${selectedUserRecord.email} • ${selectedUserRecord.role}`;
            clearPendingSharedProperty();
            pendingAttachmentItems = [];
            renderPendingAttachments();
            cancelMessageEdit({ preserveInput: false });
            setComposerEnabled(false);
            renderConversation(isaacPreviewMessages);
            setChatStatus('Preview only. This fake contact and messages are visible only to Isaac and are not saved anywhere.', false);
            return;
        }

        setChatStatus('Loading conversation...', false);
        const payload = await apiRequest(`/api/messages/conversations/${normalizedUserId}`);
        selectedUserRecord = payload.otherUser || null;

        panelTitle.textContent = selectedUserRecord && selectedUserRecord.name ? selectedUserRecord.name : 'Conversation';
        panelSubtitle.textContent = selectedUserRecord && selectedUserRecord.email
            ? `${selectedUserRecord.email} • ${selectedUserRecord.role || 'user'}`
            : 'Direct messages inside FAST.';

        setComposerEnabled(true);
        renderConversation(payload.messages || []);
        if (editingMessageState && !Array.isArray(payload.messages || []).some((message) => Number(message.id) === Number(editingMessageState.id) && message.canEdit)) {
            cancelMessageEdit({ preserveInput: false });
        }
        setChatStatus('', false);
        await loadUsers({ preserveSelection: true });

        if (config.focusInput) {
            input.focus();
        }
    }

    async function sendMessage() {
        if (!selectedUserId) {
            return;
        }

        if (isIsaacPreviewUserId(selectedUserId)) {
            setChatStatus('This is an Isaac-only preview thread. It does not send or save messages.', true);
            return;
        }

        const isEditing = Boolean(editingMessageState && editingMessageState.id);
        const hadPendingProperty = Boolean(pendingSharedProperty);
        const hasPendingAttachments = pendingAttachmentItems.length > 0;
        const noteBody = String(input.value || '').trim();
        let body = noteBody;

        if (isEditing) {
            body = buildEditedMessageBody(editingMessageState.message, noteBody);
        } else if ((hadPendingProperty || hasPendingAttachments) && typeof window.buildFastMessageBundle === 'function') {
            body = window.buildFastMessageBundle({
                text: noteBody,
                sharedProperty: hadPendingProperty ? pendingSharedProperty : null,
                attachments: hasPendingAttachments ? pendingAttachmentItems : [],
                senderLike: null
            });
        } else if (hadPendingProperty && typeof window.buildFastSharedPropertyMessage === 'function') {
            body = window.buildFastSharedPropertyMessage(pendingSharedProperty, noteBody, null);
        }

        if (!body) {
            setChatStatus(isEditing ? 'Type the updated message before saving.' : 'Type a message, add an attachment, or attach a property before sending.', true);
            return;
        }

        setChatStatus(isEditing ? 'Saving edit...' : 'Sending message...', false);
        sendButton.disabled = true;
        attachButton.disabled = true;

        try {
            if (isEditing) {
                await apiRequest(`/api/messages/conversations/${selectedUserId}/messages/${editingMessageState.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ body })
                });
            } else {
                await apiRequest(`/api/messages/conversations/${selectedUserId}`, {
                    method: 'POST',
                    body: JSON.stringify({ body })
                });
            }

            input.value = '';
            if (isEditing) {
                cancelMessageEdit({ preserveInput: false });
            } else {
                clearPendingSharedProperty();
                pendingAttachmentItems = [];
                renderPendingAttachments();
            }
            await openConversation(selectedUserId, { focusInput: true });
            setChatStatus(isEditing ? 'Message updated.' : 'Message sent.', false);
        } finally {
            sendButton.disabled = false;
            attachButton.disabled = Boolean(editingMessageState);
            updateComposerModeUi();
        }
    }

    function startPolling() {
        if (pollTimer) {
            window.clearInterval(pollTimer);
        }

        pollTimer = window.setInterval(async () => {
            if (document.hidden) {
                return;
            }

            try {
                if (selectedUserId) {
                    await openConversation(selectedUserId, { suppressUserReload: true });
                } else {
                    await loadUsers({ preserveSelection: true });
                }
            } catch (error) {
                // Ignore background poll failures.
            }
        }, 8000);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            await sendMessage();
        } catch (error) {
            setChatStatus(String(error && error.message || 'Unable to send the message.'), true);
        }
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    attachButton.addEventListener('click', () => {
        attachmentInput.click();
    });

    attachmentInput.addEventListener('change', async () => {
        try {
            await queueAttachmentFiles(attachmentInput.files);
        } catch (error) {
            setChatStatus(String(error && error.message || 'Unable to upload the selected files.'), true);
        }
    });

    if (clearConversationButton) {
        clearConversationButton.hidden = true;
        clearConversationButton.setAttribute('aria-hidden', 'true');
    }

    if (editingCancel) {
        editingCancel.addEventListener('click', () => {
            cancelMessageEdit({ preserveInput: false });
            setChatStatus('', false);
        });
    }

    if (pendingShareClear) {
        pendingShareClear.addEventListener('click', () => {
            clearPendingSharedProperty();
            setChatStatus('', false);
        });
    }

    if (authToken) {
        loadUsers()
            .then(startPolling)
            .catch((error) => {
                usersList.innerHTML = `<p class="messages-chat-empty">${escapeHtml(String(error && error.message || 'Unable to load users.'))}</p>`;
                setChatStatus(String(error && error.message || 'Unable to load conversations.'), true);
            });
    } else {
        usersList.innerHTML = '<p class="messages-chat-empty">Sign in again to use direct messages.</p>';
        setChatStatus('Sign in again to use direct messages.', true);
    }

    syncPendingSharedPropertyFromUrl();
    renderPendingAttachments();
    updateComposerModeUi();

    const panelRequest = new URLSearchParams(window.location.search || '').get('panel');
    if (panelRequest === 'fbg-messaging' && bottomSection) {
        window.requestAnimationFrame(() => {
            bottomSection.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
    }
})();