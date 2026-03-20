/**
 * Main dashboard script
 */
(function() {
'use strict';

const CALENDAR_EVENTS_KEY = 'dashboardCalendarEvents';
    const AGENT_NOTES_KEY = 'agentNotesByUser';
    const TODO_GOALS_KEY = 'personalTodoGoalsByUser';
    const DEALS_CLICKED_KEY = 'clickedDealsByUser';
    const OFFER_DOCUMENTS_KEY = 'offerDocumentsByUser';
    const IA_CALCULATOR_STATE_KEY = 'iaCalculatorStateByUser';
    const PIQ_AGENT_STATUS_KEY = 'piqAgentStatusByUser';
    const CLOSED_DEALS_KEY = 'closedDealsByUser';
    const MLS_LISTING_NOTIFICATIONS_KEY = 'mlsListingNotificationsByUser';
    const PROPERTY_ASSIGNMENTS_KEY = 'propertyAssignments';
    const STRIKE_ZONE_CSV_PATH = 'Apprasial%20Rules/SoCal-Buy-_-strike-zone-2024-UPDATE.csv';
    const DASHBOARD_NOTIFICATION_SOUND_PATH = 'Sound FX/Notification sound effect.wav';
    const SOUND_SETTINGS_KEY = 'dashboardSoundSettings';
    const USER_SETTINGS_KEY = 'dashboardSettingsByUser';
    const USER_THEME_KEY = 'dashboardThemeByUser';
    const ANALYTICS_PROFIT_GOAL_KEY = 'analyticsProfitGoalByUser';
    const ANALYTICS_PROFIT_WINDOW_KEY = 'analyticsProfitWindowByUser';
    const PLANNER_DRAFT_KEY = 'plannerDraftByUser';
    const LEGAL_FOOTER_LINKS = [
        { id: 'mls-data-disclaimer', label: 'MLS Data Disclaimer' },
        { id: 'idx-vow-disclaimer', label: 'IDX/VOW Disclaimer' },
        { id: 'equal-housing', label: 'Equal Housing' },
        { id: 'accuracy-liability', label: 'Accuracy & Liability' },
        { id: 'copyright', label: 'Copyright' },
        { id: 'privacy-policy', label: 'Privacy Policy' },
        { id: 'terms-of-use', label: 'Terms of Use' },
        { id: 'broker-information', label: 'Broker Information' }
    ];
    const OFFER_DOCS_DB_NAME = 'fastBridgeOfferDocuments';
    const OFFER_DOCS_DB_STORE = 'documents';
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const ALLOWED_THEMES = ['dark', 'light', 'beach', 'swamp', 'sunset', 'space'];
    const KNOWN_EMAIL_GROUPS = [
        {
            canonical: 'isaac.haro@fastbridgegroupllc.com',
            aliases: [
                'isaac.haro@fastbridgegroupllc.com',
                'isaacs.hesed@fastbridgegroup.com',
                'isaacs.hesed@gmail.com'
            ],
            forceRole: 'admin'
        },
        {
            canonical: 'steve.medina@fastbridgegroupllc.com',
            aliases: [
                'steve.medina@fastbridgegroupllc.com',
                'medinafbg@gmail.com',
                'medinastj@gmail.com'
            ],
            forceRole: 'admin'
        }
    ];
    const KNOWN_EMAIL_ALIAS_LOOKUP = new Map();
    const ADMIN_CANONICAL_EMAILS = new Set();
    KNOWN_EMAIL_GROUPS.forEach((group) => {
        if (group.forceRole === 'admin') {
            ADMIN_CANONICAL_EMAILS.add(group.canonical);
        }
        group.aliases.forEach((alias) => {
            KNOWN_EMAIL_ALIAS_LOOKUP.set(alias, group.canonical);
        });
    });
    const BIBLE_MEMORY_VERSES = [
        { reference: 'Acts 16:31', text: 'Believe on the Lord Jesus Christ, and you will be saved.' },
        { reference: '1 John 4:19', text: 'We love because he first loved us.' },
        { reference: 'Matthew 22:39', text: 'You shall love your neighbor as yourself.' },
        { reference: 'Psalm 145:9', text: 'The Lord is good to all.' },
        { reference: 'Genesis 16:13', text: 'You are the God who sees.' },
        { reference: 'Philippians 4:4', text: 'Rejoice in the Lord always. I will say it again: Rejoice!' },
        { reference: 'Proverbs 14:5', text: 'An honest witness does not lie, a false witness breathes lies.' },
        { reference: 'Numbers 6:24', text: 'The Lord bless you and keep you.' },
        { reference: 'Colossians 3:2', text: 'Set your minds on things above, not on earthly things.' },
        { reference: 'Colossians 3:16', text: 'Let the word of Christ dwell in you richly.' },
        { reference: '1 John 5:3', text: 'This is love for God: to obey his commands.' },
        { reference: 'Ephesians 4:30', text: 'And do not grieve the Holy Spirit.' },
        { reference: 'Hebrews 13:8', text: 'Jesus Christ is the same yesterday, today and forever.' },
        { reference: 'Psalm 150:6', text: 'Let everything that has breath praise the Lord.' },
        { reference: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart.' },
        { reference: 'Romans 10:13', text: 'Everyone who calls on the name of the Lord will be saved.' },
        { reference: 'Romans 3:23', text: 'All people have sinned and come short of the glory of God.' },
        { reference: 'Matthew 5:14', text: 'You are the light of the world.' },
        { reference: 'Colossians 3:20', text: 'Children, obey your parents in all things.' },
        { reference: 'James 1:17', text: 'Every good gift and every perfect gift is from above.' },
        { reference: 'Matthew 28:20', text: 'I am with you always.' },
        { reference: 'Ephesians 4:32', text: 'Be kind to one another.' },
        { reference: '1 John 3:23', text: 'Love one another.' },
        { reference: 'Psalm 56:3', text: 'When I am afraid, I will trust in You.' },
        { reference: 'Psalm 118:24', text: 'This is the day the Lord has made; let us rejoice and be glad in it.' },
        { reference: 'Psalm 119:105', text: 'Your word is a lamp to my feet and a light for my path.' },
        { reference: 'Psalm 136:1', text: 'Give thanks to the Lord, for he is good. His love endures forever.' },
        { reference: 'Luke 6:31', text: 'Do to others as you would have them do to you.' },
        { reference: 'Philippians 4:13', text: 'I can do everything through him who gives me strength.' },
        { reference: 'Psalm 138:1', text: 'I will praise thee with my whole heart.' },
        { reference: 'John 10:11', text: 'I am the good shepherd.' },
        { reference: 'Matthew 6:24', text: 'No one can serve two masters.' },
        { reference: 'Proverbs 30:5', text: 'Every word of God proves true.' },
        { reference: 'Ephesians 6:1', text: 'Children, obey your parents in the Lord, for this is right.' },
        { reference: 'Deuteronomy 6:5', text: 'You shall love the Lord your God with all your heart and with all your soul and with all your might.' },
        { reference: 'John 11:35', text: 'Jesus wept.' },
        { reference: '1 Corinthians 10:31', text: 'Whatever you do, do everything for the glory of God.' },
        { reference: 'Psalm 19:1', text: 'The heavens declare the glory of God.' },
        { reference: 'Genesis 1:1', text: 'In the beginning, God created the heavens and the earth.' },
        { reference: 'Psalm 139:14', text: 'I praise you God, for I am fearfully and wonderfully made.' },
        { reference: 'Isaiah 43:5', text: 'Do not be afraid, for I am with you.' },
        { reference: 'Ecclesiastes 12:13', text: 'Fear God and keep his commandments.' },
        { reference: 'Matthew 28:6', text: 'He is not here, he is risen!' },
        { reference: 'Acts 5:29', text: 'We must obey God rather than men.' },
        { reference: '1 Thessalonians 5:17', text: 'Pray without ceasing.' },
        { reference: 'Isaiah 26:4', text: 'Trust in the Lord forever, for the Lord God is an everlasting rock.' },
        { reference: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
        { reference: 'Proverbs 2:6', text: 'The Lord gives wisdom.' },
        { reference: 'Galatians 6:7', text: 'Do not be deceived: God is not mocked, for whatever one sows, that will he also reap.' },
        { reference: 'Psalm 1:6', text: 'The Lord knows the way of the righteous, but the way of the wicked will perish.' }
    ];

    function getSoundSettings() {
        const defaults = {
            menuHover: true,
            todoCheck: true
        };

        const workspaceUser = getWorkspaceUserContext();

        try {
            const parsed = JSON.parse(localStorage.getItem(SOUND_SETTINGS_KEY) || '{}');
            if (typeof parsed.menuHover === 'boolean' || typeof parsed.todoCheck === 'boolean') {
                return {
                    menuHover: parsed.menuHover !== false,
                    todoCheck: parsed.todoCheck !== false
                };
            }
            const scoped = parsed[workspaceUser.key] || {};
            return {
                menuHover: scoped.menuHover !== false,
                todoCheck: scoped.todoCheck !== false
            };
        } catch (error) {
            return defaults;
        }
    }

    function saveSoundSettings(next) {
        const workspaceUser = getWorkspaceUserContext();
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(SOUND_SETTINGS_KEY) || '{}');
        } catch (error) {
            store = {};
        }

        if (typeof store.menuHover === 'boolean' || typeof store.todoCheck === 'boolean') {
            store = {};
        }

        store[workspaceUser.key] = {
            menuHover: next.menuHover !== false,
            todoCheck: next.todoCheck !== false
        };
        localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(store));
        window.dispatchEvent(new CustomEvent('dashboard-sound-settings-updated', { detail: next }));
    }

    function buildLegalFooterMarkup() {
        const year = new Date().getFullYear();
        const linksMarkup = LEGAL_FOOTER_LINKS.map((link) => {
            return `<a class="site-legal-footer-link" href="legal.html#${link.id}">${link.label}</a>`;
        }).join('<span class="site-legal-footer-separator" aria-hidden="true">|</span>');

        return `
            <div class="site-legal-footer-inner">
                <div class="site-legal-footer-brand">FAST BRIDGE GROUP <span>${year}</span></div>
                <nav class="site-legal-footer-links" aria-label="Legal and policy links">${linksMarkup}</nav>
            </div>
        `;
    }

    function getLegalFooterHost() {
        return document.querySelector('.main-content')
            || document.querySelector('.login-container')
            || document.querySelector('.legal-page-main')
            || document.querySelector('.page-shell')
            || document.querySelector('.page-wrapper')
            || document.querySelector('main')
            || document.body;
    }

    function initSiteLegalFooter() {
        if (document.querySelector('[data-site-legal-footer="true"]')) {
            return;
        }

        const host = getLegalFooterHost();
        if (!host) {
            return;
        }

        const footer = document.createElement('footer');
        footer.className = 'site-legal-footer';
        footer.dataset.siteLegalFooter = 'true';
        footer.innerHTML = buildLegalFooterMarkup();
        host.appendChild(footer);
    }

    function showDashboardToast(type, title, message, options) {
        const config = options && typeof options === 'object' ? options : {};
        let stack = document.querySelector('.dashboard-toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'dashboard-toast-stack';
            document.body.appendChild(stack);
        }

        if (config.playSound !== false) {
            playPlannerNotificationSound();
        }

        const toast = document.createElement('div');
        toast.className = `dashboard-toast ${type}`;

        const head = document.createElement('div');
        head.className = 'dashboard-toast-head';

        const copy = document.createElement('div');
        copy.className = 'dashboard-toast-copy';

        if (config.eyebrow) {
            const eyebrow = document.createElement('div');
            eyebrow.className = 'dashboard-toast-eyebrow';
            eyebrow.textContent = String(config.eyebrow);
            copy.appendChild(eyebrow);
        }

        const titleEl = document.createElement('strong');
        titleEl.textContent = String(title || 'Notice');
        copy.appendChild(titleEl);

        const messageEl = document.createElement('p');
        messageEl.textContent = String(message || '');
        copy.appendChild(messageEl);

        if (config.meta) {
            const metaEl = document.createElement('div');
            metaEl.className = 'dashboard-toast-meta';
            metaEl.textContent = String(config.meta);
            copy.appendChild(metaEl);
        }

        head.appendChild(copy);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'dashboard-toast-close';
        closeButton.setAttribute('aria-label', 'Dismiss notification');
        closeButton.textContent = '×';
        head.appendChild(closeButton);
        toast.appendChild(head);

        if (Array.isArray(config.items) && config.items.length > 0) {
            const list = document.createElement('ul');
            list.className = 'dashboard-toast-list';
            config.items.slice(0, 4).forEach(item => {
                const entry = document.createElement('li');
                entry.className = 'dashboard-toast-item';

                const label = document.createElement('span');
                label.className = 'dashboard-toast-item-label';
                label.textContent = item && typeof item === 'object' ? String(item.label || '') : String(item || '');
                entry.appendChild(label);

                if (item && typeof item === 'object' && item.meta) {
                    const meta = document.createElement('span');
                    meta.className = 'dashboard-toast-item-meta';
                    meta.textContent = String(item.meta);
                    entry.appendChild(meta);
                }

                list.appendChild(entry);
            });
            toast.appendChild(list);
        }

        stack.appendChild(toast);

        const dismiss = () => {
            toast.remove();
        };

        closeButton.addEventListener('click', dismiss);
        window.setTimeout(dismiss, Number.isFinite(config.duration) ? config.duration : (type === 'reminder' ? 7000 : 4000));
    }

    function initBuildVersionLabel() {
        const versionLabel = document.getElementById('build-version-label');
        if (!versionLabel) {
            return;
        }

        const apiBaseOrigin = window.location.protocol === 'file:'
            ? 'http://localhost:3000'
            : (window.location.origin || 'http://localhost:3000');

        fetch(`${apiBaseOrigin}/api/build-version`, {
            headers: {
                Accept: 'application/json'
            }
        })
            .then((response) => response.ok ? response.json() : Promise.reject(new Error('Build version unavailable')))
            .then((data) => {
                const version = String(data && data.version || '').trim();
                if (!version) {
                    throw new Error('Build version unavailable');
                }
                versionLabel.textContent = `v${version}`;
            })
            .catch(() => {
                versionLabel.textContent = 'v1.1.8';
            });
    }

    function normalizeUserIdentityValue(value) {
        const normalizedValue = String(value || '').trim().toLowerCase();
        return KNOWN_EMAIL_ALIAS_LOOKUP.get(normalizedValue) || normalizedValue;
    }

    function normalizeUserNameKey(value) {
        return normalizeUserIdentityValue(value).replace(/\s+/g, '-');
    }

    function getUserIdentityAliases(userLike) {
        const aliases = new Set();
        const rawEmail = String(userLike && userLike.email || '').trim().toLowerCase();
        const email = normalizeUserIdentityValue(rawEmail);
        const name = String(userLike && userLike.name || '').trim();
        const normalizedName = normalizeUserNameKey(name);
        const key = normalizeUserIdentityValue(userLike && userLike.key);
        const group = KNOWN_EMAIL_GROUPS.find((item) => item.canonical === email || item.aliases.includes(rawEmail));

        if (email) {
            aliases.add(email);
        }
        if (group) {
            group.aliases.forEach((alias) => aliases.add(alias));
        }
        if (normalizedName) {
            aliases.add(normalizedName);
        }
        if (key) {
            aliases.add(key);
        }

        return Array.from(aliases);
    }

    function buildUserMatchSet(userLike) {
        return new Set(getUserIdentityAliases(userLike));
    }

    function usersMatch(leftUserLike, rightUserLike) {
        const leftAliases = buildUserMatchSet(leftUserLike);
        const rightAliases = buildUserMatchSet(rightUserLike);

        if (!leftAliases.size || !rightAliases.size) {
            return false;
        }

        return Array.from(leftAliases).some(alias => rightAliases.has(alias));
    }

    function mergeUserIdentityRecords(existingUser, incomingUser) {
        if (!existingUser) {
            return incomingUser;
        }

        const mergedName = String(existingUser.name || '').trim() || String(incomingUser.name || '').trim();
        const mergedEmail = String(existingUser.email || '').trim() || String(incomingUser.email || '').trim();
        const mergedRole = String(existingUser.role || '').trim() || String(incomingUser.role || '').trim();
        const mergedKey = normalizeUserIdentityValue(mergedEmail)
            || normalizeUserIdentityValue(existingUser.key)
            || normalizeUserIdentityValue(incomingUser.key)
            || normalizeUserNameKey(mergedName)
            || 'default-user';

        return {
            key: mergedKey,
            name: mergedName || mergedEmail || 'User',
            email: normalizeUserIdentityValue(mergedEmail),
            role: ADMIN_CANONICAL_EMAILS.has(normalizeUserIdentityValue(mergedEmail)) ? 'admin' : normalizeUserIdentityValue(mergedRole)
        };
    }

    function getWorkspaceUserContext() {
        let profile = {};
        let user = {};

        try {
            profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        } catch (error) {
            profile = {};
        }

        try {
            user = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (error) {
            user = {};
        }
        const email = normalizeUserIdentityValue(user.email || profile.email || '');
        const name = String(user.name || profile.name || 'User').trim();
        const role = ADMIN_CANONICAL_EMAILS.has(email) ? 'admin' : normalizeUserIdentityValue(user.role || profile.role || '');
        const key = email || normalizeUserNameKey(name) || 'default-user';
        return {
            key,
            name,
            email,
            role,
            aliases: getUserIdentityAliases({ key, name, email })
        };
    }

    function initMyAgentsAccessRules() {
        document.querySelectorAll('a[href="my-agents.html"]').forEach((link) => {
            const navItem = link.closest('.nav-item');
            if (navItem) {
                navItem.style.display = '';
                navItem.hidden = false;
            }
            link.style.display = '';
            link.hidden = false;
        });
    }

    function getUserScopedObject(storageKey, userKey) {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        const scoped = store[userKey];
        if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
            return scoped;
        }
        return {};
    }

    function setUserScopedObject(storageKey, userKey, value) {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        store[userKey] = value && typeof value === 'object' ? value : {};
        localStorage.setItem(storageKey, JSON.stringify(store));
        window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
    }

    function getPlannerDateKey(value) {
        const normalized = String(value || '').trim();
        if (!normalized) {
            return '';
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            return normalized;
        }
        const parsed = new Date(normalized);
        if (Number.isNaN(parsed.getTime())) {
            return '';
        }
        return parsed.toISOString().slice(0, 10);
    }

    function getPlannerDateFromKey(dateKey) {
        const normalized = getPlannerDateKey(dateKey);
        if (!normalized) {
            return null;
        }
        const [year, month, day] = normalized.split('-').map(value => Number.parseInt(value, 10));
        const parsed = new Date(year, month - 1, day);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function getPlannerTodayKey() {
        const now = new Date();
        return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    }

    function formatPlannerDateLabel(dateKey) {
        const date = getPlannerDateFromKey(dateKey);
        if (!date) {
            return 'No due date';
        }
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    function getPlannerReminderLeadDays(value) {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === '3-day') {
            return 3;
        }
        if (normalized === '1-day') {
            return 1;
        }
        if (normalized === 'day-of') {
            return 0;
        }
        return -1;
    }

    function getPlannerReminderLabel(value) {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === '3-day') {
            return '3 days out';
        }
        if (normalized === '1-day') {
            return '1 day out';
        }
        if (normalized === 'day-of') {
            return 'Due date';
        }
        return 'No reminder';
    }

    function migratePlannerItems(items, workspaceUser) {
        let changed = false;
        const migrated = Array.isArray(items) ? items.map(item => {
            const dueDate = getPlannerDateKey(item && item.dueDate);
            const nextReminderLead = ['none', 'day-of', '1-day', '3-day'].includes(item && item.reminderLead)
                ? item.reminderLead
                : (dueDate ? 'day-of' : 'none');
            const notifications = item && item.notifications && typeof item.notifications === 'object' && !Array.isArray(item.notifications)
                ? item.notifications
                : {};

            const nextItem = item && typeof item.text === 'string' && !item.title
                ? {
                    id: item.id,
                    title: item.text,
                    dueDate,
                    priority: item.type === 'goal' ? 'p1' : 'p2',
                    completed: Boolean(item.completed),
                    updatedAt: item.updatedAt || Date.now(),
                    reminderLead: nextReminderLead,
                    notifications
                }
                : {
                    id: item && item.id,
                    title: String(item && item.title || '').trim(),
                    dueDate,
                    priority: ['p1', 'p2', 'p3', 'p4'].includes(item && item.priority) ? item.priority : 'p2',
                    completed: Boolean(item && item.completed),
                    updatedAt: item && item.updatedAt || Date.now(),
                    reminderLead: dueDate ? nextReminderLead : 'none',
                    notifications
                };

            if (!item || item.title !== nextItem.title || item.dueDate !== nextItem.dueDate || item.priority !== nextItem.priority || item.reminderLead !== nextItem.reminderLead || !item.notifications || typeof item.notifications !== 'object') {
                changed = true;
            }

            return nextItem;
        }) : [];

        if (changed && workspaceUser && workspaceUser.key) {
            setUserScopedItems(TODO_GOALS_KEY, workspaceUser.key, migrated);
        }

        return migrated;
    }

    function getPlannerItems(workspaceUser) {
        const activeUser = workspaceUser || getWorkspaceUserContext();
        return migratePlannerItems(getUserScopedItems(TODO_GOALS_KEY, activeUser.key), activeUser);
    }

    function setPlannerItems(items, workspaceUser) {
        const activeUser = workspaceUser || getWorkspaceUserContext();
        setUserScopedItems(TODO_GOALS_KEY, activeUser.key, items);
    }

    function getPlannerNotificationSettings() {
        const workspaceUser = getWorkspaceUserContext();
        const remembered = getUserScopedObject(USER_SETTINGS_KEY, workspaceUser.key);
        const controls = remembered && typeof remembered.controls === 'object' ? remembered.controls : {};

        return {
            inApp: Object.prototype.hasOwnProperty.call(controls, 'id:notifications-toggle-planner-popups')
                ? Boolean(controls['id:notifications-toggle-planner-popups'])
                : true,
            desktop: Object.prototype.hasOwnProperty.call(controls, 'id:notifications-toggle-desktop')
                ? Boolean(controls['id:notifications-toggle-desktop'])
                : true,
            sound: Object.prototype.hasOwnProperty.call(controls, 'id:notifications-toggle-sound')
                ? Boolean(controls['id:notifications-toggle-sound'])
                : true
        };
    }

    function getMlsNotificationSettings() {
        const workspaceUser = getWorkspaceUserContext();
        const remembered = getUserScopedObject(USER_SETTINGS_KEY, workspaceUser.key);
        const controls = remembered && typeof remembered.controls === 'object' ? remembered.controls : {};
        const shared = getPlannerNotificationSettings();

        return {
            enabled: Object.prototype.hasOwnProperty.call(controls, 'id:notifications-toggle-mls-new-listings')
                ? Boolean(controls['id:notifications-toggle-mls-new-listings'])
                : true,
            desktop: shared.desktop,
            sound: shared.sound
        };
    }

    function playPlannerNotificationSound() {
        if (!getPlannerNotificationSettings().sound) {
            return;
        }
        try {
            let audio = document.getElementById('planner-notification-sound');
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = 'planner-notification-sound';
                audio.src = DASHBOARD_NOTIFICATION_SOUND_PATH;
                audio.preload = 'auto';
                audio.volume = 0.45;
                document.body.appendChild(audio);
            }
            audio.currentTime = 0;
            audio.play().catch(() => {
                // Ignore autoplay restrictions.
            });
        } catch (error) {
            // Ignore playback errors.
        }
    }

    function getGlobalObject(storageKey) {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        if (!store || typeof store !== 'object' || Array.isArray(store)) {
            return {};
        }

        return store;
    }

    function setGlobalObject(storageKey, value) {
        const nextValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        localStorage.setItem(storageKey, JSON.stringify(nextValue));
        window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
    }

    function emitPropertyAssignmentUpdated(propertyKey, assignmentRecord) {
        window.dispatchEvent(new CustomEvent('property-assignment-updated', {
            detail: {
                propertyKey,
                assignment: assignmentRecord || null
            }
        }));
    }

    function applyPropertyAssignmentStore(nextStore) {
        setGlobalObject(PROPERTY_ASSIGNMENTS_KEY, nextStore);
        emitPropertyAssignmentUpdated('*', null);
    }

    function writePropertyAssignmentRecord(propertyKey, assignmentRecord) {
        if (!propertyKey) {
            return;
        }

        const store = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
        if (assignmentRecord && typeof assignmentRecord === 'object') {
            store[propertyKey] = assignmentRecord;
        } else {
            delete store[propertyKey];
        }

        setGlobalObject(PROPERTY_ASSIGNMENTS_KEY, store);
        emitPropertyAssignmentUpdated(propertyKey, assignmentRecord);
    }

    async function fetchPropertyAssignmentsFromServer() {
        const token = String(localStorage.getItem('authToken') || '').trim();
        if (!token) {
            return getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
        }

        const response = await fetch('/api/property-assignments', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Unable to load shared property assignments.');
        }

        const payload = await response.json();
        const assignments = payload && payload.assignments && typeof payload.assignments === 'object' && !Array.isArray(payload.assignments)
            ? payload.assignments
            : {};

        applyPropertyAssignmentStore(assignments);
        return assignments;
    }

    async function syncPropertyAssignmentRecordToServer(propertyKey, assignmentRecord) {
        const token = String(localStorage.getItem('authToken') || '').trim();
        if (!token) {
            return assignmentRecord;
        }

        const response = await fetch('/api/property-assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                propertyKey,
                assignment: assignmentRecord || null
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(String(payload && payload.error || 'Unable to save the property assignment.'));
        }

        return payload.assignment || assignmentRecord || null;
    }

    const propertyAssignmentsReady = fetchPropertyAssignmentsFromServer().catch(() => getGlobalObject(PROPERTY_ASSIGNMENTS_KEY));

    function persistSelectedPropertyDetail(detail) {
        const serializedDetail = JSON.stringify(detail && typeof detail === 'object' ? detail : null);
        let stored = false;

        try {
            localStorage.setItem('selectedPropertyDetail', serializedDetail);
            stored = true;
        } catch (error) {
            stored = false;
        }

        try {
            sessionStorage.setItem('selectedPropertyDetail', serializedDetail);
            stored = true;
        } catch (error) {
            // Ignore session fallback failures and rely on the stored flag.
        }

        return stored;
    }

    function getPersistedSelectedPropertyDetail() {
        const storageReaders = [
            () => localStorage.getItem('selectedPropertyDetail'),
            () => sessionStorage.getItem('selectedPropertyDetail')
        ];

        for (const readValue of storageReaders) {
            let rawValue = null;

            try {
                rawValue = readValue();
            } catch (error) {
                rawValue = null;
            }

            if (!rawValue) {
                continue;
            }

            try {
                const parsed = JSON.parse(rawValue);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (error) {
                // Ignore malformed stored payloads and keep looking for a valid fallback.
            }
        }

        return null;
    }

    function buildUserIdentity(userLike) {
        const email = normalizeUserIdentityValue(userLike && userLike.email || '');
        const name = String(userLike && userLike.name || '').trim() || email || 'User';
        const role = normalizeUserIdentityValue(userLike && userLike.role || '');
        const key = email || normalizeUserNameKey(name) || 'default-user';
        return {
            key,
            name,
            email,
            role: ADMIN_CANONICAL_EMAILS.has(email) ? 'admin' : role
        };
    }

    function getStoredCurrentUserIdentity() {
        try {
            return buildUserIdentity(JSON.parse(localStorage.getItem('user') || '{}'));
        } catch (error) {
            return buildUserIdentity({});
        }
    }

    function makePropertyStorageKey(address) {
        return String(address || '').trim().toLowerCase();
    }

    function normalizeStrikeZoneText(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/\brsm\b/g, 'rancho santa margarita')
            .replace(/\bw\.?\s+(?=[a-z])/g, 'west ')
            .replace(/\be\.?\s+(?=[a-z])/g, 'east ')
            .replace(/\bs\.?\s+(?=[a-z])/g, 'south ')
            .replace(/\bn\.?\s+(?=[a-z])/g, 'north ')
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function extractCityFromPropertyAddress(address) {
        const parts = String(address || '').split(',').map(part => part.trim()).filter(Boolean);
        if (parts.length >= 2) {
            return parts[1];
        }
        return '';
    }

    const STRIKE_ZONE_COUNTY_ALIASES = {
        'los angeles': 'LA',
        'la county': 'LA',
        'la': 'LA',
        'orange county': 'Orange',
        'orange': 'Orange',
        'riverside county': 'Riverside',
        'riverside': 'Riverside',
        'san bernardino county': 'San Bernardino',
        'san bernardino': 'San Bernardino',
        'ventura county': 'Ventura',
        'ventura': 'Ventura',
        'san diego county': 'San Diego',
        'san diego': 'San Diego',
        'imperial county': 'Imperial',
        'imperial': 'Imperial',
        'fresno county': 'Fresno',
        'fresno': 'Fresno'
    };

    const STRIKE_ZONE_GENERIC_CITY_NAMES = new Set([
        'los angeles'
    ]);

    function tokenizeStrikeZoneArea(area) {
        const genericTokens = new Set(['city', 'county', 'area', 'inland', 'coastal', 'rural']);
        return String(area || '')
            .split(/[\/,&]/)
            .map(part => normalizeStrikeZoneText(part))
            .filter(part => part && !genericTokens.has(part));
    }

    function getCountyAlias(value) {
        const normalized = normalizeStrikeZoneText(value);
        return STRIKE_ZONE_COUNTY_ALIASES[normalized] || '';
    }

    function detectCountyFromLocationText(text) {
        const normalized = normalizeStrikeZoneText(text);
        if (!normalized) {
            return '';
        }

        const aliasEntries = Object.entries(STRIKE_ZONE_COUNTY_ALIASES)
            .sort((left, right) => right[0].length - left[0].length);

        const match = aliasEntries.find(([alias]) => normalized.includes(alias));
        return match ? match[1] : '';
    }

    function buildStrikeZoneSearchContext(address, explicitCity, explicitCounty) {
        const fullText = `${String(address || '')} ${String(explicitCity || '')} ${String(explicitCounty || '')}`.trim();
        const normalizedFullText = normalizeStrikeZoneText(fullText);
        const normalizedCity = normalizeStrikeZoneText(explicitCity);
        const normalizedCounty = getCountyAlias(explicitCounty) || detectCountyFromLocationText(fullText);

        return {
            fullText,
            normalizedFullText,
            normalizedCity,
            normalizedCounty
        };
    }

    function getFallbackStrikeZoneRules() {
        return STRIKE_ZONE_RULES.map(entry => ({
            area: entry.area,
            county: entry.county,
            pct: entry.pct,
            isPass: false
        }));
    }

    function parseStrikeZoneCsv(csvText) {
        const lines = String(csvText || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => line.replace(/^"|"$/g, ''));

        const rules = [];
        let currentCounty = '';

        lines.forEach(line => {
            const countyMatch = line.match(/^([A-Za-z\s]+?) County(?:\b|\s)/i);
            if (countyMatch) {
                const rawCounty = countyMatch[1].trim();
                currentCounty = /^los angeles$/i.test(rawCounty)
                    ? 'LA'
                    : rawCounty;
                return;
            }

            if (/^[\-*]/.test(line) === false && /(\d+%|PASS)$/i.test(line) === false) {
                return;
            }

            const cleaned = line.replace(/^[-*]+\s*/, '').trim();
            const percentMatch = cleaned.match(/^(.*?)\s+(\d+%)$/);
            const passMatch = cleaned.match(/^(.*?)\s+PASS$/i);

            if (percentMatch) {
                rules.push({
                    area: percentMatch[1].trim(),
                    county: currentCounty || '',
                    pct: percentMatch[2],
                    isPass: false
                });
                return;
            }

            if (passMatch) {
                rules.push({
                    area: passMatch[1].trim(),
                    county: currentCounty || '',
                    pct: 'NA',
                    isPass: true
                });
            }
        });

        return rules;
    }

    let strikeZoneRulesPromise = null;

    function loadStrikeZoneRules() {
        if (strikeZoneRulesPromise) {
            return strikeZoneRulesPromise;
        }

        strikeZoneRulesPromise = fetch(STRIKE_ZONE_CSV_PATH)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Unable to load strike-zone CSV.');
                }
                return response.text();
            })
            .then(parseStrikeZoneCsv)
            .then(rules => Array.isArray(rules) && rules.length ? rules : getFallbackStrikeZoneRules())
            .catch(() => getFallbackStrikeZoneRules());

        return strikeZoneRulesPromise;
    }

    function findStrikeZoneRuleForProperty(rules, address, explicitCity, explicitCounty) {
        if (!Array.isArray(rules) || rules.length === 0) {
            return null;
        }

        const context = buildStrikeZoneSearchContext(address, explicitCity, explicitCounty);
        const { normalizedFullText, normalizedCity, normalizedCounty } = context;
        if (!normalizedFullText && !normalizedCity) {
            return null;
        }

        const scoredMatches = rules.map(rule => {
            const areaTokens = tokenizeStrikeZoneArea(rule.area);
            const normalizedRuleCounty = getCountyAlias(rule.county) || String(rule.county || '').trim();
            let score = 0;

            if (normalizedCounty && normalizedRuleCounty === normalizedCounty) {
                score += 15;
            }

            areaTokens.forEach(token => {
                if (!token) {
                    return;
                }

                if (normalizedFullText && normalizedFullText.includes(token)) {
                    score = Math.max(score, 120);
                }

                if (normalizedCity && token === normalizedCity) {
                    score = Math.max(score, 110);
                }

                if (
                    normalizedCity &&
                    !STRIKE_ZONE_GENERIC_CITY_NAMES.has(normalizedCity) &&
                    (token.includes(normalizedCity) || normalizedCity.includes(token))
                ) {
                    score = Math.max(score, 85);
                }
            });

            return {
                rule,
                score
            };
        }).filter(item => item.score > 0);

        if (scoredMatches.length === 0) {
            return null;
        }

        scoredMatches.sort((left, right) => right.score - left.score);
        return scoredMatches[0].rule || null;
    }

    function getPropertyAssignmentRecord(propertyKey) {
        if (!propertyKey) {
            return null;
        }

        const store = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
        const record = store[propertyKey];
        return record && typeof record === 'object' ? record : null;
    }

    async function setPropertyAssignmentRecord(propertyKey, assignmentRecord, options) {
        if (!propertyKey) {
            return;
        }

        const config = options && typeof options === 'object' ? options : {};
        const previousRecord = getPropertyAssignmentRecord(propertyKey);

        writePropertyAssignmentRecord(propertyKey, assignmentRecord);

        if (config.skipRemote === true) {
            return assignmentRecord || null;
        }

        try {
            const persistedRecord = await syncPropertyAssignmentRecordToServer(propertyKey, assignmentRecord);
            writePropertyAssignmentRecord(propertyKey, persistedRecord);
            return persistedRecord;
        } catch (error) {
            writePropertyAssignmentRecord(propertyKey, previousRecord);
            throw error;
        }
    }

    function getThemePreference() {
        const workspaceUser = getWorkspaceUserContext();
        const scoped = getUserScopedObject(USER_THEME_KEY, workspaceUser.key);
        if (typeof scoped.value === 'string' && scoped.value) {
            return scoped.value;
        }
        return 'beach';
    }

    function saveThemePreference(theme) {
        const workspaceUser = getWorkspaceUserContext();
        setUserScopedObject(USER_THEME_KEY, workspaceUser.key, { value: theme });
        localStorage.setItem('theme', theme);
    }

    function resolveTheme(theme) {
        const normalized = String(theme || '').trim().toLowerCase();
        if (normalized === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'dark' : 'light';
        }
        if (ALLOWED_THEMES.includes(normalized)) {
            return normalized;
        }
        return 'beach';
    }

    function getAccentPalettes() {
        return {
            emerald: {
                emerald: '#059669',
                emeraldLight: '#34d399',
                gold: '#d4a574',
                goldLight: '#e8c9a0'
            },
            white: {
                emerald: '#e5e7eb',
                emeraldLight: '#ffffff',
                gold: '#cbd5e1',
                goldLight: '#f8fafc'
            },
            blue: {
                emerald: '#2563eb',
                emeraldLight: '#60a5fa',
                gold: '#38bdf8',
                goldLight: '#93c5fd'
            },
            sky: {
                emerald: '#0284c7',
                emeraldLight: '#38bdf8',
                gold: '#7dd3fc',
                goldLight: '#bae6fd'
            },
            cyan: {
                emerald: '#0891b2',
                emeraldLight: '#22d3ee',
                gold: '#67e8f9',
                goldLight: '#cffafe'
            },
            teal: {
                emerald: '#0f766e',
                emeraldLight: '#2dd4bf',
                gold: '#5eead4',
                goldLight: '#ccfbf1'
            },
            mint: {
                emerald: '#10b981',
                emeraldLight: '#6ee7b7',
                gold: '#a7f3d0',
                goldLight: '#d1fae5'
            },
            lime: {
                emerald: '#65a30d',
                emeraldLight: '#a3e635',
                gold: '#bef264',
                goldLight: '#ecfccb'
            },
            amber: {
                emerald: '#d97706',
                emeraldLight: '#fbbf24',
                gold: '#f59e0b',
                goldLight: '#fde68a'
            },
            purple: {
                emerald: '#7c3aed',
                emeraldLight: '#a78bfa',
                gold: '#c084fc',
                goldLight: '#ddd6fe'
            },
            indigo: {
                emerald: '#4338ca',
                emeraldLight: '#818cf8',
                gold: '#a5b4fc',
                goldLight: '#e0e7ff'
            },
            violet: {
                emerald: '#6d28d9',
                emeraldLight: '#8b5cf6',
                gold: '#c4b5fd',
                goldLight: '#ede9fe'
            },
            orange: {
                emerald: '#ea580c',
                emeraldLight: '#fb923c',
                gold: '#f59e0b',
                goldLight: '#fcd34d'
            },
            red: {
                emerald: '#dc2626',
                emeraldLight: '#f87171',
                gold: '#fb7185',
                goldLight: '#fecdd3'
            },
            rose: {
                emerald: '#e11d48',
                emeraldLight: '#fb7185',
                gold: '#fda4af',
                goldLight: '#ffe4e6'
            },
            pink: {
                emerald: '#db2777',
                emeraldLight: '#f472b6',
                gold: '#f43f5e',
                goldLight: '#fda4af'
            },
            magenta: {
                emerald: '#c026d3',
                emeraldLight: '#e879f9',
                gold: '#f0abfc',
                goldLight: '#fae8ff'
            },
            copper: {
                emerald: '#b45309',
                emeraldLight: '#f59e0b',
                gold: '#fbbf24',
                goldLight: '#fde68a'
            },
            slate: {
                emerald: '#334155',
                emeraldLight: '#64748b',
                gold: '#94a3b8',
                goldLight: '#cbd5e1'
            }
        };
    }

    function hexToRgbString(hexColor) {
        const value = String(hexColor || '').replace('#', '');
        if (value.length !== 6) {
            return '5, 150, 105';
        }
        const r = Number.parseInt(value.slice(0, 2), 16);
        const g = Number.parseInt(value.slice(2, 4), 16);
        const b = Number.parseInt(value.slice(4, 6), 16);
        if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
            return '5, 150, 105';
        }
        return `${r}, ${g}, ${b}`;
    }

    function getSavedAccentChoice() {
        const workspaceUser = getWorkspaceUserContext();
        const remembered = getUserScopedObject(USER_SETTINGS_KEY, workspaceUser.key);
        const controls = remembered && typeof remembered.controls === 'object' ? remembered.controls : {};
        const accentFromControls = String(controls['id:accent-color-select'] || '').trim().toLowerCase();
        if (accentFromControls) {
            return accentFromControls;
        }

        const legacy = String(localStorage.getItem('accentColor') || '').trim().toLowerCase();
        return legacy || 'emerald';
    }

    function getSavedAccentGlowEnabled() {
        const workspaceUser = getWorkspaceUserContext();
        const remembered = getUserScopedObject(USER_SETTINGS_KEY, workspaceUser.key);
        const controls = remembered && typeof remembered.controls === 'object' ? remembered.controls : {};

        if (Object.prototype.hasOwnProperty.call(controls, 'id:accent-glow-toggle')) {
            return Boolean(controls['id:accent-glow-toggle']);
        }

        const legacy = String(localStorage.getItem('accentGlow') || '').trim().toLowerCase();
        if (legacy === 'on' || legacy === 'true' || legacy === '1') {
            return true;
        }
        if (legacy === 'off' || legacy === 'false' || legacy === '0') {
            return false;
        }

        return false;
    }

    function applyAccentPalette(accentChoice) {
        const palettes = getAccentPalettes();
        const normalized = String(accentChoice || '').trim().toLowerCase();
        const palette = palettes[normalized] || palettes.emerald;
        const appliedChoice = palettes[normalized] ? normalized : 'emerald';

        document.documentElement.style.setProperty('--emerald', palette.emerald);
        document.documentElement.style.setProperty('--emerald-light', palette.emeraldLight);
        document.documentElement.style.setProperty('--gold', palette.gold);
        document.documentElement.style.setProperty('--gold-light', palette.goldLight);
        document.documentElement.style.setProperty('--accent-rgb', hexToRgbString(palette.emerald));
        document.documentElement.style.setProperty('--accent-light-rgb', hexToRgbString(palette.emeraldLight));
        document.documentElement.setAttribute('data-accent-color', appliedChoice);
    }

    function applyAccentGlowPreference(enabled) {
        document.documentElement.setAttribute('data-accent-glow', enabled ? 'on' : 'off');
    }

    function initAccentPreference() {
        applyAccentPalette(getSavedAccentChoice());
        applyAccentGlowPreference(getSavedAccentGlowEnabled());
    }

    function getUserScopedItems(storageKey, userKey) {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        // Migrate legacy flat-array format into user-scoped object storage.
        if (Array.isArray(store)) {
            const migrated = { [userKey]: store };
            localStorage.setItem(storageKey, JSON.stringify(migrated));
            return store;
        }

        if (!store || typeof store !== 'object') {
            return [];
        }

        const items = store[userKey] || [];
        return Array.isArray(items) ? items : [];
    }

    function setUserScopedItems(storageKey, userKey, items) {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        if (!store || typeof store !== 'object' || Array.isArray(store)) {
            store = {};
        }

        store[userKey] = Array.isArray(items) ? items : [];
        localStorage.setItem(storageKey, JSON.stringify(store));
        window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
    }

    function getUserScopedValue(storageKey, userKey, fallbackValue = '') {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        if (!store || typeof store !== 'object' || Array.isArray(store)) {
            return fallbackValue;
        }

        return Object.prototype.hasOwnProperty.call(store, userKey)
            ? store[userKey]
            : fallbackValue;
    }

    function setUserScopedValue(storageKey, userKey, value) {
        let store = {};
        try {
            store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (error) {
            store = {};
        }

        if (!store || typeof store !== 'object' || Array.isArray(store)) {
            store = {};
        }

        store[userKey] = value;
        localStorage.setItem(storageKey, JSON.stringify(store));
        window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
    }

    function parseMoneyValue(value) {
        const numeric = Number(String(value || '').replace(/[^0-9.-]/g, ''));
        return Number.isFinite(numeric) ? numeric : 0;
    }

    function openOfferDocumentsDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB is not available in this browser.'));
                return;
            }

            const request = window.indexedDB.open(OFFER_DOCS_DB_NAME, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(OFFER_DOCS_DB_STORE)) {
                    db.createObjectStore(OFFER_DOCS_DB_STORE, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Unable to open offer document storage.'));
        });
    }

    async function putOfferDocumentBlob(id, blob) {
        const db = await openOfferDocumentsDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OFFER_DOCS_DB_STORE, 'readwrite');
            const store = transaction.objectStore(OFFER_DOCS_DB_STORE);
            store.put({ id, blob, updatedAt: Date.now() });

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = () => {
                db.close();
                reject(transaction.error || new Error('Unable to save the document file.'));
            };
        });
    }

    async function getOfferDocumentBlob(id) {
        const db = await openOfferDocumentsDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OFFER_DOCS_DB_STORE, 'readonly');
            const store = transaction.objectStore(OFFER_DOCS_DB_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                db.close();
                resolve(request.result ? request.result.blob : null);
            };
            request.onerror = () => {
                db.close();
                reject(request.error || new Error('Unable to load the document file.'));
            };
        });
    }

    async function deleteOfferDocumentBlob(id) {
        const db = await openOfferDocumentsDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OFFER_DOCS_DB_STORE, 'readwrite');
            const store = transaction.objectStore(OFFER_DOCS_DB_STORE);
            store.delete(id);

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = () => {
                db.close();
                reject(transaction.error || new Error('Unable to remove the stored file.'));
            };
        });
    }

    function normalizeExternalUrl(value) {
        try {
            const parsed = new URL(String(value || '').trim());
            if (!/^https?:$/i.test(parsed.protocol)) {
                return '';
            }
            return parsed.toString();
        } catch (error) {
            return '';
        }
    }

    function formatFileSize(bytes) {
        const size = Number(bytes);
        if (!Number.isFinite(size) || size <= 0) {
            return '0 KB';
        }
        if (size < 1024 * 1024) {
            return `${Math.max(1, Math.round(size / 1024))} KB`;
        }
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }

    function sanitizePdfText(value) {
        return String(value || '')
            .replace(/[^\x20-\x7E]/g, ' ')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    function buildSimplePdfBlob(lines) {
        const encoder = new TextEncoder();
        const safeLines = Array.isArray(lines) && lines.length > 0
            ? lines.map(line => sanitizePdfText(line))
            : ['FAST BRIDGE GROUP Offer Template'];

        const streamLines = ['BT', '/F1 12 Tf', '50 780 Td', '16 TL'];
        safeLines.forEach((line, index) => {
            if (index > 0) {
                streamLines.push('T*');
            }
            streamLines.push(`(${line}) Tj`);
        });
        streamLines.push('ET');

        const streamContent = streamLines.join('\n');
        const objects = [
            '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
            '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
            '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
            '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
            `5 0 obj\n<< /Length ${encoder.encode(streamContent).length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
        ];

        let pdf = '%PDF-1.4\n';
        const offsets = [0];
        objects.forEach(object => {
            offsets.push(encoder.encode(pdf).length);
            pdf += object;
        });

        const xrefOffset = encoder.encode(pdf).length;
        pdf += `xref\n0 ${objects.length + 1}\n`;
        pdf += '0000000000 65535 f \n';
        offsets.slice(1).forEach(offset => {
            pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
        });
        pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

        return new Blob([pdf], { type: 'application/pdf' });
    }

    function formatAgentStatusLabel(value) {
        const labels = {
            acquired: '100% - Closed Deal',
            'offer-accepted': '80% - Offer Accepted',
            'in-negotiations': '60% - In Negotiations',
            'contract-submitted': '50% - Contract Submitted',
            'back-up': '30% - Back Up',
            'offer-terms-sent': '30% - Offer Terms Sent',
            'continue-to-follow': '20% - Continue to Follow',
            'initial-contact-started': '10% - Initial Contact Started',
            'cancelled-fec': '0% - Cancelled FEC',
            'do-not-use': '0% - DO NOT USE',
            none: '0% - None',
            pass: '0% - Pass',
            'sold-others-close': '0% - Sold Others/Close'
        };

        const normalized = String(value || 'none').trim().toLowerCase();
        return labels[normalized] || labels.none;
    }

    function initLiveKpiStats() {
        const myProfitsValueEl = document.getElementById('kpi-my-profits');
        const offerTermsSentEl = document.getElementById('kpi-offer-terms-sent');
        const offersSubmittedEl = document.getElementById('kpi-offers-submitted');
        const profitGoalInputEl = document.getElementById('kpi-profit-goal-input');
        const profitGoalMetaEl = document.getElementById('kpi-profit-goal-meta');
        const profitWindowButtons = Array.from(document.querySelectorAll('[data-profit-window]'));

        if (!myProfitsValueEl || !offerTermsSentEl || !offersSubmittedEl) {
            return;
        }

        const myProfitsChangeEl = document.getElementById('kpi-my-profits-change');
        const offerTermsChangeEl = document.getElementById('kpi-offer-terms-change');
        const offersChangeEl = document.getElementById('kpi-offers-change');
        const PROFIT_WINDOW_CONFIG = {
            week: { label: 'last 7 days', days: 7 },
            month: { label: 'last 30 days', days: 30 },
            quarter: { label: 'last 90 days', days: 90 },
            'six-month': { label: 'last 6 months', days: 183 },
            year: { label: 'last 12 months', days: 365 }
        };

        function getSelectedProfitWindow() {
            const workspaceUser = getWorkspaceUserContext();
            const storedWindow = String(getUserScopedValue(ANALYTICS_PROFIT_WINDOW_KEY, workspaceUser.key, 'year') || 'year').trim().toLowerCase();
            return PROFIT_WINDOW_CONFIG[storedWindow] ? storedWindow : 'year';
        }

        function setSelectedProfitWindow(windowKey) {
            const workspaceUser = getWorkspaceUserContext();
            const normalizedWindow = String(windowKey || 'year').trim().toLowerCase();
            const nextWindow = PROFIT_WINDOW_CONFIG[normalizedWindow] ? normalizedWindow : 'year';
            setUserScopedValue(ANALYTICS_PROFIT_WINDOW_KEY, workspaceUser.key, nextWindow);
        }

        function getStateTimestamp(state) {
            return Number(state && (state.updatedAt || state.createdAt)) || 0;
        }

        function getProfitWindowRange(windowKey, now) {
            const config = PROFIT_WINDOW_CONFIG[windowKey] || PROFIT_WINDOW_CONFIG.year;
            return now - (config.days * 24 * 60 * 60 * 1000);
        }

        function syncProfitWindowUi(activeWindow) {
            profitWindowButtons.forEach((button) => {
                const isActive = button.dataset.profitWindow === activeWindow;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        function calculateIaNetProfit(state) {
            if (!state || typeof state !== 'object') {
                return 0;
            }

            const listPrice = Math.max(parseMoneyValue(state.listPrice), 0);
            const rawArv = Math.max(parseMoneyValue(state.arv), 0);
            const estimatedSalesPrice = rawArv;
            const sellSidePct = Math.max(parseMoneyValue(state.sellSidePercent), 0);
            const sellSideCost = estimatedSalesPrice * (sellSidePct / 100);
            const buySideCost = listPrice * 0.006617;
            const renovation = Math.max(parseMoneyValue(state.renovation), 0);
            const offerPrice = Math.max(parseMoneyValue(state.offerPrice), 0);
            const holdMonths = Math.max(parseMoneyValue(state.holdMonths), 0);
            const financingMode = String(state.financingMode || '100-100').trim().toLowerCase();
            const loanToArvPct = Math.max(parseMoneyValue(state.loanToArv), 0);
            const interestRatePct = Math.max(parseMoneyValue(state.interestRate), 0);
            const pointsPct = Math.max(parseMoneyValue(state.originationPoints), 0);
            const lenderFees = Math.max(parseMoneyValue(state.lenderFees), 0);
            const otherCosts = Array.isArray(state.otherCosts)
                ? state.otherCosts.reduce((sum, item) => sum + Math.max(parseMoneyValue(item && item.amount), 0), 0)
                : 0;

            const investorDefaults = state.investorDefaults && typeof state.investorDefaults === 'object'
                ? state.investorDefaults
                : {};

                const invEscrowPct = 0;
                const invProratedPct = Math.max(parseMoneyValue(investorDefaults.invProratedPct), 0);
            const invConcessionsPct = Math.max(parseMoneyValue(investorDefaults.invConcessionsPct), 0);
            const invBuyerAgentPct = 0;
            const invListingAgentPct = 0;
            const invPerDiemPct = Math.max(parseMoneyValue(investorDefaults.invPerDiemPct), 0);
            const invAssetMgmtPct = Math.max(parseMoneyValue(investorDefaults.invAssetMgmtPct), 0);
            const invDueDiligence = Math.max(parseMoneyValue(investorDefaults.invDueDiligence), 0);
            const invAcquisitionFee = Math.max(parseMoneyValue(investorDefaults.invAcquisitionFee), 0);
            const invCashForKeys = Math.max(parseMoneyValue(investorDefaults.invCashForKeys), 0);

            const invEscrowAmount = estimatedSalesPrice * (invEscrowPct / 100);
            const invProratedAmount = estimatedSalesPrice * (invProratedPct / 100);
            const invConcessionsAmount = estimatedSalesPrice * (invConcessionsPct / 100);
            const invBuyerAgentAmount = estimatedSalesPrice * (invBuyerAgentPct / 100);
            const invListingAgentAmount = estimatedSalesPrice * (invListingAgentPct / 100);
            const invPerDiemAmount = estimatedSalesPrice * (invPerDiemPct / 100);
            const invAssetMgmtAmount = estimatedSalesPrice * (invAssetMgmtPct / 100);

            const grossSaleAdjustmentTotal = invEscrowAmount
                + invProratedAmount
                + invConcessionsAmount
                + invBuyerAgentAmount
                + invListingAgentAmount
                + invPerDiemAmount
                + invAssetMgmtAmount;
            const grossPurchaseAdjustmentTotal = invDueDiligence + invAcquisitionFee + invCashForKeys;

            const loanAmount = financingMode === 'cash' ? 0 : rawArv * (loanToArvPct / 100);
            const originationAmount = financingMode === 'cash' ? 0 : loanAmount * (pointsPct / 100);
            const interestCost = financingMode === 'cash' ? 0 : loanAmount * (interestRatePct / 100) * (holdMonths / 12);
            const totalFinancingCost = financingMode === 'cash' ? 0 : (originationAmount + lenderFees + interestCost);

            const grossProfitToSeller = estimatedSalesPrice - sellSideCost - grossSaleAdjustmentTotal;
            const invTotalAcquisition = offerPrice + buySideCost + otherCosts;
            const invHardMoneyCosts = totalFinancingCost;
            const invMiscLessInterest = grossPurchaseAdjustmentTotal;
            const invTotalDevelopmentCost = invTotalAcquisition + invHardMoneyCosts + renovation + invMiscLessInterest;
            const invNetProfit = grossProfitToSeller - invTotalDevelopmentCost;

            return Number.isFinite(invNetProfit) ? invNetProfit : 0;
        }

        function refreshKpis() {
            const workspaceUser = getWorkspaceUserContext();
            const notes = getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            const plannerItems = getUserScopedItems(TODO_GOALS_KEY, workspaceUser.key);
            const iaStates = getUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key);
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            const rawProfitGoal = getUserScopedValue(ANALYTICS_PROFIT_GOAL_KEY, workspaceUser.key, '');
            const profitGoal = Math.max(parseMoneyValue(rawProfitGoal), 0);
            const activeProfitWindow = getSelectedProfitWindow();
            const now = Date.now();
            const profitWindowStart = getProfitWindowRange(activeProfitWindow, now);
            const windowedIaStates = iaStates.filter((state) => getStateTimestamp(state) >= profitWindowStart);
            const yearlyProfitStart = getProfitWindowRange('year', now);
            const yearlyIaStates = iaStates.filter((state) => getStateTimestamp(state) >= yearlyProfitStart);

            const latestByProperty = new Map();
            const offerLeadSet = new Set();
            const offerTermsSentSet = new Set();
            const offerRegex = /\boffer\b|submitted|sent/i;

            Object.entries(scopedStatuses).forEach(([propertyKey, statusValue]) => {
                const normalizedStatus = String(statusValue || 'none').trim().toLowerCase();
                if (normalizedStatus === 'offer-terms-sent') {
                    offerTermsSentSet.add(String(propertyKey || '').trim().toLowerCase());
                }
            });

            notes.forEach(note => {
                const propertyAddress = String(note.propertyAddress || '').trim();
                if (!propertyAddress) {
                    return;
                }
                const propertyKey = propertyAddress.toLowerCase();

                const createdAt = Number(note.createdAt) || 0;
                const existing = latestByProperty.get(propertyAddress);
                if (!existing || createdAt > (Number(existing.createdAt) || 0)) {
                    latestByProperty.set(propertyAddress, note);
                }

                const noteStatus = String(
                    scopedStatuses[propertyKey]
                    || note.piqAgentStatus
                    || note.propertySnapshot?.piqAgentStatus
                    || 'none'
                ).trim().toLowerCase();
                if (noteStatus === 'offer-terms-sent') {
                    offerTermsSentSet.add(propertyKey);
                }

                const noteText = String(note.note || '');
                if (offerRegex.test(noteText)) {
                    offerLeadSet.add(propertyAddress);
                }
            });

            plannerItems.forEach(item => {
                const title = String(item.title || item.text || '');
                if (item.completed && offerRegex.test(title)) {
                    offerLeadSet.add(`planner-${item.id}`);
                }
            });

            const myProfitsTotal = windowedIaStates.reduce((sum, state) => sum + calculateIaNetProfit(state), 0);
            const offerTermsSentCount = offerTermsSentSet.size;
            const offersSubmitted = offerLeadSet.size;
            const activeProfitWindowLabel = (PROFIT_WINDOW_CONFIG[activeProfitWindow] || PROFIT_WINDOW_CONFIG.year).label;

            myProfitsValueEl.textContent = formatMoney(myProfitsTotal);
            offerTermsSentEl.textContent = String(offerTermsSentCount);
            offersSubmittedEl.textContent = String(offersSubmitted);
            syncProfitWindowUi(activeProfitWindow);

            if (myProfitsChangeEl) {
                myProfitsChangeEl.textContent = `${windowedIaStates.length} saved IA deal${windowedIaStates.length === 1 ? '' : 's'} ${activeProfitWindowLabel}`;
            }
            if (profitGoalInputEl) {
                const formattedGoal = profitGoal > 0 ? Math.round(profitGoal).toLocaleString('en-US') : '';
                if (profitGoalInputEl !== document.activeElement || !String(profitGoalInputEl.value || '').trim()) {
                    profitGoalInputEl.value = formattedGoal;
                }
            }
            if (profitGoalMetaEl) {
                if (profitGoal > 0) {
                    const yearlyProfitTotal = yearlyIaStates.reduce((sum, state) => sum + calculateIaNetProfit(state), 0);
                    const remaining = Math.max(profitGoal - yearlyProfitTotal, 0);
                    const percentToGoal = Math.min((yearlyProfitTotal / profitGoal) * 100, 999);
                    profitGoalMetaEl.textContent = `${formatMoney(remaining)} to annual goal • ${percentToGoal.toFixed(1)}% reached`;
                } else {
                    profitGoalMetaEl.textContent = 'Set your target for this year.';
                }
            }
            if (offerTermsChangeEl) {
                offerTermsChangeEl.textContent = `${offerTermsSentCount} propert${offerTermsSentCount === 1 ? 'y' : 'ies'} at offer terms sent`;
            }
            if (offersChangeEl) {
                offersChangeEl.textContent = `${offersSubmitted} offer event${offersSubmitted === 1 ? '' : 's'}`;
            }
        }

        if (profitGoalInputEl) {
            const persistProfitGoal = () => {
                const workspaceUser = getWorkspaceUserContext();
                const digitsOnly = String(profitGoalInputEl.value || '').replace(/[^0-9]/g, '');
                setUserScopedValue(ANALYTICS_PROFIT_GOAL_KEY, workspaceUser.key, digitsOnly);
            };

            profitGoalInputEl.addEventListener('input', () => {
                const digitsOnly = String(profitGoalInputEl.value || '').replace(/[^0-9]/g, '');
                profitGoalInputEl.value = digitsOnly ? Number(digitsOnly).toLocaleString('en-US') : '';
                persistProfitGoal();
            });

            profitGoalInputEl.addEventListener('change', persistProfitGoal);
            profitGoalInputEl.addEventListener('blur', persistProfitGoal);
        }

        profitWindowButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setSelectedProfitWindow(button.dataset.profitWindow);
            });
        });

        refreshKpis();
        window.addEventListener('dashboard-data-updated', refreshKpis);
        window.addEventListener('storage', refreshKpis);
    }

    function initClosedDealsWidget() {
        const closedDealsValueEl = document.getElementById('kpi-closed-deals');
        const closedDealsChangeEl = document.getElementById('kpi-closed-deals-change');
        const dealNameInput = document.getElementById('closed-deal-name');
        const dealDateInput = document.getElementById('closed-deal-date');
        const dealNoteInput = document.getElementById('closed-deal-note');
        const saveButton = document.getElementById('closed-deal-save-btn');
        const listEl = document.getElementById('analytics-closed-deals-list');

        if (!closedDealsValueEl || !closedDealsChangeEl || !listEl) {
            return;
        }

        const workspaceUser = getWorkspaceUserContext();

        function getManualClosedDeals() {
            return getUserScopedItems(CLOSED_DEALS_KEY, workspaceUser.key);
        }

        function setManualClosedDeals(items) {
            setUserScopedItems(CLOSED_DEALS_KEY, workspaceUser.key, items);
        }

        function formatClosedDealDate(value) {
            const parsedTimestamp = typeof value === 'number' ? value : Date.parse(String(value || ''));
            if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) {
                return 'Date not set';
            }
            return new Date(parsedTimestamp).toLocaleDateString();
        }

        function buildClosedDealAddressLookup() {
            const lookup = new Map();
            const notes = getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            const iaStates = getUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key);
            const assignmentStore = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);

            notes.forEach((note) => {
                const address = String(note.propertyAddress || '').trim();
                const propertyKey = makePropertyStorageKey(address);
                if (propertyKey && address && !lookup.has(propertyKey)) {
                    lookup.set(propertyKey, address);
                }
            });

            iaStates.forEach((state) => {
                const address = String(state.propertyAddress || '').trim();
                const propertyKey = makePropertyStorageKey(state.propertyKey || address);
                if (propertyKey && address && !lookup.has(propertyKey)) {
                    lookup.set(propertyKey, address);
                }
            });

            Object.entries(assignmentStore).forEach(([propertyKey, record]) => {
                const address = String(record?.propertyAddress || record?.propertySnapshot?.address || '').trim();
                if (propertyKey && address && !lookup.has(propertyKey)) {
                    lookup.set(propertyKey, address);
                }
            });

            return lookup;
        }

        function buildAutoClosedDeals() {
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            const notes = getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            const iaStates = getUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key);
            const assignmentStore = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
            const addressLookup = buildClosedDealAddressLookup();

            return Object.entries(scopedStatuses)
                .filter(([, statusValue]) => String(statusValue || '').trim().toLowerCase() === 'acquired')
                .map(([propertyKey]) => {
                    const relatedNoteTimes = notes
                        .filter((note) => makePropertyStorageKey(note.propertyAddress) === propertyKey)
                        .map((note) => Number(note.createdAt) || 0);
                    const relatedIaTimes = iaStates
                        .filter((state) => makePropertyStorageKey(state.propertyKey || state.propertyAddress) === propertyKey)
                        .map((state) => Number(state.updatedAt || state.createdAt) || 0);
                    const assignmentTime = Date.parse(String(assignmentStore[propertyKey]?.assignedAt || '')) || 0;
                    const latestTimestamp = Math.max(0, assignmentTime, ...relatedNoteTimes, ...relatedIaTimes);

                    return {
                        id: `auto-${propertyKey}`,
                        key: propertyKey,
                        title: addressLookup.get(propertyKey) || propertyKey || 'Closed Deal',
                        closeDate: latestTimestamp || Date.now(),
                        note: 'Auto-added from Agent Status: 100% - Closed Deal.',
                        source: 'auto',
                        manual: false
                    };
                });
        }

        function buildCombinedClosedDeals() {
            const manualDeals = getManualClosedDeals().map((item) => {
                const title = String(item.title || item.propertyAddress || '').trim() || 'Closed Deal';
                return {
                    id: String(item.id || `manual-${Date.now()}`),
                    key: makePropertyStorageKey(title),
                    title,
                    closeDate: item.closeDate || item.createdAt || Date.now(),
                    note: String(item.note || '').trim(),
                    source: 'manual',
                    manual: true,
                    createdAt: Number(item.createdAt) || Date.now()
                };
            });
            const autoDeals = buildAutoClosedDeals();
            const combinedMap = new Map();

            autoDeals.forEach((deal) => {
                combinedMap.set(deal.key, { ...deal });
            });

            manualDeals.forEach((deal) => {
                const existing = combinedMap.get(deal.key);
                if (existing) {
                    combinedMap.set(deal.key, {
                        ...existing,
                        id: deal.id,
                        title: deal.title || existing.title,
                        closeDate: deal.closeDate || existing.closeDate,
                        note: deal.note || existing.note,
                        source: 'mixed',
                        manual: true,
                        createdAt: deal.createdAt || existing.createdAt || Date.now()
                    });
                    return;
                }

                combinedMap.set(deal.key || deal.id, { ...deal });
            });

            return Array.from(combinedMap.values())
                .sort((left, right) => (Number(right.closeDate) || Date.parse(right.closeDate) || 0) - (Number(left.closeDate) || Date.parse(left.closeDate) || 0));
        }

        function renderClosedDeals() {
            const manualDeals = getManualClosedDeals();
            const autoDeals = buildAutoClosedDeals();
            const combinedDeals = buildCombinedClosedDeals();

            closedDealsValueEl.textContent = String(combinedDeals.length);
            closedDealsChangeEl.textContent = `${autoDeals.length} auto closed deal${autoDeals.length === 1 ? '' : 's'} • ${manualDeals.length} manual`;

            listEl.innerHTML = '';
            if (combinedDeals.length === 0) {
                listEl.innerHTML = '<p class="outreach-empty">No closed deals recorded yet.</p>';
                return;
            }

            combinedDeals.forEach((deal) => {
                const card = document.createElement('article');
                card.className = 'closed-deal-item';

                const head = document.createElement('div');
                head.className = 'closed-deal-item-head';

                const title = document.createElement('div');
                title.className = 'closed-deal-item-title';
                title.textContent = deal.title;

                const source = document.createElement('span');
                source.className = `closed-deal-source ${deal.source}`;
                source.textContent = deal.source === 'mixed'
                    ? 'Auto + Manual'
                    : deal.source === 'manual'
                        ? 'Manual'
                        : 'Auto';

                const meta = document.createElement('p');
                meta.className = 'closed-deal-item-meta';
                meta.textContent = `Closed: ${formatClosedDealDate(deal.closeDate)}`;

                head.appendChild(title);
                head.appendChild(source);
                card.appendChild(head);
                card.appendChild(meta);

                if (deal.note) {
                    const note = document.createElement('p');
                    note.className = 'closed-deal-item-note';
                    note.textContent = deal.note;
                    card.appendChild(note);
                }

                if (deal.manual) {
                    const removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'closed-deal-remove-btn';
                    removeButton.textContent = 'Remove manual entry';
                    removeButton.addEventListener('click', () => {
                        const nextItems = getManualClosedDeals().filter((item) => String(item.id || '') !== String(deal.id || ''));
                        setManualClosedDeals(nextItems);
                    });
                    card.appendChild(removeButton);
                }

                listEl.appendChild(card);
            });
        }

        if (dealDateInput && !dealDateInput.value) {
            dealDateInput.value = new Date().toISOString().slice(0, 10);
        }

        if (saveButton && dealNameInput && dealDateInput && dealNoteInput) {
            saveButton.addEventListener('click', () => {
                const title = String(dealNameInput.value || '').trim();
                const closeDate = String(dealDateInput.value || '').trim();
                const note = String(dealNoteInput.value || '').trim();

                if (!title) {
                    showDashboardToast('error', 'Deal Name Required', 'Add the property address or deal name before saving.');
                    return;
                }

                const items = getManualClosedDeals();
                items.push({
                    id: `closed-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                    title,
                    propertyAddress: title,
                    closeDate: closeDate || new Date().toISOString().slice(0, 10),
                    note,
                    createdAt: Date.now()
                });

                setManualClosedDeals(items);
                dealNameInput.value = '';
                dealNoteInput.value = '';
                dealDateInput.value = new Date().toISOString().slice(0, 10);
                showDashboardToast('success', 'Closed Deal Saved', 'The deal was added to your analytics closed deals widget.');
            });
        }

        renderClosedDeals();
        window.addEventListener('dashboard-data-updated', renderClosedDeals);
        window.addEventListener('storage', renderClosedDeals);
    }

function initNavbarDateTime() {
    const dateTimeEl = document.getElementById('navbar-datetime');
    if (!dateTimeEl) {
        return;
    }

        const formatter = new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });

        const updateDateTime = () => {
            dateTimeEl.textContent = formatter.format(new Date());
        };

        updateDateTime();
        window.setInterval(updateDateTime, 1000);
    }

    function ensureThemeToggleIcons(themeToggle) {
        if (!themeToggle) {
            return { iconSun: null, iconMoon: null, iconPalm: null, iconSymbol: null };
        }

        const THEME_SYMBOLS = {
            dark: 'Symbols/Dark Mode.svg',
            light: 'Symbols/Ligh Mode.svg',
            beach: 'Symbols/Beach Mode.svg',
            swamp: 'Symbols/Beach Mode.svg',
            sunset: 'Symbols/Beach Mode.svg',
            space: 'Symbols/Dark Mode.svg'
        };

        const iconSun = themeToggle.querySelector('.icon-sun');
        const iconMoon = themeToggle.querySelector('.icon-moon');
        let iconPalm = themeToggle.querySelector('.icon-palm');
        let iconSymbol = themeToggle.querySelector('.icon-theme-symbol');

        if (!iconSymbol) {
            iconSymbol = document.createElement('img');
            iconSymbol.setAttribute('class', 'icon-theme-symbol');
            iconSymbol.setAttribute('src', THEME_SYMBOLS.beach);
            iconSymbol.setAttribute('alt', 'Theme switch');
            iconSymbol.setAttribute('draggable', 'false');
            themeToggle.appendChild(iconSymbol);
        }

        if (!iconPalm) {
            const svgNs = 'http://www.w3.org/2000/svg';
            iconPalm = document.createElementNS(svgNs, 'svg');
            iconPalm.setAttribute('class', 'icon-palm');
            iconPalm.setAttribute('viewBox', '0 0 24 24');
            iconPalm.setAttribute('fill', 'none');
            iconPalm.setAttribute('stroke', 'currentColor');
            iconPalm.setAttribute('stroke-width', '2');
            iconPalm.style.display = 'none';
            iconPalm.innerHTML = '<path d="M12 21V12"/><path d="M10 21h4"/><path d="M12 12C8.5 11.2 6.1 9.2 4.8 5.6"/><path d="M12 12c3.5-.8 5.9-2.8 7.2-6.4"/><path d="M12 12C7.7 12 4.9 10.9 3 8.6"/><path d="M12 12c4.3 0 7.1-1.1 9-3.4"/><path d="M4 22c2.4-1 4.8-1 7.2 0 2.4-1 4.8-1 8.8 0"/>';
            themeToggle.appendChild(iconPalm);
        }

        return { iconSun, iconMoon, iconPalm, iconSymbol };
    }

    function updateThemeToggleIcons(themeToggle, effectiveTheme) {
        const { iconSun, iconMoon, iconPalm, iconSymbol } = ensureThemeToggleIcons(themeToggle);
        if (!iconSun || !iconMoon || !iconPalm || !iconSymbol) {
            return;
        }

        const themeSymbols = {
            dark: 'Symbols/Dark Mode.svg',
            light: 'Symbols/Ligh Mode.svg',
            beach: 'Symbols/Beach Mode.svg',
            swamp: 'Symbols/Beach Mode.svg',
            sunset: 'Symbols/Beach Mode.svg',
            space: 'Symbols/Dark Mode.svg'
        };
        const resolvedTheme = themeSymbols[effectiveTheme] ? effectiveTheme : 'beach';

        iconSun.style.display = 'none';
        iconMoon.style.display = 'none';
        iconPalm.style.display = 'none';
        iconSymbol.setAttribute('src', themeSymbols[resolvedTheme]);
        const resolvedLabel = resolvedTheme === 'swamp' ? 'swamp' : resolvedTheme;
        iconSymbol.setAttribute('alt', `${resolvedLabel} mode`);
        iconSymbol.style.display = 'block';
    }

    // ============================================
    // Theme Toggle
    // ============================================
    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        ensureThemeToggleIcons(themeToggle);

        function setTheme(theme) {
            const effectiveTheme = resolveTheme(theme);
            document.documentElement.setAttribute('data-theme', effectiveTheme);
            saveThemePreference(theme === 'system' ? 'system' : effectiveTheme);

            updateThemeToggleIcons(themeToggle, effectiveTheme);

            if (themeToggle) {
                const modeLabel = effectiveTheme.charAt(0).toUpperCase() + effectiveTheme.slice(1);
                themeToggle.title = `Theme: ${modeLabel} Mode`;
            }
        }

        const savedTheme = getThemePreference();
        setTheme(savedTheme);

        if (!themeToggle) {
            return;
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = resolveTheme(document.documentElement.getAttribute('data-theme'));
            const nextTheme = currentTheme === 'dark'
                ? 'light'
                : currentTheme === 'light'
                    ? 'beach'
                    : currentTheme === 'beach'
                        ? 'swamp'
                        : currentTheme === 'swamp'
                            ? 'sunset'
                            : currentTheme === 'sunset'
                                ? 'space'
                            : 'dark';
            setTheme(nextTheme);
        });
    }

    // ============================================
    // Navbar Search
    // ============================================
    function initNavbarSearch() {
        const searchBoxes = Array.from(document.querySelectorAll('.search-box'));
        if (searchBoxes.length === 0) {
            return;
        }

        const MATCH_CLASS = 'global-search-match';

        function clearMatches(scope) {
            (scope || document).querySelectorAll(`.${MATCH_CLASS}`).forEach(element => {
                element.classList.remove(MATCH_CLASS);
            });
        }

        function getHighlightTarget(element) {
            if (!element) {
                return null;
            }

            const preferred = element.closest(
                'h1, h2, h3, h4, h5, h6, p, li, td, th, label, .card-title, .card-subtitle, .agent-note-item, .stat-card, .glass-card'
            );
            return preferred || element;
        }

        function findMatches(scope, query) {
            const normalized = String(query || '').trim().toLowerCase();
            if (!normalized) {
                return [];
            }

            const results = [];
            const seen = new Set();
            const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    if (!node || !node.nodeValue || !node.nodeValue.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const parent = node.parentElement;
                    if (!parent) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (
                        parent.closest('script, style, noscript, svg, .search-box, .sidebar, .mobile-menu-toggle') ||
                        parent.hasAttribute('hidden')
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.nodeValue.toLowerCase().includes(normalized)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            });

            while (walker.nextNode()) {
                const node = walker.currentNode;
                const target = getHighlightTarget(node.parentElement);
                if (!target || seen.has(target)) {
                    continue;
                }
                seen.add(target);
                results.push(target);
                if (results.length >= 25) {
                    break;
                }
            }

            return results;
        }

        searchBoxes.forEach(searchBox => {
            const input = searchBox.querySelector('.search-input');
            if (!input || input.dataset.searchBound === 'true') {
                return;
            }

            let icon = searchBox.querySelector('.search-icon');
            if (!icon) {
                icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.setAttribute('class', 'search-icon');
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.setAttribute('fill', 'none');
                icon.setAttribute('stroke', 'currentColor');
                icon.setAttribute('stroke-width', '2');
                icon.innerHTML = '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>';
                searchBox.insertBefore(icon, input);
            }

            const scope = document.querySelector('main.main-content, .property-detail-shell, .about-page, .login-page') || document.body;

            function runSearch() {
                const query = input.value;
                clearMatches(scope);

                if (!String(query || '').trim()) {
                    return;
                }

                const matches = findMatches(scope, query);
                if (matches.length === 0) {
                    showDashboardToast('error', 'No Results', `No matches found for "${query.trim()}".`);
                    return;
                }

                matches.forEach(match => match.classList.add(MATCH_CLASS));
                matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                showDashboardToast('success', 'Search Updated', `${matches.length} result${matches.length === 1 ? '' : 's'} found.`);
            }

            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    runSearch();
                }
                if (event.key === 'Escape') {
                    input.value = '';
                    clearMatches(scope);
                }
            });

            input.addEventListener('input', () => {
                if (!input.value.trim()) {
                    clearMatches(scope);
                }
            });

            icon.addEventListener('click', runSearch);
            input.dataset.searchBound = 'true';
        });
    }

    // ============================================
    // 3D Tilt Effect
    // ============================================
    function initTiltEffect() {
        document.querySelectorAll('.glass-card-3d').forEach(card => {
            card.addEventListener('mousemove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const divisor = Number.parseFloat(card.dataset.tiltDivisor) || 20;
                const depth = Number.parseFloat(card.dataset.tiltDepth) || 10;
                const maxTilt = Number.parseFloat(card.dataset.tiltMax);

                const clamp = (value) => {
                    if (!Number.isFinite(maxTilt) || maxTilt <= 0) {
                        return value;
                    }
                    return Math.max(-maxTilt, Math.min(maxTilt, value));
                };

                const rotateX = clamp((y - centerY) / divisor);
                const rotateY = clamp((centerX - x) / divisor);

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${depth}px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
    }

    // ============================================
    // Animated Counters
    // ============================================
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            if (element.dataset.prefix) {
                element.textContent = element.dataset.prefix + current.toLocaleString() + (element.dataset.suffix || '');
            } else {
                element.textContent = current.toLocaleString() + (element.dataset.suffix || '');
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    function initCounters() {
        const counters = document.querySelectorAll('.stat-value');
        counters.forEach(counter => {
            const text = counter.textContent;
            const value = parseInt(text.replace(/[^0-9]/g, ''), 10);

            if (Number.isNaN(value)) {
                return;
            }

            if (text.includes('$')) {
                counter.dataset.prefix = '$';
            }
            if (text.includes('%')) {
                counter.dataset.suffix = '%';
            }

            animateCounter(counter, value);
        });
    }

    // ============================================
    // Mobile Menu Toggle
    // ============================================
    function initMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            document.addEventListener('click', (event) => {
                if (sidebar.classList.contains('open') &&
                    !sidebar.contains(event.target) &&
                    !menuToggle.contains(event.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }

    function initMenuSoundEffects() {
        const hoverTargets = Array.from(document.querySelectorAll(
            '.sidebar .nav-link, .settings-nav-link, .property-tab-btn, .piq-image-tab, .calendar-nav-btn, .calendar-back-btn, .chatgpt-chip, .mls-page-btn, .mls-source-link, .tab-link, [data-tab], .btn, .nav-btn, button, [role="button"]'
        ));
        if (hoverTargets.length === 0) {
            return;
        }

        const hoverAudio = new Audio('Sound FX/Menu Tick⧸Hover (Terraria Sound) - Sound Effect for editing.wav');
        hoverAudio.preload = 'auto';
        hoverAudio.volume = 0.35;

        let soundSettings = getSoundSettings();

        window.addEventListener('dashboard-sound-settings-updated', event => {
            soundSettings = event.detail || getSoundSettings();
        });

        window.addEventListener('storage', event => {
            if (event.key === SOUND_SETTINGS_KEY) {
                soundSettings = getSoundSettings();
            }
        });

        function unlockAudio() {
            try {
                hoverAudio.play().then(() => {
                    hoverAudio.pause();
                    hoverAudio.currentTime = 0;
                }).catch(() => {
                    // Ignore autoplay restrictions until user interaction allows playback.
                });
            } catch (error) {
                // Ignore audio initialization errors.
            }
        }

        const unlockEvents = ['pointerdown', 'touchstart', 'keydown'];
        unlockEvents.forEach(eventName => {
            window.addEventListener(eventName, unlockAudio, { passive: true, once: true });
        });

        function playHoverTick() {
            if (!soundSettings.menuHover) {
                return;
            }
            try {
                hoverAudio.currentTime = 0;
                hoverAudio.play().catch(() => {
                    // Ignore blocked playback.
                });
            } catch (error) {
                // Ignore playback errors.
            }
        }

        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', playHoverTick);
            target.addEventListener('focus', playHoverTick);
            target.addEventListener('click', unlockAudio);
        });
    }

    function initSoundSettingsTab() {
        const hoverToggle = document.getElementById('sound-toggle-menu-hover');
        const todoToggle = document.getElementById('sound-toggle-todo-check');

        if (!hoverToggle && !todoToggle) {
            return;
        }

        const settings = getSoundSettings();
        if (hoverToggle) {
            hoverToggle.checked = settings.menuHover;
            hoverToggle.addEventListener('change', () => {
                const next = getSoundSettings();
                next.menuHover = hoverToggle.checked;
                saveSoundSettings(next);
            });
        }

        if (todoToggle) {
            todoToggle.checked = settings.todoCheck;
            todoToggle.addEventListener('change', () => {
                const next = getSoundSettings();
                next.todoCheck = todoToggle.checked;
                saveSoundSettings(next);
            });
        }
    }

    // ============================================
    // Form Validation (for login/register)
    // ============================================
    function initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');

        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();

                let isValid = true;
                const inputs = form.querySelectorAll('.form-input[required]');

                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.style.borderColor = '#ff6b6b';
                    } else {
                        input.style.borderColor = '';
                    }
                });

                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailInput.value)) {
                        isValid = false;
                        emailInput.style.borderColor = '#ff6b6b';
                    }
                }

                if (isValid && form.dataset.redirect) {
                    window.location.href = form.dataset.redirect;
                }
            });
        });
    }

    // ============================================
    // Password Visibility Toggle
    // ============================================
    function initPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');

        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.parentElement.querySelector('input');
                const icon = button.querySelector('svg');

                if (!input || !icon) {
                    return;
                }

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
                } else {
                    input.type = 'password';
                    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                }
            });
        });
    }

    // ============================================
    // Smooth Page Transitions
    // ============================================
    function initPageTransitions() {
        // Disabled to prevent full-screen fade during sidebar/page navigation.
    }

    // ============================================
    // Settings Tab Navigation
    // ============================================
    function initSettingsTabs() {
        const tabLinks = document.querySelectorAll('.settings-nav-link[data-tab]');

        if (tabLinks.length === 0) return;

        tabLinks.forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                const tabId = link.getAttribute('data-tab');

                document.querySelectorAll('.settings-nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });

                link.classList.add('active');

                document.querySelectorAll('.settings-tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });

                const targetTab = document.getElementById('tab-' + tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });

        const themeSelect = document.getElementById('theme-select');
        const accentSelect = document.getElementById('accent-color-select');
        const accentGlowToggle = document.getElementById('accent-glow-toggle');
        if (themeSelect) {
            const currentTheme = getThemePreference();
            themeSelect.value = currentTheme === 'system' ? 'dark' : resolveTheme(currentTheme);

            themeSelect.addEventListener('change', () => {
                const theme = themeSelect.value;
                const effectiveTheme = resolveTheme(theme);
                document.documentElement.setAttribute('data-theme', effectiveTheme);
                saveThemePreference(effectiveTheme);

                const themeToggle = document.getElementById('theme-toggle');
                updateThemeToggleIcons(themeToggle, effectiveTheme);
                if (themeToggle) {
                    const modeLabel = effectiveTheme.charAt(0).toUpperCase() + effectiveTheme.slice(1);
                    themeToggle.title = `Theme: ${modeLabel} Mode`;
                }
            });
        }

        if (accentSelect) {
            const paletteChoices = getAccentPalettes();
            const currentAccent = getSavedAccentChoice();
            accentSelect.value = paletteChoices[currentAccent] ? currentAccent : 'emerald';
            applyAccentPalette(accentSelect.value);

            accentSelect.addEventListener('change', () => {
                const nextAccent = accentSelect.value;
                applyAccentPalette(nextAccent);
                localStorage.setItem('accentColor', nextAccent);
            });
        }

        if (accentGlowToggle) {
            accentGlowToggle.checked = getSavedAccentGlowEnabled();
            applyAccentGlowPreference(accentGlowToggle.checked);

            accentGlowToggle.addEventListener('change', () => {
                const isOn = Boolean(accentGlowToggle.checked);
                applyAccentGlowPreference(isOn);
                localStorage.setItem('accentGlow', isOn ? 'on' : 'off');
            });
        }

        const workspaceUser = getWorkspaceUserContext();
        const remembered = getUserScopedObject(USER_SETTINGS_KEY, workspaceUser.key);
        const settingsState = remembered.controls && typeof remembered.controls === 'object' ? remembered.controls : {};
        const tabsToPersist = ['tab-security', 'tab-notifications', 'tab-appearance'];

        function getControlStateKey(control) {
            if (control.id) {
                return `id:${control.id}`;
            }

            const tab = control.closest('.settings-tab-content');
            const tabId = tab ? tab.id : 'tab-unknown';
            const controls = tab
                ? Array.from(tab.querySelectorAll('input, select, textarea')).filter(item => {
                    const itemType = String(item.type || '').toLowerCase();
                    return itemType !== 'password' && itemType !== 'file';
                })
                : [];

            const index = controls.indexOf(control);
            return `${tabId}:${control.tagName.toLowerCase()}:${String(control.type || 'text').toLowerCase()}:${Math.max(0, index)}`;
        }

        function writeSettingsState() {
            setUserScopedObject(USER_SETTINGS_KEY, workspaceUser.key, {
                controls: settingsState,
                updatedAt: Date.now()
            });
            window.dispatchEvent(new CustomEvent('dashboard-user-settings-updated', {
                detail: {
                    userKey: workspaceUser.key,
                    controls: { ...settingsState }
                }
            }));
        }

        tabsToPersist.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (!tab) {
                return;
            }

            const controls = Array.from(tab.querySelectorAll('input, select, textarea')).filter(control => {
                const controlType = String(control.type || '').toLowerCase();
                return controlType !== 'password' && controlType !== 'file';
            });

            controls.forEach(control => {
                const key = getControlStateKey(control);
                if (Object.prototype.hasOwnProperty.call(settingsState, key)) {
                    if (control.type === 'checkbox') {
                        control.checked = Boolean(settingsState[key]);
                    } else {
                        control.value = String(settingsState[key]);
                    }
                }

                const persist = () => {
                    if (control.type === 'checkbox') {
                        settingsState[key] = Boolean(control.checked);
                    } else {
                        settingsState[key] = control.value;
                    }
                    writeSettingsState();
                };

                control.addEventListener('change', persist);
                if (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA') {
                    control.addEventListener('input', persist);
                }
            });
        });

        function initTwoFactorSettingsControls() {
            const enable2fa = document.getElementById('security-2fa-enable');
            const sms2fa = document.getElementById('security-2fa-sms');
            const app2fa = document.getElementById('security-2fa-app');

            if (!enable2fa || !sms2fa || !app2fa) {
                return;
            }

            const sync2faUi = () => {
                const enabled = Boolean(enable2fa.checked);

                sms2fa.disabled = !enabled;
                app2fa.disabled = !enabled;

                if (!enabled) {
                    return;
                }

                if (!sms2fa.checked && !app2fa.checked) {
                    sms2fa.checked = true;
                    sms2fa.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            enable2fa.addEventListener('change', () => {
                sync2faUi();
            });

            [sms2fa, app2fa].forEach(control => {
                control.addEventListener('change', () => {
                    if (!enable2fa.checked) {
                        return;
                    }

                    if (!sms2fa.checked && !app2fa.checked) {
                        control.checked = true;
                        showDashboardToast('error', '2FA Method Required', 'Choose at least one 2FA method while 2FA is enabled.');
                        control.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            });

            sync2faUi();
        }

        initTwoFactorSettingsControls();

        if (accentGlowToggle) {
            applyAccentGlowPreference(Boolean(accentGlowToggle.checked));
        }
    }

    // ============================================
    // Widget Controls
    // ============================================
    function getWidgetStateStorageKey() {
        const baseKey = typeof WIDGET_STATE_KEY === 'string' && WIDGET_STATE_KEY
            ? WIDGET_STATE_KEY
            : 'dashboardWidgetState';
        const pageKey = String(window.location.pathname || 'global')
            .replace(/^\/+/, '')
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '')
            || 'home';
        return `${baseKey}:${pageKey}`;
    }

    function getWidgetState() {
        try {
            return JSON.parse(localStorage.getItem(getWidgetStateStorageKey()) || '{}');
        } catch (error) {
            return {};
        }
    }

    function saveWidgetState(state) {
        localStorage.setItem(getWidgetStateStorageKey(), JSON.stringify(state));
    }

    function ensureWidgetDock() {
        let dock = document.getElementById('widget-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'widget-dock';
            dock.className = 'widget-dock';
            document.body.appendChild(dock);
        }
        return dock;
    }

    function ensureWidgetOverlay() {
        let overlay = document.getElementById('widget-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'widget-overlay';
            overlay.className = 'widget-overlay';
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function createIcon(name) {
        if (name === 'minimize') {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        }
        if (name === 'restore') {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
        }
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
    }

    function initWidgetControls() {
        const widgets = document.querySelectorAll('.widget-card');
        if (widgets.length === 0) return;

        const dock = ensureWidgetDock();
        const overlay = ensureWidgetOverlay();
        const widgetState = getWidgetState();
        let expandedWidget = null;

        function persist() {
            saveWidgetState(widgetState);
        }

        function restoreWidget(widget) {
            const widgetId = widget.dataset.widgetId;
            widget.classList.remove('widget-minimized');
            widgetState[widgetId] = {
                ...(widgetState[widgetId] || {}),
                minimized: false
            };
            persist();

            const dockItem = dock.querySelector(`[data-widget-dock="${widgetId}"]`);
            if (dockItem) {
                dockItem.remove();
            }

            if (typeof widget.scrollIntoView === 'function') {
                widget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }

        function minimizeWidget(widget) {
            const widgetId = widget.dataset.widgetId;
            const title = widget.dataset.widgetTitle || 'Widget';
            const expandButton = widget.querySelector('[data-widget-action="expand"]');
            widget.classList.remove('widget-expanded');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            expandedWidget = null;

            if (expandButton) {
                expandButton.setAttribute('aria-pressed', 'false');
            }

            widget.classList.add('widget-minimized');
            widgetState[widgetId] = {
                ...(widgetState[widgetId] || {}),
                minimized: true
            };
            persist();

            if (!dock.querySelector(`[data-widget-dock="${widgetId}"]`)) {
                const dockItem = document.createElement('button');
                dockItem.type = 'button';
                dockItem.className = 'widget-dock-item';
                dockItem.dataset.widgetDock = widgetId;
                dockItem.innerHTML = `${createIcon('restore')}<span>${title}</span>`;
                dockItem.addEventListener('click', () => restoreWidget(widget));
                dock.appendChild(dockItem);
            }
        }

        function closeExpandedWidget() {
            if (!expandedWidget) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                return;
            }

            expandedWidget.classList.remove('widget-expanded');
            const expandButton = expandedWidget.querySelector('[data-widget-action="expand"]');
            if (expandButton) {
                expandButton.setAttribute('aria-pressed', 'false');
            }
            expandedWidget = null;
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        overlay.addEventListener('click', closeExpandedWidget);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeExpandedWidget();
            }
        });

        widgets.forEach(widget => {
            const widgetId = widget.dataset.widgetId;
            const title = widget.dataset.widgetTitle || widget.querySelector('.card-title')?.textContent?.trim() || 'Widget';
            const header = widget.querySelector('.card-header, .calendar-header');
            if (!widgetId || !header) {
                return;
            }

            widget.dataset.widgetTitle = title;

            let actionCluster = header.querySelector('.card-actions');
            if (!actionCluster) {
                actionCluster = document.createElement('div');
                actionCluster.className = 'card-actions';

                const existingCalendarNav = header.querySelector('.calendar-nav');
                if (existingCalendarNav) {
                    header.appendChild(actionCluster);
                    actionCluster.appendChild(existingCalendarNav);
                } else {
                    header.appendChild(actionCluster);
                }
            }

            let controls = actionCluster.querySelector('.widget-controls');
            if (!controls) {
                controls = document.createElement('div');
                controls.className = 'widget-controls';
                controls.innerHTML = `
                    <button type="button" class="widget-control-btn" data-widget-action="minimize" aria-label="Minimize ${title}">
                        ${createIcon('minimize')}
                    </button>
                    <button type="button" class="widget-control-btn" data-widget-action="expand" aria-label="Expand ${title}" aria-pressed="false">
                        ${createIcon('expand')}
                    </button>
                `;
                actionCluster.appendChild(controls);
            }

            if (controls.dataset.widgetControlsBound === 'true') {
                return;
            }
            controls.dataset.widgetControlsBound = 'true';

            controls.querySelector('[data-widget-action="minimize"]').addEventListener('click', () => {
                minimizeWidget(widget);
            });

            controls.querySelector('[data-widget-action="expand"]').addEventListener('click', event => {
                const button = event.currentTarget;
                if (expandedWidget === widget) {
                    closeExpandedWidget();
                    return;
                }

                if (expandedWidget) {
                    closeExpandedWidget();
                }

                restoreWidget(widget);
                expandedWidget = widget;
                widget.classList.add('widget-expanded');
                overlay.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                document.body.style.overflow = 'hidden';
            });

            if (widgetState[widgetId] && widgetState[widgetId].minimized) {
                minimizeWidget(widget);
            }
        });
    }

    // ============================================
    // Interactive Calendar
    // ============================================
    function initInteractiveCalendar() {
        const calendarStage = document.getElementById('calendar-stage');
        const calendarGrid = document.getElementById('calendar-grid');
        const monthLabel = document.getElementById('calendar-month-label');
        const selectedDateLabel = document.getElementById('calendar-selected-date');
        const selectedSummary = document.getElementById('calendar-selected-summary');
        const detailSummary = document.getElementById('calendar-detail-summary');
        const eventsList = document.getElementById('calendar-events-list');
        const noteForm = document.getElementById('calendar-note-form-inline');
        const noteText = document.getElementById('calendar-note-text-inline');
        const noteReminder = document.getElementById('calendar-note-reminder-inline');
        const addNoteButton = document.getElementById('calendar-add-note-btn');
        const backButton = document.getElementById('calendar-back-btn');
        const prevMonthButton = document.getElementById('calendar-prev-month');
        const nextMonthButton = document.getElementById('calendar-next-month');

        if (!calendarStage || !calendarGrid || !monthLabel || !selectedDateLabel || !eventsList || !noteForm || !noteText || !noteReminder) return;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let detailOpen = false;

        function getEvents() {
            try {
                return JSON.parse(localStorage.getItem(CALENDAR_EVENTS_KEY) || '{}');
            } catch (error) {
                return {};
            }
        }

        function saveEvents(events) {
            localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));
        }

        function formatDateKey(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function formatDateHeading(date) {
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }).format(date);
        }

        function sameDay(left, right) {
            return left.getFullYear() === right.getFullYear() &&
                left.getMonth() === right.getMonth() &&
                left.getDate() === right.getDate();
        }

        function toReminderLabel(value) {
            if (!value) {
                return '';
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return '';
            }

            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }).format(date);
        }

        function generateEventId() {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }
            return 'event-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        }

        function getEventsForDate(date) {
            const events = getEvents();
            const key = formatDateKey(date);
            return (events[key] || []).slice().sort((left, right) => {
                if (!left.reminder && !right.reminder) return 0;
                if (!left.reminder) return 1;
                if (!right.reminder) return -1;
                return new Date(left.reminder) - new Date(right.reminder);
            });
        }

        function openDetailView() {
            detailOpen = true;
            calendarStage.classList.add('detail-open');
            renderDetailView();
            window.setTimeout(() => noteText.focus(), 120);
        }

        function closeDetailView() {
            detailOpen = false;
            calendarStage.classList.remove('detail-open');
            noteForm.reset();
        }

        noteForm.addEventListener('submit', event => {
            event.preventDefault();
            const note = noteText.value.trim();
            const reminder = noteReminder.value;

            if (!note) {
                showDashboardToast('error', 'Note required', 'Add a note before saving this calendar item.');
                noteText.focus();
                return;
            }

            const events = getEvents();
            const key = formatDateKey(selectedDate);
            const existingItems = events[key] || [];

            existingItems.push({
                id: generateEventId(),
                note,
                reminder: reminder || '',
                notifiedAt: '',
                createdAt: new Date().toISOString()
            });

            events[key] = existingItems;
            saveEvents(events);
            renderCalendar();
            renderDetailView();
            noteForm.reset();
            showDashboardToast('success', 'Calendar updated', 'Your note was added to the selected date.');

            if (reminder && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        });

        function renderDetailView() {
            const items = getEventsForDate(selectedDate);
            selectedDateLabel.textContent = formatDateHeading(selectedDate);
            const total = items.length;
            selectedSummary.textContent = total === 0
                ? 'No notes or reminders scheduled for this date'
                : `${total} item${total === 1 ? '' : 's'} scheduled for this date`;
            if (detailSummary) {
                detailSummary.textContent = total === 0
                    ? 'Add notes and reminders for this day.'
                    : `${total} saved item${total === 1 ? '' : 's'} for this day.`;
            }

            if (total === 0) {
                eventsList.innerHTML = '<p class="calendar-empty-state">No notes or reminders yet.</p>';
                return;
            }

            eventsList.innerHTML = '';
            items.forEach(item => {
                const card = document.createElement('article');
                card.className = 'calendar-event-item';

                const meta = document.createElement('div');
                meta.className = 'calendar-event-meta';
                if (item.reminder) {
                    meta.innerHTML = `<span class="calendar-event-reminder">Reminder ${toReminderLabel(item.reminder)}</span>`;
                } else {
                    meta.innerHTML = '<span class="calendar-event-reminder">Note only</span>';
                }

                const note = document.createElement('p');
                note.className = 'calendar-event-note';
                note.textContent = item.note;

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'calendar-event-remove';
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', () => {
                    const events = getEvents();
                    const key = formatDateKey(selectedDate);
                    events[key] = (events[key] || []).filter(entry => entry.id !== item.id);
                    if (events[key].length === 0) {
                        delete events[key];
                    }
                    saveEvents(events);
                    renderCalendar();
                    renderDetailView();
                });

                card.appendChild(meta);
                card.appendChild(note);
                card.appendChild(removeButton);
                eventsList.appendChild(card);
            });
        }

        function createDayButton(date, inCurrentMonth) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'calendar-day';
            if (!inCurrentMonth) {
                button.classList.add('other-month');
            }
            if (inCurrentMonth && date < todayStart) {
                button.classList.add('past-day');
            }
            if (sameDay(date, today)) {
                button.classList.add('today');
            }
            if (sameDay(date, selectedDate)) {
                button.classList.add('selected');
            }

            const dateKey = formatDateKey(date);
            const events = getEvents()[dateKey] || [];
            if (events.length > 0) {
                button.classList.add('has-event');
            }

            button.innerHTML = `<span class="calendar-day-number">${date.getDate()}</span>${events.length > 0 ? `<span class="calendar-event-count">${events.length}</span>` : ''}`;
            button.addEventListener('click', () => {
                if (!inCurrentMonth) {
                    currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                }
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                renderCalendar();
                openDetailView();
            });

            return button;
        }

        function renderCalendar() {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            monthLabel.textContent = new Intl.DateTimeFormat('en-US', {
                month: 'long',
                year: 'numeric'
            }).format(currentMonth);

            calendarGrid.innerHTML = '';
            DAY_NAMES.forEach(day => {
                const dayName = document.createElement('span');
                dayName.className = 'calendar-day-name';
                dayName.textContent = day;
                calendarGrid.appendChild(dayName);
            });

            const firstDay = new Date(year, month, 1);
            const firstWeekday = firstDay.getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPreviousMonth = new Date(year, month, 0).getDate();

            for (let index = firstWeekday - 1; index >= 0; index -= 1) {
                const date = new Date(year, month - 1, daysInPreviousMonth - index);
                calendarGrid.appendChild(createDayButton(date, false));
            }

            for (let day = 1; day <= daysInMonth; day += 1) {
                const date = new Date(year, month, day);
                calendarGrid.appendChild(createDayButton(date, true));
            }

            const visibleCells = calendarGrid.querySelectorAll('.calendar-day').length;
            const trailingDays = (7 - (visibleCells % 7)) % 7;
            for (let day = 1; day <= trailingDays; day += 1) {
                const date = new Date(year, month + 1, day);
                calendarGrid.appendChild(createDayButton(date, false));
            }
        }

        function checkReminders() {
            const events = getEvents();
            let dirty = false;
            const now = new Date();

            Object.keys(events).forEach(key => {
                events[key].forEach(item => {
                    if (!item.reminder || item.notifiedAt) {
                        return;
                    }

                    const reminderDate = new Date(item.reminder);
                    if (Number.isNaN(reminderDate.getTime())) {
                        return;
                    }

                    if (reminderDate <= now) {
                        item.notifiedAt = new Date().toISOString();
                        dirty = true;
                        showDashboardToast('reminder', 'Reminder due', item.note, {
                            playSound: false
                        });
                        playPlannerNotificationSound();

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('FAST BRIDGE GROUP reminder', {
                                body: item.note
                            });
                        }
                    }
                });
            });

            if (dirty) {
                saveEvents(events);
                renderCalendar();
                if (detailOpen) {
                    renderDetailView();
                }
            }
        }

        if (backButton) {
            backButton.addEventListener('click', closeDetailView);
        }

        if (prevMonthButton) {
            prevMonthButton.addEventListener('click', () => {
                currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                renderCalendar();
            });
        }

        if (nextMonthButton) {
            nextMonthButton.addEventListener('click', () => {
                currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                renderCalendar();
            });
        }

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && detailOpen) {
                closeDetailView();
            }
        });

        renderCalendar();
        renderDetailView();
        checkReminders();
        window.setInterval(checkReminders, 60000);
    }

    function initDashboardChatGptWidget() {
        const form = document.getElementById('chatgpt-form');
        const input = document.getElementById('chatgpt-input');
        const chat = document.getElementById('chatgpt-chat');
        const status = document.getElementById('chatgpt-status');
        const chips = Array.from(document.querySelectorAll('.chatgpt-chip[data-chatgpt-question]'));

        if (!form || !input || !chat) {
            return;
        }

        function pushMessage(role, html) {
            const message = document.createElement('div');
            message.className = `chatgpt-msg ${role}`;
            message.innerHTML = html;
            chat.appendChild(message);
            chat.scrollTop = chat.scrollHeight;
            return message;
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function plainTextToMessageHtml(text) {
            const safe = escapeHtml(text).trim();
            if (!safe) {
                return '<p>I could not generate a response right now.</p>';
            }

            const paragraphs = safe
                .split(/\n{2,}/)
                .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
                .join('');

            return paragraphs || '<p>I could not generate a response right now.</p>';
        }

        function setAiStatus(text, mode) {
            if (!status) {
                return;
            }

            status.textContent = text;
            status.classList.remove('live', 'fallback');
            status.classList.add(mode === 'fallback' ? 'fallback' : 'live');
        }

        function wrapAiResponseMessage(answer, metaLabel) {
            const meta = metaLabel ? `<p class="chatgpt-msg-meta">${escapeHtml(metaLabel)}</p>` : '';
            return `${meta}${plainTextToMessageHtml(answer)}`;
        }

        function showTyping() {
            const el = document.createElement('div');
            el.className = 'chatgpt-msg assistant chatgpt-typing';
            el.innerHTML = '<span></span><span></span><span></span>';
            chat.appendChild(el);
            chat.scrollTop = chat.scrollHeight;
            return el;
        }

        function fmt(paragraphs) {
            return paragraphs.map(p => {
                if (Array.isArray(p)) {
                    return '<ul>' + p.map(li => `<li>${li}</li>`).join('') + '</ul>';
                }
                return `<p>${p}</p>`;
            }).join('');
        }

        const APPRAISAL_RULES_RESPONSE = fmt([
            '<strong>FAST BRIDGE GROUP appraisal comp rules:</strong>',
            [
                '<strong>Comp recency:</strong> use comps no older than 90 days.',
                '<strong>Living area:</strong> keep within +/- 250 sqft (allow up to roughly 10-15% variance for smaller homes).',
                '<strong>Lot size:</strong> only compare homes within +/- 2,500 sqft lot size (LA and San Diego: tighter at +/- 1,500 sqft).',
                '<strong>Property type/style match:</strong> keep same style/type buckets (Spanish, 1-2 story, Craftsman, Historic, etc.).',
                '<strong>Do not cross major roads or ZIP boundaries.</strong>',
                '<strong>Year built:</strong> stay within +/- 10-15 years of subject build date when possible.',
                '<strong>Stay in same subdivision</strong> whenever possible. Better to "time travel" than to leave subdivision or cross major street.',
            ],
            '<strong>Special factors to explicitly adjust for:</strong> guest house/ADU, traffic exposure, busy street, commercial adjacency, railroad tracks, freeway influence, and neighborhood fit.',
        ]);

        const ADJUSTMENT_RULES_RESPONSE = fmt([
            '<strong>FAST BRIDGE GROUP adjustment guide (city dependent):</strong>',
            '<strong>Price tier: Under $500K</strong>',
            [
                'Bedroom: +/- $10K-$20K',
                'Bath: +/- $10K',
                'Pool: +/- $10K-$20K',
                'Garage: +/- $10K',
                'Carport: +/- $5K-$10K',
            ],
            '<strong>Price tier: $500K-$1M</strong>',
            [
                'Bedroom: +/- $25K-$50K',
                'Bath: +/- $15K-$25K',
                'Pool: +/- $20K-$50K',
                'Garage: +/- $25K',
            ],
            '<strong>Price tier: $1M+</strong>',
            [
                'Bedroom: +/- $50K-$100K',
                'Bath: +/- $40K-$50K',
                'Pool: +/- $50K-$100K',
                'Garage: +/- $50K',
            ],
            '<strong>Environment / nuisance adjustments:</strong>',
            [
                'Under $700K: siding -10%, backing -15%, fronting -20%.',
                'Above $700K: siding -15%, backing -20%, fronting -25%.',
                'If no ADU comps: apply approx +/- $50K-$100K guidance based on market and utility.',
                'Multi-family adjacency: typically -10% to -15%.',
                'Freeway impact: typically around +/- 20% depending on direct influence.',
            ],
        ]);

        const ADDITIONAL_ADJUSTMENTS_RESPONSE = fmt([
            '<strong>Additional FAST BRIDGE GROUP underwriting adjustments:</strong>',
            [
                'Cosmetic rehab + major issue (roof/septic/pool/unpermitted additions): subtract additional 1-2% per issue.',
                'Heavier rehabs: reduce offer by additional 2-3%.',
                'Homes over 2,200 sqft: reduce additional 2-4%.',
                'Off-market opportunity: may push about +1% when justified.',
                'Major street or adjacent MFR (especially LA/OC): subtract about 10-15% from ARV basis.',
                'Manufactured homes on land: generally 3-5% lower than area averages and must be affixed with 433A permit.',
                'Manufactured homes pre-June 1976: pass unless strong seller-finance terms change the risk profile.',
                'Fire damage / teardown: target roughly 40-55% of ARV (or lower based on damage).',
                'Single infill vacant lots: approximately 20-30% of ARV in median neighborhoods.',
                'Tenant cash-for-keys: LA County subtract $25K per unit; other counties subtract $15K per unit.',
            ],
        ]);

        const STRIKE_ZONE_CAVEATS_RESPONSE = fmt([
            '<strong>Strike-zone caveats and PASS rules:</strong>',
            [
                'PASS areas explicitly called out include: Oro Grande/El Mirage, Needles, Wonder Valley, Salton Sea, Blythe, Hollywood Hills.',
                'If property is rural or not in a standard housing tract, underwrite below listed max percentages.',
                'Mountain and view-driven markets can need lower buy % because rehab and access complexity rise (Big Bear/Lake Arrowhead/OC ocean view zones).',
                '55+ communities: stay on the lower side of area percentages.',
                'Close-to-water assets usually require wider spread and careful comping by view quality.',
                'For low-desert Riverside: if subject has no pool, use non-pool comps rather than forcing pool add-back.',
            ],
        ]);

        const STRIKE_ZONE_RULES = [
            { area: 'Rancho/Upland', county: 'San Bernardino', pct: '73%' },
            { area: 'Ontario/Montclair', county: 'San Bernardino', pct: '73%' },
            { area: 'Fontana/Rialto', county: 'San Bernardino', pct: '72%' },
            { area: 'San Bernardino', county: 'San Bernardino', pct: '72%' },
            { area: 'Colton/Loma Linda', county: 'San Bernardino', pct: '71%' },
            { area: 'Highland/Redlands', county: 'San Bernardino', pct: '71%' },
            { area: 'Yucaipa/Mentone', county: 'San Bernardino', pct: '72%' },
            { area: 'Victorville/Hesperia', county: 'San Bernardino', pct: '71%' },
            { area: 'Phelan/Pinon Hills', county: 'San Bernardino', pct: '64%' },
            { area: 'Apple Valley/Adelanto', county: 'San Bernardino', pct: '69%' },
            { area: 'Barstow/Helendale', county: 'San Bernardino', pct: '64%' },
            { area: 'Lucerne/Johnson Valley', county: 'San Bernardino', pct: '50%' },
            { area: 'Crestline/Cedar Pines/Twin Peaks', county: 'San Bernardino', pct: '65%' },
            { area: 'Big Bear Lake/City/Fawnskin', county: 'San Bernardino', pct: '68%' },
            { area: 'Arrowhead/Blue Jay/Twin Peaks', county: 'San Bernardino', pct: '65%' },
            { area: 'Sugarloaf/Angelus Oaks', county: 'San Bernardino', pct: '63%' },
            { area: 'Wrightwood/Lytle Creek', county: 'San Bernardino', pct: '65%' },
            { area: 'Morongo Valley', county: 'San Bernardino', pct: '45%' },
            { area: 'Yucca Valley', county: 'San Bernardino', pct: '60%' },
            { area: 'Joshua Tree', county: 'San Bernardino', pct: '60%' },
            { area: '29 Palms', county: 'San Bernardino', pct: '55%' },
            { area: 'Landers', county: 'San Bernardino', pct: '50%' },
            { area: 'Desert Hot Springs', county: 'Riverside', pct: '64%' },
            { area: 'Cathedral City', county: 'Riverside', pct: '65%' },
            { area: 'Palm Springs/Desert', county: 'Riverside', pct: '65%' },
            { area: 'Rancho Mirage/La Quinta', county: 'Riverside', pct: '65%' },
            { area: 'Coachella/Indio', county: 'Riverside', pct: '67%' },
            { area: '1000 Palms', county: 'Riverside', pct: '50%' },
            { area: 'Thermal', county: 'Riverside', pct: '45%' },
            { area: 'Beaumont/Cherry Valley', county: 'Riverside', pct: '68%' },
            { area: 'Banning', county: 'Riverside', pct: '67%' },
            { area: 'Hemet', county: 'Riverside', pct: '70%' },
            { area: 'San Jacinto', county: 'Riverside', pct: '70%' },
            { area: 'Riverside', county: 'Riverside', pct: '72%' },
            { area: 'Jurupa Valley/Norco', county: 'Riverside', pct: '69%' },
            { area: 'Corona/Eastvale', county: 'Riverside', pct: '71%' },
            { area: 'Moreno Valley/Perris', county: 'Riverside', pct: '72%' },
            { area: 'Lake Elsinore/Wildomar', county: 'Riverside', pct: '71%' },
            { area: 'Sun City/Menifee', county: 'Riverside', pct: '72%' },
            { area: 'Murrieta/Temecula', county: 'Riverside', pct: '73%' },
            { area: 'Winchester/French Valley', county: 'Riverside', pct: '72%' },
            { area: 'Anza/Aguanga/Sage', county: 'Riverside', pct: '55%' },
            { area: 'East Hemet/Valle Vista', county: 'Riverside', pct: '67%' },
            { area: 'Idyllwild/Pine Cove/Mtn. Center', county: 'Riverside', pct: '60%' },
            { area: 'Santa Ana', county: 'Orange', pct: '73%' },
            { area: 'Tustin/Yorba Linda', county: 'Orange', pct: '72%' },
            { area: 'Brea/Fullerton/La Habra', county: 'Orange', pct: '73%' },
            { area: 'Anaheim/Orange/Stanton', county: 'Orange', pct: '72%' },
            { area: 'Westminster/Fountain Valley', county: 'Orange', pct: '71%' },
            { area: 'Garden Grove/Harbor City', county: 'Orange', pct: '71%' },
            { area: 'Cerritos/La Palma', county: 'Orange', pct: '67%' },
            { area: 'Newport Beach', county: 'Orange', pct: '67%' },
            { area: 'Huntington Beach/Seal Beach', county: 'Orange', pct: '72%' },
            { area: 'Costa Mesa', county: 'Orange', pct: '71%' },
            { area: 'Corona Del Mar', county: 'Orange', pct: '63%' },
            { area: 'Irvine', county: 'Orange', pct: '71%' },
            { area: 'Mission Viejo/Aliso Viejo', county: 'Orange', pct: '72%' },
            { area: 'RSM/Lake Forest', county: 'Orange', pct: '71%' },
            { area: 'Ladera Ranch', county: 'Orange', pct: '70%' },
            { area: 'Coto de Caza', county: 'Orange', pct: '70%' },
            { area: 'Laguna Niguel', county: 'Orange', pct: '72%' },
            { area: 'Laguna Woods/Leisure World', county: 'Orange', pct: '69%' },
            { area: 'Dana Point', county: 'Orange', pct: '69%' },
            { area: 'San Juan Capistrano', county: 'Orange', pct: '69%' },
            { area: 'Laguna Beach', county: 'Orange', pct: '67%' },
            { area: 'San Clemente', county: 'Orange', pct: '68%' },
            { area: 'Silverado', county: 'Orange', pct: '62%' },
            { area: 'Trabuco Canyon', county: 'Orange', pct: '65%' },
            { area: 'Claremont', county: 'LA', pct: '72%' },
            { area: 'San Dimas/Charter Oak', county: 'LA', pct: '70%' },
            { area: 'Pomona', county: 'LA', pct: '70%' },
            { area: 'Glendora/Azusa', county: 'LA', pct: '69%' },
            { area: 'Walnut/Diamond Bar', county: 'LA', pct: '70%' },
            { area: 'W. Covina/Covina/Baldwin Park', county: 'LA', pct: '72%' },
            { area: 'Monrovia/Arcadia/Duarte', county: 'LA', pct: '69%' },
            { area: 'El Monte/S. El Monte/Rosemead', county: 'LA', pct: '70%' },
            { area: 'Monterey Park/Alhambra', county: 'LA', pct: '72%' },
            { area: 'San Gabriel/Temple City', county: 'LA', pct: '72%' },
            { area: 'Rowland & Hacienda Heights', county: 'LA', pct: '71%' },
            { area: 'Downey/Bell Gardens', county: 'LA', pct: '71%' },
            { area: 'Pico Rivera/Montebello', county: 'LA', pct: '70%' },
            { area: 'Whittier', county: 'LA', pct: '72%' },
            { area: 'Bellflower/Artesia', county: 'LA', pct: '72%' },
            { area: 'La Mirada/Norwalk', county: 'LA', pct: '73%' },
            { area: 'Lakewood', county: 'LA', pct: '72%' },
            { area: 'Long Beach', county: 'LA', pct: '71%' },
            { area: 'San Pedro', county: 'LA', pct: '71%' },
            { area: 'Southgate/Maywood', county: 'LA', pct: '72%' },
            { area: 'Huntington Park', county: 'LA', pct: '71%' },
            { area: 'Vernon/Commerce', county: 'LA', pct: '68%' },
            { area: 'East Los Angeles', county: 'LA', pct: '70%' },
            { area: 'Boyle/Lincoln Heights', county: 'LA', pct: '68%' },
            { area: 'El Sereno', county: 'LA', pct: '67%' },
            { area: 'Downtown', county: 'LA', pct: '60%' },
            { area: 'Koreatown/Wilshire', county: 'LA', pct: '60%' },
            { area: 'Pico Union', county: 'LA', pct: '60%' },
            { area: 'Hollywood', county: 'LA', pct: '67%' },
            { area: 'Los Feliz', county: 'LA', pct: '69%' },
            { area: 'Hancock Park', county: 'LA', pct: '69%' },
            { area: 'Mid-Wilshire/Beverly Grove', county: 'LA', pct: '67%' },
            { area: 'Mid-City', county: 'LA', pct: '65%' },
            { area: 'West Hollywood', county: 'LA', pct: '68%' },
            { area: 'Pasadena/S. Pasadena', county: 'LA', pct: '68%' },
            { area: 'Eagle Rock', county: 'LA', pct: '70%' },
            { area: 'Altadena', county: 'LA', pct: '70%' },
            { area: 'San Marino', county: 'LA', pct: '68%' },
            { area: 'La Canada/Flintridge', county: 'LA', pct: '70%' },
            { area: 'La Crescenta/Montrose', county: 'LA', pct: '70%' },
            { area: 'Highland Park/Glassell Park', county: 'LA', pct: '71%' },
            { area: 'Silverlake/Echo Park', county: 'LA', pct: '70%' },
            { area: 'Glendale/Atwater Village', county: 'LA', pct: '70%' },
            { area: 'Burbank', county: 'LA', pct: '70%' },
            { area: 'Toluca Lake/Studio City', county: 'LA', pct: '70%' },
            { area: 'Tujunga/Sunland', county: 'LA', pct: '68%' },
            { area: 'Pacoima/Panorama City', county: 'LA', pct: '68%' },
            { area: 'San Fernando/Sylmar', county: 'LA', pct: '72%' },
            { area: 'Granada Hills/North Hills', county: 'LA', pct: '70%' },
            { area: 'North Hollywood/Valley Glen', county: 'LA', pct: '72%' },
            { area: 'Sherman Oaks/Van Nuys', county: 'LA', pct: '70%' },
            { area: 'Reseda/Winnetka', county: 'LA', pct: '71%' },
            { area: 'Northridge/Chatsworth', county: 'LA', pct: '69%' },
            { area: 'Porter Ranch', county: 'LA', pct: '70%' },
            { area: 'Canoga Park/West Hills', county: 'LA', pct: '69%' },
            { area: 'Encino/Woodland Hills', county: 'LA', pct: '68%' },
            { area: 'Calabasas', county: 'LA', pct: '67%' },
            { area: 'Santa Clarita/Newhall', county: 'LA', pct: '72%' },
            { area: 'Canyon Country', county: 'LA', pct: '72%' },
            { area: 'Valencia/Saugus', county: 'LA', pct: '72%' },
            { area: 'Castaic', county: 'LA', pct: '70%' },
            { area: 'Acton', county: 'LA', pct: '65%' },
            { area: 'Lancaster', county: 'LA', pct: '70%' },
            { area: 'Palmdale', county: 'LA', pct: '70%' },
            { area: 'Quartz Hills', county: 'LA', pct: '68%' },
            { area: 'Lake LA', county: 'LA', pct: '67%' },
            { area: 'Beverly Hills/Brentwood', county: 'LA', pct: '69%' },
            { area: 'Westwood/Sawtelle', county: 'LA', pct: '68%' },
            { area: 'Century City', county: 'LA', pct: '68%' },
            { area: 'Malibu/Palisades', county: 'LA', pct: '63%' },
            { area: 'Santa Monica', county: 'LA', pct: '65%' },
            { area: 'Marina del Rey/Playa Vista', county: 'LA', pct: '68%' },
            { area: 'Venice', county: 'LA', pct: '65%' },
            { area: 'Mar Vista/Palms', county: 'LA', pct: '69%' },
            { area: 'Culver City', county: 'LA', pct: '68%' },
            { area: 'Westchester', county: 'LA', pct: '69%' },
            { area: 'Torrance/Carson', county: 'LA', pct: '71%' },
            { area: 'Hawthorne', county: 'LA', pct: '72%' },
            { area: 'Gardena/Lawndale', county: 'LA', pct: '72%' },
            { area: 'Lomita/Wilmington', county: 'LA', pct: '71%' },
            { area: 'El Segundo/Manhattan Beach', county: 'LA', pct: '69%' },
            { area: 'Redondo & Hermosa Beach', county: 'LA', pct: '69%' },
            { area: 'Rancho Palos Verdes', county: 'LA', pct: '67%' },
            { area: 'Compton/Rosewood/Watts', county: 'LA', pct: '71%' },
            { area: 'Inglewood', county: 'LA', pct: '69%' },
            { area: 'Ladera Heights/Windsor Hills', county: 'LA', pct: '67%' },
            { area: 'Leimert Park', county: 'LA', pct: '71%' },
            { area: 'Baldwin Hills', county: 'LA', pct: '65%' },
            { area: 'Hyde Park', county: 'LA', pct: '68%' },
            { area: 'South Los Angeles', county: 'LA', pct: '69%' },
            { area: 'Westmont', county: 'LA', pct: '71%' },
            { area: 'Moorpark/Simi Valley', county: 'Ventura', pct: '70%' },
            { area: 'Thousand Oaks', county: 'Ventura', pct: '70%' },
            { area: 'Westlake Village/Agoura Hills', county: 'Ventura', pct: '69%' },
            { area: 'Camarillo/Oxnard', county: 'Ventura', pct: '71%' },
            { area: 'Santa Paula/Fillmore', county: 'Ventura', pct: '69%' },
            { area: 'Ojai/Oak View', county: 'Ventura', pct: '67%' },
            { area: 'Ventura', county: 'Ventura', pct: '69%' },
            { area: 'Rancho Penasquitos', county: 'San Diego', pct: '60%' },
            { area: 'Poway', county: 'San Diego', pct: '72%' },
            { area: 'Carmel Valley', county: 'San Diego', pct: '63%' },
            { area: 'Vista/Oceanside/San Marcos', county: 'San Diego', pct: '71%' },
            { area: 'Fallbrook', county: 'San Diego', pct: '70%' },
            { area: 'Escondido', county: 'San Diego', pct: '62%' },
            { area: 'North Park', county: 'San Diego', pct: '70%' },
            { area: 'Hillcrest', county: 'San Diego', pct: '70%' },
            { area: 'South Park', county: 'San Diego', pct: '69%' },
            { area: 'City Heights', county: 'San Diego', pct: '63%' },
            { area: 'Normal Heights', county: 'San Diego', pct: '70%' },
            { area: 'Encanto/Skyline', county: 'San Diego', pct: '73%' },
            { area: 'Spring Valley', county: 'San Diego', pct: '73%' },
            { area: 'La Mesa', county: 'San Diego', pct: '68%' },
            { area: 'Lemon Grove', county: 'San Diego', pct: '66%' },
            { area: 'San Carlos', county: 'San Diego', pct: '73%' },
            { area: 'El Cajon', county: 'San Diego', pct: '69%' },
            { area: 'Point Loma', county: 'San Diego', pct: '72%' },
            { area: 'Ocean Beach', county: 'San Diego', pct: '71%' },
            { area: 'Pacific Beach', county: 'San Diego', pct: '72%' },
            { area: 'La Jolla', county: 'San Diego', pct: '63%' },
            { area: 'Carlsbad', county: 'San Diego', pct: '66%' },
            { area: 'Clairemont', county: 'San Diego', pct: '70%' },
            { area: 'Linda Vista', county: 'San Diego', pct: '73%' },
            { area: 'Serra Mesa', county: 'San Diego', pct: '73%' },
            { area: 'Tierrasanta', county: 'San Diego', pct: '68%' },
            { area: 'National City', county: 'San Diego', pct: '70%' },
            { area: 'Chula Vista (West)', county: 'San Diego', pct: '73%' },
            { area: 'Barrio Logan', county: 'San Diego', pct: '65%' },
            { area: 'Imperial Valley (El Centro area)', county: 'Imperial', pct: '65%' },
            { area: 'Bakersfield', county: 'Kern', pct: '68%' },
            { area: 'McFarland', county: 'Kern', pct: '65%' },
            { area: 'Tehachapi/Mojave/Edwards', county: 'Kern', pct: '65%' },
            { area: 'Ridgecrest', county: 'Kern', pct: '65%' },
            { area: 'California City', county: 'Kern', pct: '65%' },
            { area: 'Lake Isabella', county: 'Kern', pct: '65%' },
            { area: 'Sacramento', county: 'Sacramento', pct: '70%' },
            { area: 'Rancho Cordova', county: 'Sacramento', pct: '69%' },
            { area: 'Orangevale/Folsom', county: 'Sacramento', pct: '67%' },
            { area: 'Citrus Heights/North Highlands', county: 'Sacramento', pct: '70%' },
            { area: 'Elk Grove', county: 'Sacramento', pct: '69%' },
            { area: 'Galt', county: 'Sacramento', pct: '67%' },
            { area: 'Rancho Murrieta', county: 'Sacramento', pct: '70%' },
            { area: 'Fresno', county: 'Fresno', pct: '68%' },
            { area: 'Coalinga', county: 'Fresno', pct: '60%' },
            { area: 'Kerman', county: 'Fresno', pct: '65%' },
            { area: 'Selma', county: 'Fresno', pct: '65%' },
            { area: 'Sanger', county: 'Fresno', pct: '65%' },
        ];

        function lookupStrikeZones(question) {
            const q = String(question || '').toLowerCase();
            if (!q) {
                return [];
            }

            const tokens = q.split(/[^a-z0-9]+/).filter(token => token.length >= 4);
            const hits = STRIKE_ZONE_RULES.filter(entry => {
                const hay = `${entry.area} ${entry.county}`.toLowerCase();
                if (hay.includes(q)) {
                    return true;
                }
                return tokens.some(token => hay.includes(token));
            });

            return hits.slice(0, 12);
        }

        function buildStrikeZoneResponse(question) {
            const matches = lookupStrikeZones(question);
            if (matches.length === 0) {
                return fmt([
                    'I loaded the FAST BRIDGE GROUP strike-zone table, but I did not find an exact area match in your question.',
                    [
                        'Try a city/area name exactly as used in your playbook (example: "Rancho/Upland", "North Hollywood/Valley Glen", "Poway").',
                        'You can also ask by county plus city (example: "Riverside Menifee strike zone").',
                    ],
                ]);
            }

            return fmt([
                '<strong>SoCal Buy % Strike Zone (2024 Q1/Q2) matches:</strong>',
                matches.map(item => `${item.area} (${item.county} County): <strong>${item.pct}</strong>`),
                'Use these as max buy % before your fee and before property-specific deductions/adjustments.',
            ]);
        }

        const KB = [
            {
                patterns: [/how.*(structure|write|make|submit|craft).*(first|initial|opening)?\s*offer/i, /ofirst offer/i, /structure.*offer/i, /purchase price/i, /offer price/i],
                response: fmt([
                    'Structuring a strong first offer comes down to three pillars: <strong>pricing discipline, term clarity, and proof of strength.</strong>',
                    [
                        '<strong>Anchor on ARV minus repairs minus profit margin.</strong> Do not guess — pull closed comps within the last 120 days, same bed/bath, within half a mile. Your max allowable offer (MAO) = ARV × 0.70 − estimated repairs.',
                        '<strong>Set your escrow timeline to 21–30 days</strong> unless the seller signals a different preference. Shorter close is often valued as highly as price.',
                        '<strong>Lead with clean terms.</strong> A non-contingent or inspection-only offer (with a short window like 7–10 days) reads as more serious than a heavily contingent one.',
                        '<strong>Include proof of funds</strong> — a bank statement or LOC letter. Agents often show this to listing agents before price is even discussed.',
                        '<strong>Write a personal letter if it is an off-market deal.</strong> Seller motivation matters. Addressing their timeline, remaining belongings, or moving situation can win a deal at equal price.',
                        '<strong>Leave room to negotiate.</strong> Start 5–8% below your walk-away number so you have room to counter without giving away margin.',
                    ],
                    'After submitting, follow up with the listing agent within 24 hours. Confirm receipt, reiterate your ability to close, and ask if there are any terms that could make the offer more attractive. That one call wins more deals than most investors realize.',
                ])
            },
            {
                patterns: [/comp|comparable|arv|after.?repair|sqft|square foot|market value|valuation|price per/i],
                response: fmt([
                    'Running accurate comps is the single most important skill in residential investing. Here is a reliable framework:',
                    [
                        '<strong>Start tight, then expand.</strong> Search within 0.25 miles first. If fewer than 3 sold comps appear, expand to 0.5 miles. Beyond that, you need to start adjusting for neighborhood variance.',
                        '<strong>Filter to the last 90–180 days.</strong> In fast-moving markets use 60 days. In slow markets you may need 12 months — but discount older comps at 0.5% per month of age.',
                        '<strong>Match bed/bath count and property type</strong> (SFR vs. condo vs. townhome). Never mix attached and detached.',
                        '<strong>Square footage within 20% is the rule.</strong> Apply a price-per-sqft adjustment for anything outside that range.',
                        '<strong>Condition matters.</strong> Compare renovated-to-subject. If your subject is a dated interior and comps are fully upgraded, discount ARV by 5–10% unless you plan a full remodel.',
                        '<strong>Garage, lot size, and pool</strong> can each shift value by $10K–$40K depending on the market. Account for them explicitly.',
                    ],
                    'Once you have 3–5 solid comps, calculate a price per sqft range. Weight the most similar comp at 40%, the next two at 25% each, and the outlier at 10%. This gives you a defensible ARV you can show lenders or partners.',
                ])
            },
            {
                patterns: [/agent.*(call|script|questions|talk|contact|outreach)|call script|what (should|to) (ask|say|tell)|listing agent|buyer.?s agent/i],
                response: fmt([
                    'A great agent call is an intelligence-gathering mission, not a sales pitch. Go in with your questions ready and let them talk.',
                    '<strong>Opening:</strong> "Hi [Name], I am a local investor interested in [Address]. I have reviewed the listing — do you have 3 minutes?" This respects their time and positions you as prepared.',
                    '<strong>Key questions to work through:</strong>',
                    [
                        '<strong>Seller motivation & timeline:</strong> "What is driving the seller\'s timeline?" — relocation, estate, financial pressure, or just testing the market each tells you something different.',
                        '<strong>Days on market & prior activity:</strong> "Have there been other offers?" If yes: "What kept those from closing?" This is gold.',
                        '<strong>Known repairs or disclosures:</strong> "Is the seller aware of any deferred maintenance or open permits?" Agents must disclose material facts.',
                        '<strong>Seller preferences on terms:</strong> "Does the seller have a preferred close date or specific terms in mind?" Aligning on terms can close a deal before price is even discussed.',
                        '<strong>Price flexibility:</strong> "Is the seller firm on price, or open to reasonable offers?" This is a soft read on negotiating room.',
                        '<strong>Disclosure package:</strong> "Can you send over disclosures and the preliminary title report today?" Speed signals seriousness.',
                    ],
                    'Close with: "I plan to submit an offer by [date]. Is there anything else I should know that would help me write a strong, clean offer?" — this one sentence tells the agent you are committed and invites them to coach you toward a win.',
                ])
            },
            {
                patterns: [/negotiat|counter.?offer|counter|back.?and.?forth|push back|accept|rejection|they came back|seller won.?t/i],
                response: fmt([
                    'Negotiation in real estate is more about terms and psychology than raw price. Here is how experienced investors approach it:',
                    [
                        '<strong>Trade terms before dollars.</strong> A shorter inspection window, rent-back for the seller, or flexible possession date can be worth $5K–$15K to motivated sellers — at zero cost to you.',
                        '<strong>Respond to counters quickly.</strong> Speed signals seriousness. A same-day counter keeps momentum; a 3-day delay lets doubt creep in.',
                        '<strong>Never counter at your max.</strong> Always hold $2K–$5K in reserve. If you are at your walk-away number and still $10K apart, sharpen pencil on repair credits instead of post-close price.',
                        '<strong>Repair credits over price reductions.</strong> A $5K repair credit costs you $5K. A $5K price reduction costs you $5K now but also builds into your comps, title, and potentially property taxes.',
                        '<strong>The "final best" move.</strong> After 2–3 rounds, send a brief, direct note: "We have simplified our offer as much as we can while keeping the deal viable for us. [Price] is our best and final — all cash, [close date], no further contingencies." Certainty often closes deals.',
                        '<strong>Know your MAO and walk away from it.</strong> Every dollar above your number is borrowed from your profit. Discipline here separates investors from collectors.',
                    ],
                    'If a deal falls apart, ask the agent to keep you as a backup. Roughly 15–20% of accepted offers fall out of escrow — being the first call when that happens costs nothing and wins deals.',
                ])
            },
            {
                patterns: [/inspection|due diligence|repair estimate|contractor|scope of work|rehab cost|budget|fix.?up|renovation/i],
                response: fmt([
                    'Inspection and due diligence is where deals are made or lost. Do not rush this phase — it is your last clean window to confirm your numbers.',
                    [
                        '<strong>Order inspection within 48 hours of acceptance.</strong> Use a licensed inspector you trust, not the cheapest one. A missed foundation issue or unpermitted addition can destroy a deal post-close.',
                        '<strong>Attend the inspection in person.</strong> Your inspector works for you. Walking the property together turns a 30-page report into a prioritized repair list.',
                        '<strong>Separate cosmetic from structural.</strong> Roofs, foundations, HVAC, electrical panels, and plumbing are cash-intensive. Paint, flooring, and fixtures are not. Price your offer around the former.',
                        '<strong>Get a contractor walkthrough before end of contingency.</strong> Ideally, bring your contractor for 30 minutes on-site and get a rough scope. Experienced investors do not rely on inspector estimates for repair budgets.',
                        '<strong>Request a repair credit for anything discovered.</strong> Even in as-is deals you can renegotiate based on inspection findings. Be specific: itemize the issues by category and present a contractor quote.',
                        '<strong>Check permits and title simultaneously.</strong> Open permits, unpermitted additions, or title clouds found during due diligence can be deal-killers — or bargaining chips.',
                    ],
                    'A solid due diligence checklist: inspection report, contractor scope + budget, title report review, HOA docs (if applicable), utility bills, and a quick rent or resale market check. Do not close until all five are green.',
                ])
            },
            {
                patterns: [/exit strategy|flip|rental|hold|brrrr|wholesale|assign|exit|buy.?and.?hold|cash flow|roi|return/i],
                response: fmt([
                    'Choosing the right exit strategy before you make an offer is critical — your numbers, financing, and target price all change depending on the exit.',
                    [
                        '<strong>Fix & Flip:</strong> Target 70% ARV rule or tighter. Account for holding costs (financing, taxes, insurance, utilities) at 1–2% of purchase price per month. Plan your sale price conservatively — usually 3–5% below top-of-market comp to sell in 30 days.',
                        '<strong>Buy & Hold / Rental:</strong> Run the 1% rule as a quick filter (monthly rent ≥ 1% of all-in cost). Then stress-test with Cap Rate, cash-on-cash return, and DSCR if using financing. Budget 10% vacancy, 10% management, and 10% maintenance annually.',
                        '<strong>BRRRR:</strong> Buy, Rehab, Rent, Refinance, Repeat. The number that matters most is the after-repair value — your cash-out refi is capped at 70–75% LTV. Model the refi carefully before buying.',
                        '<strong>Wholesale / Assignment:</strong> Find the spread between your contracted price and what an end buyer will pay. Know your buyer list and their buy criteria before you lock up deals.',
                        '<strong>Subject-To or Seller Finance:</strong> Powerful tools for off-market deals where sellers have equity but do not want a lump sum. Structure wraparound or installment terms around their existing mortgage if applicable.',
                    ],
                    'Always model two exit scenarios before buying: your preferred exit and a fallback. If the numbers only work on one path, you are taking on more risk than most investors realize.',
                ])
            },
            {
                patterns: [/financing|loan|hard money|lender|interest rate|points|bridge loan|private money|dscr|leverage|down payment|ltv/i],
                response: fmt([
                    'Financing strategy can make or break a deal\'s profitability. Here is how to think through it:',
                    [
                        '<strong>Hard Money:</strong> Fast, asset-based, typically 70–80% LTV on ARV. Expect 10–13% interest + 2–4 points. Use for short-term flips where speed beats cost.',
                        '<strong>DSCR Loans:</strong> Qualify based on property income, not personal income. Great for buy-and-hold investors with multiple properties. Rates run 1–2% above conventional.',
                        '<strong>Private Money:</strong> Cheapest and most flexible option when you have it. Build relationships with private lenders by showing a clear track record and presenting deals with full pro formas.',
                        '<strong>Conventional / Portfolio Loans:</strong> Best rates but slower and harder to qualify for on investment properties. Use for stabilized rentals after a BRRRR refi.',
                        '<strong>Line of Credit / HELOC:</strong> Bridge financing using equity in existing properties. Useful for down payments or funding short rehabs.',
                        '<strong>Points vs. Rate tradeoff:</strong> On a 6-month flip, paying 2 extra points to drop the rate 1.5% rarely pencils. Run the math — total interest cost, not monthly payment, is what matters.',
                    ],
                    'Always get two competing lender quotes. Lenders know you are shopping and will sharpen their terms. Even 0.5% difference in rate or 1 point saved on a $400K loan is $2,000–$4,000 in your pocket.',
                ])
            },
            {
                patterns: [/deal analysis|analyse|analyze|underwrite|underwriting|pro forma|spreadsheet|numbers|pencil|does it work|make sense/i],
                response: fmt([
                    'A clean deal analysis covers five numbers. If any one of them is a guess, your whole model is at risk.',
                    [
                        '<strong>1. ARV (After-Repair Value):</strong> Pulled from closed comps, not Zestimates. This is your ceiling.',
                        '<strong>2. All-in Acquisition Cost:</strong> Purchase price + closing costs (2–3%) + financing fees.',
                        '<strong>3. Rehab Budget:</strong> Contractor scope, line-item. Add a 10–15% contingency for surprises.',
                        '<strong>4. Holding Costs:</strong> Monthly financing cost × projected hold period + taxes + insurance + utilities.',
                        '<strong>5. Net Profit / Cash-on-Cash Return:</strong> For flips: Sale price − agent commission (5–6%) − all-in cost. For rentals: Annual net operating income / total cash invested.',
                    ],
                    'A healthy flip in most markets targets a minimum $40K–$50K net profit or 20% ROI, whichever is higher. Below that, you are one contractor delay or slow market away from breaking even. On rentals, 8–10% cash-on-cash return is considered solid. Under 6%, the risk-reward may not justify locking up capital.',
                ])
            },
            {
                patterns: [/market|neighborhood|area|zip code|location|where to buy|best market|market trend|appreciation|rent growth/i],
                response: fmt([
                    'Picking the right market is as important as picking the right deal. Here is a framework:',
                    [
                        '<strong>Supply & demand signals:</strong> Days on market trending down = more demand than supply. Inventory below 2 months = seller\'s market. Both are good for appreciation but tough on acquisition price.',
                        '<strong>Population and job growth:</strong> Markets with 2%+ annual population growth and net migration from higher-cost metros tend to sustain rent and price appreciation. Check Census and Bureau of Labor Statistics data.',
                        '<strong>Rent-to-price ratios:</strong> The higher the gross rent multiplier, the harder it is to cash flow. Markets in the Sun Belt and Midwest often pencil better for rental yield than coastal metros.',
                        '<strong>Crime and school ratings:</strong> These are the two biggest drivers of long-term exit value. "B" neighborhoods — not warzone, not luxury — typically offer the best balanced returns for investors.',
                        '<strong>Landlord-friendly laws:</strong> Understand eviction timelines and rent control rules in your target market. A 12-month eviction process in a high-rent-control city can wipe out a year of cash flow.',
                    ],
                    'If you are investing out of state, build a local team first: a property manager, a contractor, and a deal-savvy agent. The market means nothing without boots on the ground you trust.',
                ])
            },
            {
                patterns: [/pipeline|track|deal flow|crm|follow.?up|lead|prospect|off.?market/i],
                response: fmt([
                    'A consistent deal pipeline is built on discipline, not luck. Here is how to manage it:',
                    [
                        '<strong>Log every lead immediately.</strong> If it is not in your system (CRM, spreadsheet, or notes), it does not exist. Include source, address, status, and last contact date.',
                        '<strong>Set follow-up triggers at 30/60/90 days.</strong> Most off-market leads convert on the 3rd or 4th touchpoint, not the first. The investor who follows up consistently outlasts everyone else.',
                        '<strong>Segment by deal stage:</strong> New leads, contacted, under analysis, offer out, under contract, closed. Reviewing each bucket weekly keeps deals from falling through the cracks.',
                        '<strong>Track your conversion rates.</strong> If you know that 1 in 20 leads becomes an offer and 1 in 5 offers closes, you know exactly how much lead volume you need to hit your acquisition goals.',
                        '<strong>Agent Notes on this dashboard</strong> connects your properties to your call outcomes. Use it after every agent conversation so your pipeline has context, not just addresses.',
                    ],
                    'One disciplined follow-up with a seller who said "not yet" six months ago regularly produces the best deals at the best prices. Time softens asking prices and builds trust — use both.',
                ])
            },
            {
                patterns: [/tax|depreciation|1031|capital gain|cost segregation|deduction|write.?off|llc|entity|structure/i],
                response: fmt([
                    'Tax strategy is one of the highest-leverage tools in real estate investing — but always verify specifics with a CPA who specializes in real estate.',
                    [
                        '<strong>Depreciation:</strong> Residential rental properties depreciate over 27.5 years. On a $300K building value (excluding land) that is ~$10,900/year in paper losses, which offsets rental income.',
                        '<strong>Cost Segregation:</strong> Accelerates depreciation on components (appliances, flooring, fixtures) to 5–7 years instead of 27.5. Can generate $30K–$80K in first-year deductions on a rehab. Worth the study cost on any property over $500K all-in.',
                        '<strong>1031 Exchange:</strong> Defer capital gains indefinitely by rolling proceeds into a like-kind property within 180 days (45-day identification window applies). Must use a qualified intermediary.',
                        '<strong>LLC Structure:</strong> Most investors hold rentals in LLCs for liability protection. Talk to an attorney about series LLCs or holdings structures across markets.',
                        '<strong>Short-Term Rental exception:</strong> If you materially participate in an STR and it qualifies, losses may offset W-2 income — a powerful benefit not available with long-term rentals unless you qualify as a Real Estate Professional.',
                    ],
                    'Work with a CPA who owns investment real estate, not just one who files returns. The difference in tax strategy between those two is often $10K–$30K per year.',
                ])
            },
            {
                patterns: [/hello|hi |hey |good morning|good afternoon|start|help me|what can you|how does this work/i],
                response: fmt([
                    'Hey! I am your in-dashboard real estate investment assistant. I can help you think through deals, sharpen your strategy, and answer investor questions in depth.',
                    '<strong>Topics I cover well:</strong>',
                    [
                        'Structuring and pricing offers',
                        'Running comps and calculating ARV',
                        'Agent call scripts and outreach strategy',
                        'Negotiation tactics and counter-offer frameworks',
                        'Due diligence, inspection, and repair budgeting',
                        'Exit strategies: flip, rental, BRRRR, wholesale',
                        'Financing options: hard money, DSCR, private money',
                        'Deal analysis and underwriting',
                        'Market selection and pipeline management',
                        'Tax strategy basics (depreciation, 1031, LLC)',
                    ],
                    'Ask me anything — the more specific your question, the more useful my answer will be.',
                ])
            },
        ];

        function buildResponse(question) {
            const q = String(question || '');

            if (/appraisal rule|comp rule|comps? rule|cross.*major road|same subdivision|90 days|lot size/i.test(q)) {
                return APPRAISAL_RULES_RESPONSE;
            }

            if (/adjustment|bedroom|bath|garage|pool|carport|siding|backing|fronting|busy street|freeway|adu/i.test(q)) {
                return ADJUSTMENT_RULES_RESPONSE;
            }

            if (/additional adjustment|cash for keys|manufactured|fire damage|teardown|infill lot|off.?market|major street|mfr/i.test(q)) {
                return ADDITIONAL_ADJUSTMENTS_RESPONSE;
            }

            if (/pass area|pass on|rural|55\+|ocean view|mountain|close to water|hollywood hills|wonder valley|blythe|salton sea|needles|oro grande|el mirage/i.test(q)) {
                return STRIKE_ZONE_CAVEATS_RESPONSE;
            }

            if (/strike zone|buy %|buy percent|max %|max percent|county|rancho|upland|fontana|riverside|orange county|la county|san diego|ventura|kern|sacramento|fresno/i.test(q)) {
                const strikeResponse = buildStrikeZoneResponse(q);
                if (strikeResponse) {
                    return strikeResponse;
                }
            }

            for (const entry of KB) {
                for (const pattern of entry.patterns) {
                    if (pattern.test(q)) {
                        return entry.response;
                    }
                }
            }
            return fmt([
                'That is a great question. While I did not find an exact match in my knowledge base, here are some suggestions:',
                [
                    'Try rephrasing with more specific terms — e.g., "How do I evaluate comps?" or "What should I ask a listing agent on the first call?"',
                    'I cover: offers, ARV & comps, agent calls, negotiation, inspections, exit strategies, financing, deal analysis, market selection, pipeline, and tax basics.',
                    'If your question is highly specific to a market or deal, consider cross-referencing with your local MLS data or a trusted local agent.'
                ],
                'Try one of the quick-reply chips above to see sample responses, or rephrase and I will do my best.',
            ]);
        }

        async function requestAiResponse(question) {
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({ question })
            });

            if (!response.ok) {
                const fallbackError = await response.json().catch(() => ({}));
                throw new Error(fallbackError.error || 'AI request failed');
            }

            const payload = await response.json();
            const answer = String(payload?.answer || '').trim();
            if (!answer) {
                throw new Error('AI response was empty');
            }

            return {
                answer,
                provider: String(payload?.provider || '').trim(),
                model: String(payload?.model || '').trim()
            };
        }

        async function ask(question) {
            const text = String(question || '').trim();
            if (!text) {
                return;
            }

            pushMessage('user', `<p>${text}</p>`);
            const typingEl = showTyping();

            try {
                const aiResponse = await requestAiResponse(text);
                typingEl.remove();
                const modelLabel = aiResponse.model || 'AI model live';
                setAiStatus(`Live model: ${modelLabel}`, 'live');
                pushMessage('assistant', wrapAiResponseMessage(aiResponse.answer, modelLabel));
                return;
            } catch (error) {
                // Fall through to built-in assistant knowledge when API is unavailable.
            }

            window.setTimeout(() => {
                typingEl.remove();
                setAiStatus('Local FAST backup guidance active', 'fallback');
                pushMessage('assistant', buildResponse(text));
            }, 420);
        }

        form.addEventListener('submit', event => {
            event.preventDefault();
            ask(input.value);
            input.value = '';
            input.focus();
        });

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                ask(chip.dataset.chatgptQuestion || '');
            });
        });
    }

    function initDailyBibleVerseWidget() {
        const verseTextEl = document.getElementById('daily-verse-text');
        const verseReferenceEl = document.getElementById('daily-verse-reference');
        const dateLabelEl = document.getElementById('daily-verse-date-label');

        if (!verseTextEl || !verseReferenceEl || !dateLabelEl || BIBLE_MEMORY_VERSES.length === 0) {
            return;
        }

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const oneDayMs = 24 * 60 * 60 * 1000;
        const dayOfYear = Math.floor((now - startOfYear) / oneDayMs);
        const dailyIndex = (now.getFullYear() * 366 + dayOfYear) % BIBLE_MEMORY_VERSES.length;
        const dailyVerse = BIBLE_MEMORY_VERSES[dailyIndex];

        verseTextEl.textContent = dailyVerse.text;
        verseReferenceEl.textContent = dailyVerse.reference;
        dateLabelEl.textContent = `Verse for ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`;
    }

    // ============================================
    // Personal Outreach Workspace
    // ============================================
    function initPersonalOutreachWorkspace() {
        const templateTitleInput = document.getElementById('template-title-input');
        const templateBodyInput = document.getElementById('template-body-input');
        const saveTemplateButton = document.getElementById('save-template-btn');
        const templateList = document.getElementById('template-list');

        const scriptTitleInput = document.getElementById('script-title-input');
        const scriptBodyInput = document.getElementById('script-body-input');
        const saveScriptButton = document.getElementById('save-script-btn');
        const scriptList = document.getElementById('script-list');

        if (!templateTitleInput || !templateBodyInput || !saveTemplateButton || !templateList || !scriptTitleInput || !scriptBodyInput || !saveScriptButton || !scriptList) {
            return;
        }

        const TEMPLATE_KEY = 'agentTemplatesByUser';
        const SCRIPT_KEY = 'callScriptsByUser';

        const workspaceUser = getWorkspaceUserContext();
        const templateOwnerLabel = document.getElementById('template-owner-label');
        const scriptOwnerLabel = document.getElementById('script-owner-label');
        if (templateOwnerLabel) {
            templateOwnerLabel.textContent = `Workspace owner: ${workspaceUser.name}`;
        }
        if (scriptOwnerLabel) {
            scriptOwnerLabel.textContent = `Workspace owner: ${workspaceUser.name}`;
        }

        function getItems(key) {
            return getUserScopedItems(key, workspaceUser.key);
        }

        function setItems(key, items) {
            setUserScopedItems(key, workspaceUser.key, items);
        }

        async function copyText(value) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                    return true;
                }
            } catch (error) {
                // Fall back to execCommand.
            }

            const helper = document.createElement('textarea');
            helper.value = value;
            helper.style.position = 'fixed';
            helper.style.opacity = '0';
            document.body.appendChild(helper);
            helper.focus();
            helper.select();

            let copied = false;
            try {
                copied = document.execCommand('copy');
            } catch (error) {
                copied = false;
            }

            helper.remove();
            return copied;
        }

        function createItemMarkup(item, itemType) {
            const wrapper = document.createElement('article');
            wrapper.className = 'outreach-item';

            const publishLabel = item.published ? 'Published' : 'Draft';
            const publishClass = item.published ? 'published' : 'draft';

            wrapper.innerHTML = `
                <div class="outreach-item-head">
                    <span class="outreach-item-title">${item.title}</span>
                    <span class="outreach-status ${publishClass}">${publishLabel}</span>
                </div>
                <p class="outreach-item-body">${item.body}</p>
                <div class="outreach-item-actions">
                    <button type="button" class="card-btn outreach-copy-btn">Copy</button>
                    <button type="button" class="card-btn outreach-publish-btn">${item.published ? 'Unpublish' : 'Publish'}</button>
                    <button type="button" class="card-btn outreach-delete-btn">Delete</button>
                </div>
            `;

            const copyButton = wrapper.querySelector('.outreach-copy-btn');
            const publishButton = wrapper.querySelector('.outreach-publish-btn');
            const deleteButton = wrapper.querySelector('.outreach-delete-btn');

            if (copyButton) {
                copyButton.addEventListener('click', async () => {
                    const copied = await copyText(item.body);
                    if (copied) {
                        showDashboardToast('success', 'Copied', `${itemType} copied for sharing.`);
                    } else {
                        showDashboardToast('error', 'Copy Failed', 'Unable to copy text in this browser.');
                    }
                });
            }

            if (publishButton) {
                publishButton.addEventListener('click', () => {
                    const key = itemType === 'Template' ? TEMPLATE_KEY : SCRIPT_KEY;
                    const items = getItems(key).map(entry => {
                        if (entry.id === item.id) {
                            return { ...entry, published: !entry.published };
                        }
                        return entry;
                    });
                    setItems(key, items);
                    if (itemType === 'Template') {
                        renderTemplates();
                    } else {
                        renderScripts();
                    }
                });
            }

            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    const key = itemType === 'Template' ? TEMPLATE_KEY : SCRIPT_KEY;
                    const items = getItems(key).filter(entry => entry.id !== item.id);
                    setItems(key, items);
                    if (itemType === 'Template') {
                        renderTemplates();
                    } else {
                        renderScripts();
                    }
                });
            }

            return wrapper;
        }

        function renderTemplates() {
            const items = getItems(TEMPLATE_KEY);
            templateList.innerHTML = '';
            if (items.length === 0) {
                templateList.innerHTML = '<p class="outreach-empty">No templates yet.</p>';
                return;
            }

            items.slice().sort((a, b) => b.updatedAt - a.updatedAt).forEach(item => {
                templateList.appendChild(createItemMarkup(item, 'Template'));
            });
        }

        function renderScripts() {
            const items = getItems(SCRIPT_KEY);
            scriptList.innerHTML = '';
            if (items.length === 0) {
                scriptList.innerHTML = '<p class="outreach-empty">No scripts yet.</p>';
                return;
            }

            items.slice().sort((a, b) => b.updatedAt - a.updatedAt).forEach(item => {
                scriptList.appendChild(createItemMarkup(item, 'Script'));
            });
        }

        saveTemplateButton.addEventListener('click', () => {
            const title = templateTitleInput.value.trim();
            const body = templateBodyInput.value.trim();

            if (!title || !body) {
                showDashboardToast('error', 'Template Required', 'Add both a title and message to save a template.');
                return;
            }

            const items = getItems(TEMPLATE_KEY);
            items.push({
                id: `tpl-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                title,
                body,
                published: false,
                updatedAt: Date.now()
            });

            setItems(TEMPLATE_KEY, items);
            templateTitleInput.value = '';
            templateBodyInput.value = '';
            renderTemplates();
            showDashboardToast('success', 'Template Saved', 'Your personal agent template was saved.');
        });

        saveScriptButton.addEventListener('click', () => {
            const title = scriptTitleInput.value.trim();
            const body = scriptBodyInput.value.trim();

            if (!title || !body) {
                showDashboardToast('error', 'Script Required', 'Add both a title and script body to save.');
                return;
            }

            const items = getItems(SCRIPT_KEY);
            items.push({
                id: `scr-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                title,
                body,
                published: false,
                updatedAt: Date.now()
            });

            setItems(SCRIPT_KEY, items);
            scriptTitleInput.value = '';
            scriptBodyInput.value = '';
            renderScripts();
            showDashboardToast('success', 'Script Saved', 'Your personal call script was saved.');
        });

        renderTemplates();
        renderScripts();
    }

    function initAgentNotesWidget() {
        const notesList = document.getElementById('dashboard-agent-notes-list');
        if (!notesList) {
            return;
        }

        const workspaceUser = getWorkspaceUserContext();
        const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
        const notes = getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key)
            .slice()
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        notesList.innerHTML = '';
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="outreach-empty">No agent notes yet.</p>';
            return;
        }

        notes.slice(0, 12).forEach(note => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'agent-note-link';

            const timestamp = Number(note.createdAt) || Date.now();
            const timeLabel = new Date(timestamp).toLocaleString();
            const agentName = String(note.agentName || 'Agent').trim();
            const propertyAddress = String(note.propertyAddress || 'Property not specified').trim();
            const propertyKey = propertyAddress.toLowerCase();
            const noteText = String(note.note || '').trim();
            const noteStatusValue = String(scopedStatuses[propertyKey] || note.piqAgentStatus || note.propertySnapshot?.piqAgentStatus || 'none');
            const noteStatusLabel = formatAgentStatusLabel(noteStatusValue);

            const head = document.createElement('div');
            head.className = 'agent-note-link-head';

            const agentText = document.createElement('span');
            agentText.className = 'agent-note-link-agent';
            agentText.textContent = agentName;

            const timeText = document.createElement('span');
            timeText.className = 'agent-note-link-time';
            timeText.textContent = timeLabel;

            const addressText = document.createElement('p');
            addressText.className = 'agent-note-link-address';
            addressText.textContent = propertyAddress;

            const statusText = document.createElement('p');
            statusText.className = 'agent-note-link-status';
            statusText.textContent = `Agent Status: ${noteStatusLabel}`;

            const bodyText = document.createElement('p');
            bodyText.className = 'agent-note-link-body';
            bodyText.textContent = noteText || 'Open property details';

            head.appendChild(agentText);
            head.appendChild(timeText);
            button.appendChild(head);
            button.appendChild(addressText);
            button.appendChild(statusText);
            button.appendChild(bodyText);

            button.addEventListener('click', () => {
                const fallbackStatus = String(scopedStatuses[propertyKey] || note.piqAgentStatus || 'none');
                const payload = note.propertySnapshot || {
                    address: propertyAddress,
                    propertyImages: [],
                    propertyDetails: '',
                    listPrice: '$0',
                    propensity: 0,
                    moderatePain: '-',
                    taxDelinquency: '-',
                    highDebt: '-',
                    marketInfo: '-',
                    dom: 0,
                    cdom: 0,
                    askingVsArv: '0.00%',
                    arv: '$0',
                    compData: '-',
                    piqAgentStatus: fallbackStatus,
                    piq: 'About property notes will appear here.',
                    comps: '',
                    ia: 'IA tab content placeholder.',
                    agentRecord: {
                        name: agentName,
                        title: 'Agent Record',
                        phone: note.agentPhone || '-',
                        email: note.agentEmail || '-',
                        brokerage: note.agentBrokerage || '-',
                        lastCommunicationDate: '-',
                        lastAddressDiscussed: propertyAddress,
                        lastCommunicatedAA: '-',
                        activeInLast2Years: '-',
                        averageDealsPerYear: '-',
                        doubleEnded: '-',
                        investorSource: '-'
                    },
                    offer: 'Offer tab content placeholder.'
                };

                payload.piqAgentStatus = String(fallbackStatus || payload.piqAgentStatus || 'none').trim().toLowerCase() || 'none';
                payload.agentRecord = {
                    ...(payload.agentRecord || {}),
                    agentStatus: formatAgentStatusLabel(payload.piqAgentStatus)
                };

                localStorage.setItem('selectedPropertyDetail', JSON.stringify(payload));
                window.location.href = 'property-details.html';
            });

            notesList.appendChild(button);
        });
    }

    function initAdminUserManager() {
        const usersList = document.getElementById('admin-users-list');
        if (!usersList) {
            return;
        }

        const panel = document.getElementById('admin-account-panel');
        const subtitle = document.getElementById('account-manager-subtitle');
        const createButton = document.getElementById('admin-create-user-btn');
        const refreshButton = document.getElementById('admin-refresh-users-btn');
        const migrateDomainButton = document.getElementById('admin-migrate-domain-btn');
        const nameInput = document.getElementById('admin-new-user-name');
        const emailInput = document.getElementById('admin-new-user-email');
        const passwordInput = document.getElementById('admin-new-user-password');
        const roleInput = document.getElementById('admin-new-user-role');
                const nextDomain = 'fastbridgegroupllc.com';
        let loadedUsers = [];

        const token = localStorage.getItem('authToken');
        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            currentUser = null;
        }

        if (!currentUser || currentUser.role !== 'admin') {
            if (panel) {
                panel.style.display = 'none';
            }
            if (subtitle) {
                subtitle.textContent = 'Only admin accounts can create or manage users.';
            }
            usersList.innerHTML = '<p class="outreach-empty">Admin access required.</p>';
            return;
        }

        function renderUsers(items) {
            usersList.innerHTML = '';
            if (!Array.isArray(items) || items.length === 0) {
                usersList.innerHTML = '<p class="outreach-empty">No users found.</p>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('article');
                row.className = 'outreach-item';
                const roleClass = String(item.role || '').toLowerCase() === 'admin' ? 'published' : 'draft';
                const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown';
                const currentEmail = String(item.email || '').trim().toLowerCase();
                const localPart = currentEmail.includes('@') ? currentEmail.split('@')[0] : currentEmail;
                const suggestedEmail = localPart ? `${localPart}@${nextDomain}` : '';
                row.innerHTML = `
                    <div class="outreach-item-head">
                        <span class="outreach-item-title">${item.name || 'User'}</span>
                        <span class="outreach-status ${roleClass}">${item.role || 'user'}</span>
                    </div>
                    <p class="outreach-item-body">${item.email || ''}</p>
                    <p class="outreach-owner">Created: ${createdAt}</p>
                    <div class="outreach-item-actions admin-email-actions">
                        <input class="form-input admin-user-email-input" type="email" value="${suggestedEmail || currentEmail}" placeholder="username@fastbridgegroupllc.com" data-user-id="${item.id}">
                        <button type="button" class="card-btn admin-suggest-email-btn" data-user-id="${item.id}">Use @${nextDomain}</button>
                        <button type="button" class="card-btn active admin-update-email-btn" data-user-id="${item.id}" data-current-email="${currentEmail}">Update Email</button>
                    </div>
                `;
                usersList.appendChild(row);
            });

            usersList.querySelectorAll('.admin-suggest-email-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    const userId = button.dataset.userId;
                    const input = usersList.querySelector(`.admin-user-email-input[data-user-id="${userId}"]`);
                    if (!input) {
                        return;
                    }

                    const currentValue = String(input.value || '').trim().toLowerCase();
                    const localPart = currentValue.includes('@') ? currentValue.split('@')[0] : currentValue;
                    if (!localPart) {
                        showDashboardToast('error', 'Email Missing', 'Enter or keep a username before applying the new domain.');
                        return;
                    }

                    input.value = `${localPart}@${nextDomain}`;
                });
            });

            usersList.querySelectorAll('.admin-update-email-btn').forEach((button) => {
                button.addEventListener('click', async () => {
                    const userId = button.dataset.userId;
                    const currentEmail = String(button.dataset.currentEmail || '').trim().toLowerCase();
                    const input = usersList.querySelector(`.admin-user-email-input[data-user-id="${userId}"]`);
                    const nextEmail = String(input?.value || '').trim().toLowerCase();

                    if (!nextEmail) {
                        showDashboardToast('error', 'Email Required', 'Enter the new login email first.');
                        return;
                    }

                    if (nextEmail === currentEmail) {
                        showDashboardToast('error', 'No Change', 'That account is already using this email.');
                        return;
                    }

                    if (!token) {
                        showDashboardToast('error', 'Missing Auth', 'Please sign in again and retry.');
                        return;
                    }

                    button.disabled = true;

                    try {
                        const response = await fetch(`/api/admin/users/${userId}/email`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                email: nextEmail,
                                syncSmtpUser: true
                            })
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error || 'Unable to update user email');
                        }

                        if (currentUser && Number(currentUser.id) === Number(userId)) {
                            currentUser.email = nextEmail;
                            localStorage.setItem('user', JSON.stringify(currentUser));
                        }

                        showDashboardToast('success', 'Email Updated', `${data.user.name} now signs in with ${data.user.email}. Sign out and back in if this was your own account.`);
                        await loadUsers();
                    } catch (error) {
                        showDashboardToast('error', 'Update Failed', String(error.message || 'Unable to update user email.'));
                    } finally {
                        button.disabled = false;
                    }
                });
            });
        }

        async function loadUsers() {
            if (!token) {
                usersList.innerHTML = '<p class="outreach-empty">Missing auth token. Please sign in again.</p>';
                return;
            }

            function scoreAdminUser(item) {
                let score = 0;
                const rawEmail = String(item?.email || '').trim().toLowerCase();
                const canonicalEmail = normalizeUserIdentityValue(rawEmail);
                if (String(item?.role || '').trim().toLowerCase() === 'admin') {
                    score += 4;
                }
                if (rawEmail && rawEmail === canonicalEmail) {
                    score += 2;
                }
                if (canonicalEmail.endsWith('@fastbridgegroupllc.com')) {
                    score += 1;
                }
                return score;
            }

            function collapseAliasUsers(items) {
                const byIdentity = new Map();

                items.forEach((item) => {
                    const identityKey = normalizeUserIdentityValue(item?.email || item?.name || item?.id || '');
                    const existing = byIdentity.get(identityKey);

                    if (!existing || scoreAdminUser(item) > scoreAdminUser(existing)) {
                        byIdentity.set(identityKey, item);
                    }
                });

                return Array.from(byIdentity.values());
            }

            try {
                const response = await fetch('/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load users');
                }
                loadedUsers = collapseAliasUsers(Array.isArray(data.users) ? data.users : []);
                renderUsers(loadedUsers);
            } catch (error) {
                usersList.innerHTML = `<p class="outreach-empty">${String(error.message || 'Unable to load users.')}</p>`;
            }
        }

        async function updateUserEmail(userId, nextEmail) {
            const response = await fetch(`/api/admin/users/${userId}/email`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: nextEmail,
                    syncSmtpUser: true
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Unable to update user email');
            }
            return data;
        }

        async function createUser() {
            const name = String(nameInput?.value || '').trim();
            const email = String(emailInput?.value || '').trim().toLowerCase();
            const password = String(passwordInput?.value || '');
            const role = String(roleInput?.value || 'user').trim().toLowerCase();

            if (!name || !email || !password) {
                showDashboardToast('error', 'Missing Fields', 'Name, email, and password are required.');
                return;
            }

            if (!['admin', 'user'].includes(role)) {
                showDashboardToast('error', 'Invalid Role', 'Role must be admin or user.');
                return;
            }

            if (!token) {
                showDashboardToast('error', 'Missing Auth', 'Please sign in again and retry.');
                return;
            }

            if (createButton) {
                createButton.disabled = true;
            }

            try {
                const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, email, password, role })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to create user');
                }

                if (nameInput) nameInput.value = '';
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';
                if (roleInput) roleInput.value = 'user';

                showDashboardToast('success', 'Account Created', `${data.user.email} created as ${data.user.role}.`);
                await loadUsers();
            } catch (error) {
                showDashboardToast('error', 'Create Failed', String(error.message || 'Unable to create account.'));
            } finally {
                if (createButton) {
                    createButton.disabled = false;
                }
            }
        }

        if (createButton) {
            createButton.addEventListener('click', createUser);
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', loadUsers);
        }

        if (migrateDomainButton) {
            migrateDomainButton.addEventListener('click', async () => {
                if (!token) {
                    showDashboardToast('error', 'Missing Auth', 'Please sign in again and retry.');
                    return;
                }

                const candidates = loadedUsers.filter((item) => {
                    const currentEmail = String(item.email || '').trim().toLowerCase();
                    return currentEmail && !currentEmail.endsWith(`@${nextDomain}`);
                });

                if (candidates.length === 0) {
                    showDashboardToast('success', 'Already Migrated', `All loaded accounts already use @${nextDomain}.`);
                    return;
                }

                migrateDomainButton.disabled = true;
                let updatedCount = 0;

                try {
                    for (const item of candidates) {
                        const currentEmail = String(item.email || '').trim().toLowerCase();
                        const localPart = currentEmail.includes('@') ? currentEmail.split('@')[0] : currentEmail;
                        if (!localPart) {
                            continue;
                        }

                        const nextEmail = `${localPart}@${nextDomain}`;
                        const data = await updateUserEmail(item.id, nextEmail);
                        if (currentUser && Number(currentUser.id) === Number(item.id)) {
                            currentUser.email = data.user.email;
                            localStorage.setItem('user', JSON.stringify(currentUser));
                        }
                        updatedCount += 1;
                    }

                    showDashboardToast('success', 'Domain Migration Complete', `${updatedCount} account${updatedCount === 1 ? '' : 's'} switched to @${nextDomain}. Sign out and back in if your own admin account was changed.`);
                    await loadUsers();
                } catch (error) {
                    showDashboardToast('error', 'Migration Failed', String(error.message || 'Unable to migrate account emails.'));
                } finally {
                    migrateDomainButton.disabled = false;
                }
            });
        }

        loadUsers();
    }

    function initAdminAccessRequests() {
        const requestsList = document.getElementById('admin-access-requests-list');
        if (!requestsList) {
            return;
        }

        const subtitle = document.getElementById('access-requests-subtitle');
        const token = localStorage.getItem('authToken');
        let currentUser = null;

        try {
            currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            currentUser = null;
        }

        if (!currentUser || currentUser.role !== 'admin') {
            if (subtitle) {
                subtitle.textContent = 'Only admin accounts can review access requests.';
            }
            requestsList.innerHTML = '<p class="outreach-empty">Admin access required.</p>';
            return;
        }

        function escapeRequestText(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function renderRequests(items) {
            requestsList.innerHTML = '';

            if (!Array.isArray(items) || items.length === 0) {
                if (subtitle) {
                    subtitle.textContent = 'Admin-only review queue for new FAST access requests';
                }
                requestsList.innerHTML = '<p class="outreach-empty">No access requests yet.</p>';
                return;
            }

            if (subtitle) {
                subtitle.textContent = `${items.length} access request${items.length === 1 ? '' : 's'} waiting for review`;
            }

            items.forEach((item) => {
                const row = document.createElement('article');
                row.className = 'outreach-item';
                const status = String(item.status || 'pending').trim().toLowerCase() || 'pending';
                const statusClass = status === 'approved' ? 'published' : 'draft';
                const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown';
                const company = escapeRequestText(item.company || 'Independent operator');
                const phone = escapeRequestText(item.phone || 'No phone submitted');
                const email = escapeRequestText(item.email || 'No email submitted');
                const message = escapeRequestText(item.message || 'No notes submitted.');

                row.innerHTML = `
                    <div class="outreach-item-head">
                        <span class="outreach-item-title">${escapeRequestText(item.name || 'Unknown requester')}</span>
                        <span class="outreach-status ${statusClass}">${status}</span>
                    </div>
                    <p class="outreach-item-body">${email}</p>
                    <p class="outreach-owner">Phone: ${phone}</p>
                    <p class="outreach-owner">Company: ${company}</p>
                    <p class="outreach-owner">Submitted: ${createdAt}</p>
                    <p class="outreach-item-body">${message}</p>
                `;
                requestsList.appendChild(row);
            });
        }

        async function loadRequests() {
            if (!token) {
                requestsList.innerHTML = '<p class="outreach-empty">Missing auth token. Please sign in again.</p>';
                return;
            }

            try {
                const response = await fetch('/api/access-requests', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load access requests');
                }
                renderRequests(data.requests || []);
            } catch (error) {
                requestsList.innerHTML = `<p class="outreach-empty">${String(error.message || 'Unable to load access requests.')}</p>`;
            }
        }

        loadRequests();
    }

    function initAdminSmtpApprovals() {
        const requestsList = document.getElementById('admin-smtp-requests-list');
        if (!requestsList) {
            return;
        }

        const subtitle = document.getElementById('smtp-approval-subtitle');
        const token = localStorage.getItem('authToken');
        let currentUser = null;

        try {
            currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            currentUser = null;
        }

        if (!currentUser || currentUser.role !== 'admin') {
            if (subtitle) {
                subtitle.textContent = 'Only admin accounts can review Gmail outbox requests.';
            }
            requestsList.innerHTML = '<p class="outreach-empty">Admin access required.</p>';
            return;
        }

        function escapeSmtpText(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function renderRequests(items) {
            requestsList.innerHTML = '';

            if (!Array.isArray(items) || items.length === 0) {
                if (subtitle) {
                    subtitle.textContent = 'Approve submitted Gmail emails and app passwords for outgoing mail';
                }
                requestsList.innerHTML = '<p class="outreach-empty">No Gmail outbox requests yet.</p>';
                return;
            }

            const pendingCount = items.filter(item => String(item.status || '').toLowerCase() === 'pending').length;
            if (subtitle) {
                subtitle.textContent = `${pendingCount} Gmail request${pendingCount === 1 ? '' : 's'} waiting for review`;
            }

            items.forEach((item) => {
                const row = document.createElement('article');
                row.className = 'outreach-item';
                const status = String(item.status || 'pending').trim().toLowerCase() || 'pending';
                const statusClass = status === 'approved' ? 'published' : status === 'rejected' ? 'draft' : 'sent';
                const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown';
                const requesterName = escapeSmtpText(item.requester_name || 'Unknown user');
                const requesterEmail = escapeSmtpText(item.requester_email || 'No account email');
                const smtpUser = escapeSmtpText(item.smtp_user || 'No Gmail submitted');
                const smtpPass = escapeSmtpText(item.smtp_pass || 'No app password submitted');
                const reviewedBy = escapeSmtpText(item.reviewed_by_name || '');
                const actionsHtml = status === 'pending'
                    ? `<div class="outreach-item-actions">
                            <button type="button" class="card-btn active admin-approve-smtp-btn" data-request-id="${item.id}">Approve</button>
                            <button type="button" class="card-btn admin-reject-smtp-btn" data-request-id="${item.id}">Reject</button>
                       </div>`
                    : '';

                row.innerHTML = `
                    <div class="outreach-item-head">
                        <span class="outreach-item-title">${requesterName}</span>
                        <span class="outreach-status ${statusClass}">${status}</span>
                    </div>
                    <p class="outreach-item-body">Account Email: ${requesterEmail}</p>
                    <p class="outreach-item-body">Gmail Outbox: ${smtpUser}</p>
                    <p class="outreach-item-body admin-smtp-secret">App Password: ${smtpPass}</p>
                    <p class="outreach-owner">Submitted: ${createdAt}</p>
                    ${reviewedBy ? `<p class="outreach-owner">Reviewed By: ${reviewedBy}</p>` : ''}
                    ${actionsHtml}
                `;
                requestsList.appendChild(row);
            });

            requestsList.querySelectorAll('.admin-approve-smtp-btn').forEach((button) => {
                button.addEventListener('click', async () => {
                    const requestId = button.dataset.requestId;
                    button.disabled = true;

                    try {
                        const response = await fetch(`/api/admin/smtp-requests/${requestId}/approve`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error || 'Unable to approve Gmail request');
                        }
                        showDashboardToast('success', 'Gmail Approved', 'Gmail outbox request approved and applied to the user account.');
                        await loadRequests();
                    } catch (error) {
                        showDashboardToast('error', 'Approval Failed', String(error.message || 'Unable to approve Gmail request.'));
                    } finally {
                        button.disabled = false;
                    }
                });
            });

            requestsList.querySelectorAll('.admin-reject-smtp-btn').forEach((button) => {
                button.addEventListener('click', async () => {
                    const requestId = button.dataset.requestId;
                    button.disabled = true;

                    try {
                        const response = await fetch(`/api/admin/smtp-requests/${requestId}/reject`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error || 'Unable to reject Gmail request');
                        }
                        showDashboardToast('success', 'Gmail Rejected', 'Gmail outbox request rejected.');
                        await loadRequests();
                    } catch (error) {
                        showDashboardToast('error', 'Reject Failed', String(error.message || 'Unable to reject Gmail request.'));
                    } finally {
                        button.disabled = false;
                    }
                });
            });
        }

        async function loadRequests() {
            if (!token) {
                requestsList.innerHTML = '<p class="outreach-empty">Missing auth token. Please sign in again.</p>';
                return;
            }

            try {
                const response = await fetch('/api/admin/smtp-requests', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load Gmail requests');
                }
                renderRequests(data.requests || []);
            } catch (error) {
                requestsList.innerHTML = `<p class="outreach-empty">${String(error.message || 'Unable to load Gmail requests.')}</p>`;
            }
        }

        loadRequests();
    }

    function initTodoGoalsWidget() {
        const input = document.getElementById('planner-task-input');
        const dateInput = document.getElementById('planner-task-date');
        const prioritySelect = document.getElementById('planner-task-priority');
        const reminderSelect = document.getElementById('planner-task-reminder');
        const addButton = document.getElementById('planner-add-btn');
        const list = document.getElementById('planner-task-list');
        const filterButtons = Array.from(document.querySelectorAll('.planner-filter-btn[data-filter]'));
        const countToday = document.getElementById('planner-count-today');
        const countUpcoming = document.getElementById('planner-count-upcoming');
        const countDone = document.getElementById('planner-count-done');
        const reminderNote = document.getElementById('planner-reminder-note');

        if (!input || !dateInput || !prioritySelect || !reminderSelect || !addButton || !list || filterButtons.length === 0) {
            return;
        }

        function playBubblePopSound() {
            const soundSettings = getSoundSettings();
            if (!soundSettings.todoCheck) {
                return;
            }
            try {
                let audio = document.getElementById('todo-pop-sound');
                if (!audio) {
                    audio = document.createElement('audio');
                    audio.id = 'todo-pop-sound';
                    audio.src = 'Sound FX/Pop Sound Effect.wav';
                    audio.preload = 'auto';
                    document.body.appendChild(audio);
                }
                audio.currentTime = 0;
                audio.play();
            } catch (error) {
                // silently fail
            }
        }

        const workspaceUser = getWorkspaceUserContext();
        const ownerLabel = document.getElementById('todo-goal-owner-label');
        if (ownerLabel) {
            ownerLabel.textContent = `Workspace owner: ${workspaceUser.name}`;
        }

        function renderReminderNote() {
            if (!reminderNote) {
                return;
            }
            const settings = getPlannerNotificationSettings();
            if (!settings.inApp && !settings.desktop) {
                reminderNote.textContent = 'Planner reminders are off. Enable popups or desktop notifications in Settings to get alerts.';
                return;
            }
            if (!settings.inApp && settings.desktop) {
                reminderNote.textContent = 'Desktop notifications are on. Top-right planner popups are off in Settings.';
                return;
            }
            if (settings.inApp && !settings.desktop) {
                reminderNote.textContent = 'Top-right planner popups are on. Desktop notifications are off in Settings.';
                return;
            }
            reminderNote.textContent = 'Top-right reminders will alert you when planner tasks are coming up, due, or overdue.';
        }

        renderReminderNote();
        window.addEventListener('dashboard-user-settings-updated', renderReminderNote);

        function getItems() {
            return getPlannerItems(workspaceUser);
        }

        function setItems(items) {
            setPlannerItems(items, workspaceUser);
        }

        function getDraft() {
            const savedDraft = getUserScopedValue(PLANNER_DRAFT_KEY, workspaceUser.key, null);
            return savedDraft && typeof savedDraft === 'object' && !Array.isArray(savedDraft)
                ? savedDraft
                : null;
        }

        function saveDraft() {
            setUserScopedValue(PLANNER_DRAFT_KEY, workspaceUser.key, {
                title: String(input.value || ''),
                dueDate: String(dateInput.value || ''),
                priority: String(prioritySelect.value || 'p2'),
                reminderLead: String(reminderSelect.value || 'day-of')
            });
        }

        function applyDraft() {
            const draft = getDraft();
            if (!draft) {
                return;
            }

            input.value = String(draft.title || '');
            dateInput.value = String(draft.dueDate || '');
            prioritySelect.value = ['p1', 'p2', 'p3', 'p4'].includes(draft.priority) ? draft.priority : 'p2';
            reminderSelect.value = ['none', 'day-of', '1-day', '3-day'].includes(draft.reminderLead) ? draft.reminderLead : 'day-of';
        }

        function clearDraft() {
            setUserScopedValue(PLANNER_DRAFT_KEY, workspaceUser.key, null);
        }

        let activeFilter = 'today';

        applyDraft();

        function classifyItem(item, todayKey) {
            if (item.completed) {
                return 'done';
            }
            if (!item.dueDate || item.dueDate <= todayKey) {
                return 'today';
            }
            return 'upcoming';
        }

        function renderItems() {
            const todayKey = getPlannerTodayKey();
            const items = getItems()
                .slice()
                .sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }

                    const priorityRank = { p1: 1, p2: 2, p3: 3, p4: 4 };
                    const prA = priorityRank[a.priority] || 5;
                    const prB = priorityRank[b.priority] || 5;
                    if (prA !== prB) {
                        return prA - prB;
                    }

                    const dueA = a.dueDate || '9999-12-31';
                    const dueB = b.dueDate || '9999-12-31';
                    if (dueA !== dueB) {
                        return dueA.localeCompare(dueB);
                    }

                    return (b.updatedAt || 0) - (a.updatedAt || 0);
                });

            let todayCount = 0;
            let upcomingCount = 0;
            let doneCount = 0;

            const visible = items.filter(item => {
                const bucket = classifyItem(item, todayKey);
                if (bucket === 'today') todayCount += 1;
                if (bucket === 'upcoming') upcomingCount += 1;
                if (bucket === 'done') doneCount += 1;
                return bucket === activeFilter;
            });

            if (countToday) countToday.textContent = String(todayCount);
            if (countUpcoming) countUpcoming.textContent = String(upcomingCount);
            if (countDone) countDone.textContent = String(doneCount);

            list.innerHTML = '';
            if (visible.length === 0) {
                list.innerHTML = '<p class="outreach-empty">No items in this view yet.</p>';
                return;
            }

            visible.forEach(item => {
                const card = document.createElement('article');
                card.className = 'planner-task-item';
                if (item.completed) {
                    card.classList.add('is-complete');
                }

                if (item.dueDate && !item.completed && item.dueDate < todayKey) {
                    card.classList.add('is-overdue');
                }

                const bubble = document.createElement('button');
                bubble.type = 'button';
                bubble.className = 'planner-check-bubble';
                bubble.setAttribute('aria-label', item.completed ? 'Mark task as incomplete' : 'Mark task as complete');
                bubble.innerHTML = '<span class="planner-check-dot"></span>';

                const content = document.createElement('div');
                content.className = 'planner-task-content';

                const head = document.createElement('div');
                head.className = 'planner-task-head';

                const title = document.createElement('p');
                title.className = 'planner-task-title';
                title.textContent = item.title;

                const meta = document.createElement('div');
                meta.className = 'planner-task-meta';

                const priority = document.createElement('span');
                priority.className = `planner-priority planner-priority-${item.priority}`;
                priority.textContent = item.priority.toUpperCase();

                const time = document.createElement('span');
                time.className = 'planner-task-time';
                time.textContent = formatPlannerDateLabel(item.dueDate);

                meta.appendChild(priority);
                meta.appendChild(time);

                if (item.dueDate && item.reminderLead !== 'none') {
                    const reminder = document.createElement('span');
                    reminder.className = 'planner-reminder-pill';
                    reminder.textContent = getPlannerReminderLabel(item.reminderLead);
                    meta.appendChild(reminder);
                }

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'planner-delete-btn';
                deleteButton.textContent = '×';
                deleteButton.setAttribute('aria-label', 'Delete task');
                deleteButton.addEventListener('click', () => {
                    const updated = getItems().filter(entry => entry.id !== item.id);
                    setItems(updated);
                    renderItems();
                });

                bubble.addEventListener('click', () => {
                    const nextCompleted = !item.completed;

                    if (nextCompleted) {
                        playBubblePopSound();
                        card.classList.add('is-complete', 'is-fading-out');
                        window.setTimeout(() => {
                            const updated = getItems().map(entry => {
                                if (entry.id === item.id) {
                                    return {
                                        ...entry,
                                        completed: true,
                                        updatedAt: Date.now()
                                    };
                                }
                                return entry;
                            });
                            setItems(updated);
                            renderItems();
                        }, 420);
                        return;
                    }

                    const updated = getItems().map(entry => {
                        if (entry.id === item.id) {
                            return {
                                ...entry,
                                completed: false,
                                updatedAt: Date.now()
                            };
                        }
                        return entry;
                    });
                    setItems(updated);
                    renderItems();
                });

                head.appendChild(title);
                head.appendChild(meta);
                content.appendChild(head);
                card.appendChild(bubble);
                card.appendChild(content);
                card.appendChild(deleteButton);
                list.appendChild(card);
            });
        }

        function addItem() {
            const title = input.value.trim();
            const dueDate = getPlannerDateKey(dateInput.value);
            const priority = ['p1', 'p2', 'p3', 'p4'].includes(prioritySelect.value) ? prioritySelect.value : 'p2';
            const reminderLead = dueDate && ['none', 'day-of', '1-day', '3-day'].includes(reminderSelect.value)
                ? reminderSelect.value
                : 'none';

            if (!title) {
                showDashboardToast('error', 'Task Required', 'Add a task title first.');
                return;
            }

            const items = getItems();
            items.push({
                id: `tg-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                title,
                dueDate,
                priority,
                completed: false,
                updatedAt: Date.now(),
                reminderLead,
                notifications: {}
            });

            setItems(items);
            input.value = '';
            dateInput.value = '';
            prioritySelect.value = 'p2';
            reminderSelect.value = 'day-of';
            clearDraft();
            renderItems();
            showDashboardToast('success', 'Added To Planner', dueDate ? 'Task saved with a reminder in your planner widget.' : 'Task saved in your planner widget.', {
                eyebrow: 'Planner updated',
                meta: dueDate ? `${formatPlannerDateLabel(dueDate)} • ${getPlannerReminderLabel(reminderLead)}` : 'No due date set'
            });

            if (dueDate && getPlannerNotificationSettings().desktop && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        }

        addButton.addEventListener('click', addItem);
        input.addEventListener('input', saveDraft);
        dateInput.addEventListener('input', saveDraft);
        prioritySelect.addEventListener('change', saveDraft);
        reminderSelect.addEventListener('change', saveDraft);
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addItem();
            }
        });

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeFilter = button.dataset.filter || 'today';
                filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
                renderItems();
            });
        });

        reminderSelect.value = 'day-of';
        renderItems();
    }

    function initPlannerNotifications() {
        const workspaceUser = getWorkspaceUserContext();
        let settings = getPlannerNotificationSettings();

        function getDayDifference(dateKey, todayKey) {
            const dueDate = getPlannerDateFromKey(dateKey);
            const today = getPlannerDateFromKey(todayKey);
            if (!dueDate || !today) {
                return null;
            }
            return Math.round((dueDate.getTime() - today.getTime()) / 86400000);
        }

        function updateNotificationDots() {
            const todayKey = getPlannerTodayKey();
            const count = getPlannerItems(workspaceUser).filter(item => {
                if (item.completed || !item.dueDate) {
                    return false;
                }
                const diffDays = getDayDifference(item.dueDate, todayKey);
                if (diffDays === null) {
                    return false;
                }
                const leadDays = getPlannerReminderLeadDays(item.reminderLead);
                if (diffDays <= 0) {
                    return true;
                }
                return leadDays >= 0 && diffDays <= leadDays;
            }).length;

            document.querySelectorAll('.notification-dot').forEach(dot => {
                if (count > 0) {
                    dot.hidden = false;
                    dot.classList.add('has-count');
                    dot.textContent = count > 9 ? '9+' : String(count);
                } else {
                    dot.classList.remove('has-count');
                    dot.textContent = '';
                    dot.hidden = true;
                }
            });
        }

        function buildToastItems(items, todayKey) {
            return items.slice(0, 3).map(item => {
                const diffDays = getDayDifference(item.dueDate, todayKey);
                let meta = formatPlannerDateLabel(item.dueDate);
                if (diffDays === 0) {
                    meta = 'Due today';
                } else if (diffDays < 0) {
                    meta = `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} late`;
                } else if (diffDays > 0) {
                    meta = `${diffDays} day${diffDays === 1 ? '' : 's'} away`;
                }
                return {
                    label: item.title,
                    meta
                };
            });
        }

        function notifyStage(stage, items, todayKey) {
            if (!items.length) {
                return;
            }

            const first = items[0];
            let title = 'Planner reminder';
            let message = `${items.length} task${items.length === 1 ? '' : 's'} need attention.`;
            let type = 'reminder';
            let meta = '';

            if (stage === 'overdue') {
                title = items.length === 1 ? 'Planner task overdue' : 'Planner tasks overdue';
                message = items.length === 1 ? `"${first.title}" is past due.` : `${items.length} planner tasks are past due.`;
                type = 'error';
                meta = 'Clear these first so follow-ups do not slip.';
            } else if (stage === 'due') {
                title = items.length === 1 ? 'Planner task due today' : 'Planner tasks due today';
                message = items.length === 1 ? `"${first.title}" is due today.` : `${items.length} planner tasks are due today.`;
                type = 'reminder';
                meta = 'Today view is ready for quick action.';
            } else if (stage === 'upcoming') {
                title = items.length === 1 ? 'Planner task coming up' : 'Planner tasks coming up';
                message = items.length === 1 ? `"${first.title}" is coming up soon.` : `${items.length} planner tasks are coming up soon.`;
                type = 'success';
                meta = 'Use the planner to tighten the next few days.';
            }

            if (settings.inApp) {
                showDashboardToast(type, title, message, {
                    eyebrow: 'Planner reminder',
                    meta,
                    items: buildToastItems(items, todayKey),
                    duration: 8000,
                    playSound: false
                });
            }

            if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`FAST BRIDGE GROUP: ${title}`, {
                    body: message
                });
            }
        }

        function checkPlannerReminders() {
            const todayKey = getPlannerTodayKey();
            const items = getPlannerItems(workspaceUser).slice();
            const triggered = {
                overdue: [],
                due: [],
                upcoming: []
            };
            let dirty = false;

            items.forEach(item => {
                if (item.completed || !item.dueDate) {
                    return;
                }

                const diffDays = getDayDifference(item.dueDate, todayKey);
                if (diffDays === null) {
                    return;
                }

                if (!item.notifications || typeof item.notifications !== 'object') {
                    item.notifications = {};
                    dirty = true;
                }

                if (diffDays < 0) {
                    if (item.notifications.overdueForDueDate !== item.dueDate) {
                        item.notifications.overdueForDueDate = item.dueDate;
                        triggered.overdue.push(item);
                        dirty = true;
                    }
                    return;
                }

                if (diffDays === 0) {
                    if (item.notifications.dueForDueDate !== item.dueDate) {
                        item.notifications.dueForDueDate = item.dueDate;
                        triggered.due.push(item);
                        dirty = true;
                    }
                    return;
                }

                const leadDays = getPlannerReminderLeadDays(item.reminderLead);
                if (leadDays > 0 && diffDays <= leadDays && item.notifications.upcomingForDueDate !== item.dueDate) {
                    item.notifications.upcomingForDueDate = item.dueDate;
                    triggered.upcoming.push(item);
                    dirty = true;
                }
            });

            if (dirty) {
                setPlannerItems(items, workspaceUser);
            }

            if (settings.inApp && (triggered.overdue.length || triggered.due.length || triggered.upcoming.length)) {
                playPlannerNotificationSound();
            }

            notifyStage('overdue', triggered.overdue, todayKey);
            notifyStage('due', triggered.due, todayKey);
            notifyStage('upcoming', triggered.upcoming, todayKey);
            updateNotificationDots();
        }

        window.addEventListener('dashboard-data-updated', updateNotificationDots);
        window.addEventListener('storage', event => {
            if (event.key === TODO_GOALS_KEY || event.key === USER_SETTINGS_KEY) {
                settings = getPlannerNotificationSettings();
                updateNotificationDots();
            }
        });
        window.addEventListener('dashboard-user-settings-updated', () => {
            settings = getPlannerNotificationSettings();
            updateNotificationDots();
        });

        updateNotificationDots();
        checkPlannerReminders();
        window.setInterval(checkPlannerReminders, 60000);
    }

    // ============================================
    // MLS Hot Deals Sandbox
    // ============================================
    function initMlsDealsBoard() {
        const listingsGrid = document.getElementById('mls-listings-grid');
        if (!listingsGrid) return;

        const sortSelect = document.getElementById('mls-sort-select');
        const countyFilter = document.getElementById('mls-county-filter');
        const keywordCategoryFilter = document.getElementById('mls-keyword-category');
        const searchInput = document.getElementById('mls-search-input');
        const statusFilter = document.getElementById('mls-listing-status');
        const alertStatus = document.getElementById('mls-alert-status');
        const emptyState = document.getElementById('mls-empty-state');
        const pagination = document.getElementById('mls-pagination');
        const cards = Array.from(listingsGrid.querySelectorAll('.mls-property-card'));
        const pageSize = 10;
        let currentPage = 1;

        function getListingNotificationStore() {
            const workspaceUser = getWorkspaceUserContext();
            const stored = getUserScopedObject(MLS_LISTING_NOTIFICATIONS_KEY, workspaceUser.key);
            const seenKeys = Array.isArray(stored.seenKeys)
                ? stored.seenKeys.map(item => String(item || '').trim().toLowerCase()).filter(Boolean)
                : [];
            return {
                seenKeys,
                seededAt: Number(stored.seededAt) || 0,
                lastNotifiedAt: Number(stored.lastNotifiedAt) || 0
            };
        }

        function setListingNotificationStore(next) {
            const workspaceUser = getWorkspaceUserContext();
            setUserScopedObject(MLS_LISTING_NOTIFICATIONS_KEY, workspaceUser.key, {
                seenKeys: Array.isArray(next && next.seenKeys) ? next.seenKeys : [],
                seededAt: Number(next && next.seededAt) || 0,
                lastNotifiedAt: Number(next && next.lastNotifiedAt) || 0
            });
        }

        function updateMlsAlertStatus(text) {
            if (alertStatus) {
                alertStatus.textContent = text;
            }
        }

        function parseAddress(card) {
            const title = card.querySelector('h3')?.textContent?.trim() || 'Property';
            const locationRaw = card.querySelector('.mls-location')?.textContent?.trim() || '';
            const location = locationRaw.split('·')[0].trim();
            return `${title}, ${location}`;
        }

        function getListingNotificationKey(card) {
            const explicitId = String(card.dataset.mlsId || card.dataset.listingId || '').trim().toLowerCase();
            if (explicitId) {
                return explicitId;
            }
            const address = parseAddress(card).toLowerCase();
            const listedAt = String(card.dataset.listedAt || '').trim().toLowerCase();
            const price = String(card.dataset.price || '').trim().toLowerCase();
            return `${address}|${listedAt}|${price}`;
        }

        function getListingNotificationSummary(card) {
            const title = card.querySelector('h3')?.textContent?.trim() || 'Property';
            const location = card.querySelector('.mls-location')?.textContent?.trim() || 'MLS board';
            const price = parseMetricText(card, 0, '$0');
            return {
                key: getListingNotificationKey(card),
                title,
                location,
                price,
                listedAt: String(card.dataset.listedAt || '').trim()
            };
        }

        function notifyNewMlsListings(freshListings) {
            if (!freshListings.length) {
                return;
            }

            const settings = getMlsNotificationSettings();
            const store = getListingNotificationStore();
            const seenSet = new Set(store.seenKeys);
            freshListings.forEach(item => seenSet.add(item.key));
            setListingNotificationStore({
                seenKeys: Array.from(seenSet),
                seededAt: store.seededAt || Date.now(),
                lastNotifiedAt: Date.now()
            });

            const listingCount = freshListings.length;
            updateMlsAlertStatus(`${listingCount} new MLS ${listingCount === 1 ? 'listing is' : 'listings are'} ready for review. Alerts will keep watching for the next feed update.`);

            if (!settings.enabled) {
                return;
            }

            if (settings.sound) {
                playPlannerNotificationSound();
            }

            showDashboardToast('success', listingCount === 1 ? 'New MLS listing' : 'New MLS listings', listingCount === 1
                ? `${freshListings[0].title} just hit the MLS board.`
                : `${listingCount} new properties just hit the MLS board.`, {
                eyebrow: 'MLS alert',
                meta: 'Prepared for live MLS feed updates and routing to agents or associates.',
                items: freshListings.slice(0, 3).map(item => ({
                    label: `${item.title} • ${item.price}`,
                    meta: item.location
                })),
                duration: 9000,
                playSound: false
            });

            if (settings.desktop) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('FAST BRIDGE GROUP: New MLS listing alert', {
                        body: listingCount === 1
                            ? `${freshListings[0].title} is ready for review.`
                            : `${listingCount} new MLS properties are ready for review.`
                    });
                } else if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().catch(() => {});
                }
            }
        }

        function seedOrNotifyListings(sourceCards, options = {}) {
            const store = getListingNotificationStore();
            const seenSet = new Set(store.seenKeys);
            const summaries = sourceCards.map(getListingNotificationSummary);
            const unseen = summaries.filter(item => item.key && !seenSet.has(item.key));

            if (!store.seededAt) {
                unseen.forEach(item => seenSet.add(item.key));
                setListingNotificationStore({
                    seenKeys: Array.from(seenSet),
                    seededAt: Date.now(),
                    lastNotifiedAt: store.lastNotifiedAt
                });
                updateMlsAlertStatus('MLS alerts are armed. Current board was saved as the baseline, and only future listings will trigger notifications.');
                return;
            }

            if (unseen.length > 0) {
                notifyNewMlsListings(unseen);
            } else if (!options.skipStatusRefresh) {
                const settings = getMlsNotificationSettings();
                updateMlsAlertStatus(settings.enabled
                    ? 'MLS alerts are armed. When new listings land here, FAST will notify you to route them to agents or associates.'
                    : 'MLS alerts are currently off in Settings. New listings will be tracked quietly until you turn alerts back on.');
            }
        }

        function parseMetricText(card, index, fallback) {
            const metric = card.querySelectorAll('.mls-metrics span')[index];
            return metric ? metric.textContent.trim() : fallback;
        }

        function getPtfvScore(card) {
            const explicit = Number(card.dataset.ptfv);
            if (Number.isFinite(explicit) && explicit > 0) {
                return explicit;
            }

            const roi = Number(card.dataset.roi || 0);
            if (!Number.isFinite(roi)) {
                return 100;
            }

            // Approximation for sandbox data so lower PTFV maps to stronger ROI deals.
            return Math.max(1, 100 - roi * 5);
        }

        function getKeywordText(card, category) {
            const normalized = String(category || 'all').trim().toLowerCase();
            if (normalized === 'address') {
                return (card.querySelector('h3')?.textContent || '').toLowerCase();
            }
            if (normalized === 'location') {
                return (card.querySelector('.mls-location')?.textContent || '').toLowerCase();
            }
            if (normalized === 'notes') {
                return (card.querySelector('.mls-note')?.textContent || '').toLowerCase();
            }
            if (normalized === 'status') {
                return String(card.dataset.status || '').toLowerCase();
            }
            return [
                String(card.dataset.search || ''),
                card.querySelector('h3')?.textContent || '',
                card.querySelector('.mls-location')?.textContent || '',
                card.querySelector('.mls-note')?.textContent || '',
                String(card.dataset.status || '')
            ].join(' ').toLowerCase();
        }

        function buildAgentRecordFromCard(card) {
            const address = parseAddress(card);
            const county = card.dataset.county || '';
            const city = card.dataset.city || '';
            const seedSource = `${address}-${city}-${county}`;
            const seed = seedSource.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

            const countyAgentPools = {
                'los-angeles': [
                    {
                        name: 'Brandon Wasilewski',
                        phone: '(805) 856-8773',
                        email: 'lewskisells@gmail.com',
                        brokerage: 'Realty ONE Group Summit',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '3',
                        doubleEnded: '0',
                        investorSource: '0'
                    },
                    {
                        name: 'Elena Carrillo',
                        phone: '(323) 555-0194',
                        email: 'elena.carrillo@summitrealty.com',
                        brokerage: 'Summit West Realty',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '5',
                        doubleEnded: '1',
                        investorSource: '2'
                    }
                ],
                orange: [
                    {
                        name: 'Mason Kim',
                        phone: '(714) 555-0138',
                        email: 'mason.kim@coastalgroup.com',
                        brokerage: 'Coastal Group Realty',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '4',
                        doubleEnded: '1',
                        investorSource: '1'
                    },
                    {
                        name: 'Sophia Nguyen',
                        phone: '(949) 555-0107',
                        email: 's.nguyen@orangecrownrealty.com',
                        brokerage: 'Orange Crown Realty',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '6',
                        doubleEnded: '2',
                        investorSource: '1'
                    }
                ],
                'san-diego': [
                    {
                        name: 'Jordan Reeves',
                        phone: '(619) 555-0162',
                        email: 'jreeves@pacificcoasthomes.com',
                        brokerage: 'Pacific Coast Homes',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '5',
                        doubleEnded: '1',
                        investorSource: '2'
                    },
                    {
                        name: 'Ariana Lopez',
                        phone: '(858) 555-0143',
                        email: 'alopez@sandiegoprime.com',
                        brokerage: 'San Diego Prime Realty',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '4',
                        doubleEnded: '0',
                        investorSource: '1'
                    }
                ],
                'santa-clara': [
                    {
                        name: 'Noah Patel',
                        phone: '(408) 555-0112',
                        email: 'npatel@baytechrealty.com',
                        brokerage: 'BayTech Realty',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '7',
                        doubleEnded: '2',
                        investorSource: '3'
                    },
                    {
                        name: 'Priya Menon',
                        phone: '(650) 555-0154',
                        email: 'pmenon@siliconkeyhomes.com',
                        brokerage: 'Silicon Key Homes',
                        activeInLast2Years: 'TRUE',
                        averageDealsPerYear: '6',
                        doubleEnded: '1',
                        investorSource: '2'
                    }
                ]
            };

            const fallbackPool = countyAgentPools[county] || countyAgentPools['los-angeles'];
            const selectedAgent = fallbackPool[seed % fallbackPool.length];

            const sourcedAgent = {
                name: card.dataset.agentName || selectedAgent.name,
                phone: card.dataset.agentPhone || selectedAgent.phone,
                email: card.dataset.agentEmail || selectedAgent.email,
                brokerage: card.dataset.agentBrokerage || selectedAgent.brokerage,
                activeInLast2Years: card.dataset.agentActiveLast2Years || selectedAgent.activeInLast2Years,
                averageDealsPerYear: card.dataset.agentAverageDealsPerYear || selectedAgent.averageDealsPerYear,
                doubleEnded: card.dataset.agentDoubleEnded || selectedAgent.doubleEnded,
                investorSource: card.dataset.agentInvestorSource || selectedAgent.investorSource
            };

            return {
                name: sourcedAgent.name,
                title: 'Agent Record',
                phone: sourcedAgent.phone,
                email: sourcedAgent.email,
                brokerage: sourcedAgent.brokerage,
                lastCommunicationDate: card.dataset.lastCommunicationDate || '-',
                lastAddressDiscussed: card.dataset.lastAddressDiscussed || address,
                lastCommunicatedAA: card.dataset.lastCommunicatedAa || '-',
                activeInLast2Years: String(sourcedAgent.activeInLast2Years || 'TRUE').toUpperCase(),
                averageDealsPerYear: String(sourcedAgent.averageDealsPerYear || '3'),
                doubleEnded: String(sourcedAgent.doubleEnded || '0'),
                investorSource: String(sourcedAgent.investorSource || '0')
            };
        }

        function rememberClickedProperty(card, propertyPayload, status, roi) {
            const workspaceUser = getWorkspaceUserContext();
            const items = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key);
            const priceText = parseMetricText(card, 0, '$0');
            const bedsText = parseMetricText(card, 1, '0 Beds');
            const bathsText = parseMetricText(card, 2, '0 Baths');
            const areaText = parseMetricText(card, 3, '0 sqft');
            const imageUrl = card.querySelector('.mls-property-image')?.getAttribute('src') || '';
            const locationText = card.querySelector('.mls-location')?.textContent?.trim() || '';
            const address = parseAddress(card);

            const compactEntry = {
                id: String(card.dataset.search || address || Date.now()),
                address,
                location: locationText,
                price: priceText,
                beds: bedsText,
                baths: bathsText,
                area: areaText,
                status,
                roi: Number.isFinite(roi) ? roi.toFixed(1) : '0.0',
                imageUrl,
                clickedAt: Date.now(),
                propertySnapshot: propertyPayload
            };

            const nextItems = [
                compactEntry,
                ...items.filter(item => String(item.id || '') !== compactEntry.id)
            ].slice(0, 120);

            try {
                setUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key, nextItems);
            } catch (error) {
                try {
                    const fallbackItems = nextItems.map(item => ({
                        id: item.id,
                        address: item.address,
                        location: item.location,
                        price: item.price,
                        beds: item.beds,
                        baths: item.baths,
                        area: item.area,
                        status: item.status,
                        roi: item.roi,
                        imageUrl: item.imageUrl,
                        clickedAt: item.clickedAt
                    })).slice(0, 40);
                    setUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key, fallbackItems);
                } catch (fallbackError) {
                    // Ignore clicked-history persistence issues so MLS navigation still works.
                }
            }
        }

        function openPropertyDetail(card) {
            const priceText = parseMetricText(card, 0, '$0');
            const bedsText = parseMetricText(card, 1, '0 Beds').replace('Beds', 'Br').trim();
            const bathsText = parseMetricText(card, 2, '0 Baths').replace('Baths', 'Ba').trim();
            const areaText = parseMetricText(card, 3, '0 sqft').replace('sqft', 'ft²').trim();
            const titleText = card.querySelector('h3')?.textContent?.trim() || parseAddress(card);
            const locationText = card.querySelector('.mls-location')?.textContent?.trim() || '';
            const locationParts = locationText.split('·').map(part => part.trim()).filter(Boolean);
            const cityStateLabel = locationParts[0] || '';
            const countyLabel = locationParts[1] || '';
            const cityLabel = cityStateLabel.split(',')[0]?.trim() || '';
            const listingNote = card.querySelector('.mls-note')?.textContent?.trim() || 'Property overview pending additional underwriting notes.';
            const propertyImages = Array.from(card.querySelectorAll('.mls-property-image'))
                .map(image => image.getAttribute('src') || '')
                .map(src => src.trim())
                .filter(src => src.length > 0);
            const roi = Number(card.dataset.roi || 0);
            const status = normalizeStatus(card.dataset.status);
            const listedAt = new Date(card.dataset.listedAt || new Date().toISOString());
            const daysActive = Math.max(1, Math.floor((Date.now() - listedAt.getTime()) / 86400000));
            const listedAtLabel = Number.isNaN(listedAt.getTime())
                ? new Date().toLocaleDateString()
                : listedAt.toLocaleDateString();
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');

            const propertyPayload = {
                address: parseAddress(card),
                propertyImages,
                propertyDetails: `Single Family / ${bedsText} / ${bathsText} / 3 Gar / 1978 / ${areaText} / 170,320 ft² / Pool: None`,
                listPrice: priceText,
                propensity: Math.max(1, Math.min(10, Math.round(roi))),
                moderatePain: 'Moderate Pain',
                taxDelinquency: 'Tax Delinquency',
                highDebt: 'High Debt (LTV >80%)',
                marketInfo: `${daysActive} Days / ${statusLabel}`,
                dom: daysActive,
                cdom: daysActive,
                askingVsArv: `${(65 + roi).toFixed(2)}%`,
                arv: `$${Math.round(Number((priceText || '$0').replace(/[^0-9]/g, '')) * 1.42).toLocaleString()}`,
                compData: 'A0, P1, B0, C1',
                piq: listingNote,
                comps: '',
                ia: 'Initial analysis suggests moderate upside with value-add potential and stable rental demand in the micro-market.',
                agentRecord: buildAgentRecordFromCard(card),
                offer: 'Offer strategy placeholder: define max allowable offer, desired terms, inspection windows, and contingencies.',
                recordCreated: listedAtLabel,
                listingDate: listedAtLabel,
                idx: 'MLS Sandbox',
                propertyType: 'Residential',
                mlsNumber: String(card.dataset.mlsId || card.dataset.listingId || titleText.replace(/[^A-Z0-9]/gi, '').slice(0, 8) || 'MLS-DEMO').toUpperCase(),
                statusLabel,
                autoTracker: `Active ${daysActive} Day${daysActive === 1 ? '' : 's'}`,
                areaLabel: locationText || '-',
                city: cityLabel,
                county: countyLabel,
                propertyCover: titleText,
                publicComments: listingNote,
                agentComments: 'MLS sandbox listing. Verify showing instructions, disclosures, and offer timeline before submitting terms.',
                apn: '- ',
                unitNumber: '-',
                totalFloors: 'One',
                sewer: 'Unknown',
                propertyCondition: 'Review listing notes',
                zoning: '-',
                associationDues: '-',
                commonWalls: '-',
                lockboxType: '-',
                occupied: 'Unknown',
                showing: 'Confirm with listing agent'
            };

            rememberClickedProperty(card, propertyPayload, status, roi);

            persistSelectedPropertyDetail(propertyPayload);
            window.location.href = 'property-details.html';
        }

        function normalizeStatus(value) {
            const validStatuses = ['active', 'pending', 'on-hold', 'closed'];
            if (validStatuses.includes(value)) {
                return value;
            }
            return 'active';
        }

        function buildSourceUrl(kind, query) {
            const encodedQuery = encodeURIComponent(query);
            if (kind === 'zillow') {
                return `https://www.zillow.com/homes/${encodedQuery}_rb/`;
            }
            return `https://www.redfin.com/search?q=${encodedQuery}`;
        }

        function prepareListingCard(card, index) {
            if (!card.dataset.status) {
                const fallbackStatuses = ['active', 'pending', 'on-hold', 'closed'];
                card.dataset.status = fallbackStatuses[index % fallbackStatuses.length];
            }
            card.dataset.status = normalizeStatus(card.dataset.status);
            card.dataset.listingAlertKey = getListingNotificationKey(card);

            const cardTop = card.querySelector('.mls-card-top');
            if (cardTop && !cardTop.querySelector('.mls-listing-status')) {
                const statusPill = document.createElement('span');
                statusPill.className = `mls-listing-status ${card.dataset.status}`;
                statusPill.textContent = card.dataset.status.replace('-', ' ');
                cardTop.appendChild(statusPill);
            }

            if (!card.querySelector('.mls-source-links')) {
                const heading = card.querySelector('h3')?.textContent?.trim() || '';
                const location = card.querySelector('.mls-location')?.textContent?.trim() || '';
                const searchQuery = `${heading} ${location}`.trim();

                const sourceWrap = document.createElement('div');
                sourceWrap.className = 'mls-source-links';
                sourceWrap.innerHTML = `
                    <a class="mls-source-link" href="${buildSourceUrl('zillow', searchQuery)}" target="_blank" rel="noopener noreferrer">Zillow</a>
                    <a class="mls-source-link" href="${buildSourceUrl('redfin', searchQuery)}" target="_blank" rel="noopener noreferrer">Redfin</a>
                `;
                card.appendChild(sourceWrap);
            }
        }

        cards.forEach((card, index) => {
            prepareListingCard(card, index);
        });

        function renderPagination(totalItems) {
            if (!pagination) {
                return;
            }

            const totalPages = Math.ceil(totalItems / pageSize);
            pagination.innerHTML = '';

            if (totalPages <= 1) {
                pagination.hidden = true;
                return;
            }

            pagination.hidden = false;
            for (let page = 1; page <= totalPages; page += 1) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'mls-page-btn' + (page === currentPage ? ' active' : '');
                button.textContent = `Page ${page}`;
                button.addEventListener('click', () => {
                    currentPage = page;
                    applyFiltersAndSort();
                });
                pagination.appendChild(button);
            }
        }

        function applyFiltersAndSort() {
            const sortMode = sortSelect ? sortSelect.value : 'hot';
            const selectedCounty = countyFilter ? countyFilter.value : 'all';
            const selectedStatus = statusFilter ? statusFilter.value : 'all';
            const keywordCategory = keywordCategoryFilter ? keywordCategoryFilter.value : 'all';
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

            const visibleCards = cards.filter(card => {
                const matchesCounty = selectedCounty === 'all' || card.dataset.county === selectedCounty;
                const matchesStatus = selectedStatus === 'all' || card.dataset.status === selectedStatus;
                const searchableText = getKeywordText(card, keywordCategory);
                const matchesQuery = !query || searchableText.includes(query);
                return matchesCounty && matchesStatus && matchesQuery;
            });

            const sortedCards = visibleCards.sort((left, right) => {
                if (sortMode === 'price-asc') {
                    return Number(left.dataset.price || 0) - Number(right.dataset.price || 0);
                }
                if (sortMode === 'price-desc') {
                    return Number(right.dataset.price || 0) - Number(left.dataset.price || 0);
                }
                if (sortMode === 'newest') {
                    return new Date(right.dataset.listedAt || 0) - new Date(left.dataset.listedAt || 0);
                }
                if (sortMode === 'low-ptfv') {
                    return getPtfvScore(left) - getPtfvScore(right);
                }
                if (sortMode === 'high-ptfv') {
                    return getPtfvScore(right) - getPtfvScore(left);
                }
                if (sortMode === 'city') {
                    return (left.dataset.city || '').localeCompare(right.dataset.city || '');
                }
                return Number(right.dataset.roi || 0) - Number(left.dataset.roi || 0);
            });

            const totalPages = Math.max(1, Math.ceil(sortedCards.length / pageSize));
            if (currentPage > totalPages) {
                currentPage = 1;
            }

            const startIndex = (currentPage - 1) * pageSize;
            const pageCards = sortedCards.slice(startIndex, startIndex + pageSize);

            cards.forEach(card => {
                card.hidden = true;
            });

            pageCards.forEach(card => {
                card.hidden = false;
                listingsGrid.appendChild(card);
            });

            if (emptyState) {
                emptyState.hidden = sortedCards.length !== 0;
            }

            renderPagination(sortedCards.length);
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                currentPage = 1;
                applyFiltersAndSort();
            });
        }
        if (countyFilter) {
            countyFilter.addEventListener('change', () => {
                currentPage = 1;
                applyFiltersAndSort();
            });
        }
        if (keywordCategoryFilter) {
            keywordCategoryFilter.addEventListener('change', () => {
                currentPage = 1;
                applyFiltersAndSort();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentPage = 1;
                applyFiltersAndSort();
            });
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                currentPage = 1;
                applyFiltersAndSort();
            });
        }

        listingsGrid.addEventListener('click', event => {
            if (event.target.closest('.mls-source-link')) {
                return;
            }

            const testLink = event.target.closest('.mls-test-link');
            if (testLink) {
                event.preventDefault();
                const propertyCard = testLink.closest('.mls-property-card');
                if (propertyCard) {
                    openPropertyDetail(propertyCard);
                }
                return;
            }

            const quickViewButton = event.target.closest('.mls-property-peek');
            if (quickViewButton) {
                const propertyCard = quickViewButton.closest('.mls-property-card');
                if (propertyCard) {
                    openPropertyDetail(propertyCard);
                }
                return;
            }

            const propertyCard = event.target.closest('.mls-property-card');
            if (propertyCard) {
                openPropertyDetail(propertyCard);
            }
        });

        const listingObserver = new MutationObserver(mutations => {
            const newCards = [];
            const knownCards = new Set(cards);

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) {
                        return;
                    }

                    if (node.classList.contains('mls-property-card') && !knownCards.has(node)) {
                        newCards.push(node);
                    }

                    node.querySelectorAll?.('.mls-property-card').forEach(card => {
                        if (!knownCards.has(card)) {
                            newCards.push(card);
                        }
                    });
                });
            });

            if (!newCards.length) {
                return;
            }

            newCards.forEach((card, index) => {
                prepareListingCard(card, cards.length + index);
                if (!cards.includes(card)) {
                    cards.push(card);
                }
            });

            seedOrNotifyListings(newCards);
            applyFiltersAndSort();
        });

        listingObserver.observe(listingsGrid, {
            childList: true,
            subtree: true
        });

        applyFiltersAndSort();
        seedOrNotifyListings(cards);
    }

    function initMlsSearchHub() {
        const locationInput = document.getElementById('mls-search-location');
        const minPriceInput = document.getElementById('mls-search-min-price');
        const maxPriceInput = document.getElementById('mls-search-max-price');
        const bedsInput = document.getElementById('mls-search-beds');
        const bathsInput = document.getElementById('mls-search-baths');
        const propertyTypeInput = document.getElementById('mls-search-property-type');
        const keywordInput = document.getElementById('mls-search-keywords');
        const summaryEl = document.getElementById('mls-search-summary');
        const zillowLink = document.getElementById('mls-search-zillow');
        const redfinLink = document.getElementById('mls-search-redfin');
        const realtorLink = document.getElementById('mls-search-realtor');
        const mapsLink = document.getElementById('mls-search-maps');

        if (!locationInput || !summaryEl || !zillowLink || !redfinLink || !realtorLink || !mapsLink) {
            return;
        }

        function buildQuery() {
            const parts = [];
            const location = String(locationInput.value || '').trim();
            const minPrice = String(minPriceInput?.value || '').trim();
            const maxPrice = String(maxPriceInput?.value || '').trim();
            const beds = String(bedsInput?.value || '').trim();
            const baths = String(bathsInput?.value || '').trim();
            const propertyType = String(propertyTypeInput?.value || '').trim();
            const keywords = String(keywordInput?.value || '').trim();

            if (location) parts.push(location);
            if (propertyType) parts.push(propertyType);
            if (beds) parts.push(`${beds}+ beds`);
            if (baths) parts.push(`${baths}+ baths`);
            if (minPrice || maxPrice) {
                parts.push(`price ${minPrice || '0'}-${maxPrice || 'any'}`);
            }
            if (keywords) parts.push(keywords);

            return parts.join(' ').trim();
        }

        function updateSearchLinks() {
            const query = buildQuery();
            const encodedQuery = encodeURIComponent(query || 'California investment property');
            const location = encodeURIComponent(String(locationInput.value || '').trim() || 'California');

            summaryEl.textContent = query || 'Enter a city, ZIP, or county and your buy-box to build instant MLS-style searches.';
            zillowLink.href = `https://www.zillow.com/homes/${encodedQuery}_rb/`;
            redfinLink.href = `https://www.redfin.com/search?q=${encodedQuery}`;
            realtorLink.href = `https://www.realtor.com/realestateandhomes-search/${location}/keyword-${encodedQuery}`;
            mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        }

        [locationInput, minPriceInput, maxPriceInput, bedsInput, bathsInput, propertyTypeInput, keywordInput].forEach(input => {
            if (!input) {
                return;
            }
            input.addEventListener('input', updateSearchLinks);
            input.addEventListener('change', updateSearchLinks);
        });

        updateSearchLinks();
    }

    function initFlyerMaker() {
        const titleInput = document.getElementById('flyer-title-input');
        const templateSelect = document.getElementById('flyer-template-select');
        const bodyInput = document.getElementById('flyer-body-input');
        const contactUserSelect = document.getElementById('flyer-contact-user');
        const titlePreview = document.getElementById('flyer-preview-title');
        const bodyPreview = document.getElementById('flyer-preview-body');
        const contactPreview = document.getElementById('flyer-preview-contact');
        const flyerPreview = document.getElementById('flyer-preview');
        const downloadJpgBtn = document.getElementById('flyer-download-jpg');
        const downloadPdfBtn = document.getElementById('flyer-download-pdf');

        if (!titleInput || !bodyInput || !titlePreview || !bodyPreview || !flyerPreview) {
            return;
        }

        let html2CanvasLoaderPromise = null;
        let jsPdfLoaderPromise = null;
        let flyerContacts = [];
        const FLYER_TEMPLATES = {
            'we-want-your-home-fixer': {
                title: 'WE WANT YOUR HOME!',
                body: [
                    'CASH BUYER LOOKING FOR FIXER PROPERTIES',
                    '📍 Areas of Interest',
                    'Los Angeles County',
                    'Orange County',
                    'Riverside County',
                    'San Bernardino County',
                    '',
                    '🏠 Purchase Range:',
                    '$300,000 up to $1,000,000+ depending on the area and condition.',
                    '✓ Distressed properties',
                    '✓ Fixers / heavy rehab',
                    'Probate or inherited homes',
                    'Properties with problem tenants',
                    '✓ Off-market opportunities'
                ].join('\n')
            }
        };

        function normalizeEmail(value) {
            return normalizeUserIdentityValue(value);
        }

        function normalizeName(value) {
            return String(value || '').trim();
        }

        function makeNameKey(name) {
            return normalizeName(name).toLowerCase().replace(/\s+/g, '-');
        }

        function readUserProfileStore() {
            try {
                const parsed = JSON.parse(localStorage.getItem('userProfilesByUser') || '{}');
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        function getUserPhoneHint(email, name) {
            const store = readUserProfileStore();
            const emailAliases = getUserIdentityAliases({ email, name });
            const nameKey = makeNameKey(name);

            const fromEmail = emailAliases.map((alias) => store[alias]).find((entry) => entry && typeof entry === 'object') || null;
            const fromName = nameKey ? store[nameKey] : null;
            const profile = fromEmail || fromName || {};
            return String(profile.phone || '').trim();
        }

        function getCurrentUser() {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                return user && typeof user === 'object' ? user : {};
            } catch (error) {
                return {};
            }
        }

        function buildContactLine(contact) {
            if (!contact) {
                return 'Contact us: Select a user';
            }

            const parts = [normalizeName(contact.name || 'FAST BRIDGE GROUP')];
            const phone = String(contact.phone || '').trim();
            const email = normalizeEmail(contact.email || '');
            if (phone) {
                parts.push(phone);
            }
            if (email) {
                parts.push(email);
            }

            return `Contact us: ${parts.join(' | ')}`;
        }

        function renderContactOptions() {
            if (!contactUserSelect) {
                return;
            }

            const existingValue = String(contactUserSelect.value || '').trim();
            const currentUser = getCurrentUser();
            const currentUserEmail = normalizeEmail(currentUser.email || '');

            contactUserSelect.innerHTML = '<option value="">Select a user for Contact Us</option>';

            flyerContacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = normalizeEmail(contact.email || '') || makeNameKey(contact.name || '');
                option.textContent = normalizeEmail(contact.email)
                    ? `${contact.name} (${normalizeEmail(contact.email)})`
                    : contact.name;
                contactUserSelect.appendChild(option);
            });

            const validValues = new Set(flyerContacts.map(contact => normalizeEmail(contact.email || '') || makeNameKey(contact.name || '')));
            if (existingValue && validValues.has(existingValue)) {
                contactUserSelect.value = existingValue;
                return;
            }

            const currentMatch = flyerContacts.find(contact => normalizeEmail(contact.email || '') === currentUserEmail);
            if (currentMatch) {
                contactUserSelect.value = normalizeEmail(currentMatch.email || '') || makeNameKey(currentMatch.name || '');
                return;
            }

            if (flyerContacts.length > 0) {
                contactUserSelect.value = normalizeEmail(flyerContacts[0].email || '') || makeNameKey(flyerContacts[0].name || '');
            }
        }

        function getSelectedContact() {
            if (!contactUserSelect) {
                return null;
            }

            const selectedValue = String(contactUserSelect.value || '').trim();
            if (!selectedValue) {
                return null;
            }

            return flyerContacts.find(contact => {
                const contactValue = normalizeEmail(contact.email || '') || makeNameKey(contact.name || '');
                return contactValue === selectedValue;
            }) || null;
        }

        async function loadFlyerContacts() {
            const fromApi = [];
            const token = localStorage.getItem('authToken');

            if (token) {
                try {
                    const response = await fetch('/api/users', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const payload = await response.json();
                        const rows = Array.isArray(payload?.users) ? payload.users : [];
                        rows.forEach(user => {
                            const name = normalizeName(user?.name || '');
                            const email = normalizeEmail(user?.email || '');
                            if (!name && !email) {
                                return;
                            }
                            fromApi.push({
                                name: name || email || 'User',
                                email,
                                phone: getUserPhoneHint(email, name)
                            });
                        });
                    }
                } catch (error) {
                    // Ignore API errors and fall back to local user context.
                }
            }

            const currentUser = getCurrentUser();
            const currentName = normalizeName(currentUser.name || '');
            const currentEmail = normalizeEmail(currentUser.email || '');
            const fallbackContacts = [];

            // Keep core admins available in the flyer contact list even if API fetch is unavailable.
            fallbackContacts.push({
                name: 'Steve Medina',
                email: 'steve.medina@fastbridgegroupllc.com',
                phone: getUserPhoneHint('steve.medina@fastbridgegroupllc.com', 'Steve Medina')
            });

            if (currentName || currentEmail) {
                fallbackContacts.push({
                    name: currentName || currentEmail || 'User',
                    email: currentEmail,
                    phone: getUserPhoneHint(currentEmail, currentName)
                });
            }

            const merged = [...fromApi, ...fallbackContacts];
            const unique = [];
            const seen = new Set();

            merged.forEach(contact => {
                const key = normalizeEmail(contact.email || '') || makeNameKey(contact.name || '');
                if (!key || seen.has(key)) {
                    return;
                }
                seen.add(key);
                unique.push(contact);
            });

            flyerContacts = unique;
            renderContactOptions();
        }

        function makeFlyerFileName(extension) {
            const title = String(titleInput.value || '').trim();
            const slug = (title || 'flyer')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            return `${slug || 'flyer'}.${extension}`;
        }

        function loadHtml2Canvas() {
            if (window.html2canvas) {
                return Promise.resolve(window.html2canvas);
            }

            if (html2CanvasLoaderPromise) {
                return html2CanvasLoaderPromise;
            }

            html2CanvasLoaderPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                script.async = true;
                script.onload = () => {
                    if (window.html2canvas) {
                        resolve(window.html2canvas);
                        return;
                    }
                    reject(new Error('html2canvas did not initialize.'));
                };
                script.onerror = () => reject(new Error('Failed to load html2canvas.'));
                document.head.appendChild(script);
            });

            return html2CanvasLoaderPromise;
        }

        function loadJsPdf() {
            if (window.jspdf && window.jspdf.jsPDF) {
                return Promise.resolve(window.jspdf.jsPDF);
            }

            if (jsPdfLoaderPromise) {
                return jsPdfLoaderPromise;
            }

            jsPdfLoaderPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
                script.async = true;
                script.onload = () => {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        resolve(window.jspdf.jsPDF);
                        return;
                    }
                    reject(new Error('jsPDF did not initialize.'));
                };
                script.onerror = () => reject(new Error('Failed to load jsPDF.'));
                document.head.appendChild(script);
            });

            return jsPdfLoaderPromise;
        }

        async function captureFlyerCanvas() {
            const html2canvas = await loadHtml2Canvas();
            return html2canvas(flyerPreview, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });
        }

        async function downloadFlyerAsJpg() {
            try {
                const canvas = await captureFlyerCanvas();
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.download = makeFlyerFileName('jpg');
                document.body.appendChild(link);
                link.click();
                link.remove();
                if (typeof showDashboardToast === 'function') {
                    showDashboardToast('success', 'Flyer Downloaded', 'Flyer JPG downloaded successfully.');
                }
            } catch (error) {
                if (typeof showDashboardToast === 'function') {
                    showDashboardToast('error', 'Download Failed', 'Unable to export Flyer JPG right now.');
                }
            }
        }

        async function downloadFlyerAsPdf() {
            try {
                const [JsPdfConstructor, canvas] = await Promise.all([loadJsPdf(), captureFlyerCanvas()]);
                const imageData = canvas.toDataURL('image/jpeg', 0.95);

                const pdf = new JsPdfConstructor({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'letter'
                });

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const widthRatio = pageWidth / canvas.width;
                const heightRatio = pageHeight / canvas.height;
                const scale = Math.min(widthRatio, heightRatio);

                const renderWidth = canvas.width * scale;
                const renderHeight = canvas.height * scale;
                const offsetX = (pageWidth - renderWidth) / 2;
                const offsetY = (pageHeight - renderHeight) / 2;

                pdf.addImage(imageData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
                pdf.save(makeFlyerFileName('pdf'));

                if (typeof showDashboardToast === 'function') {
                    showDashboardToast('success', 'Flyer Downloaded', 'Flyer PDF downloaded successfully.');
                }
            } catch (error) {
                if (typeof showDashboardToast === 'function') {
                    showDashboardToast('error', 'Download Failed', 'Unable to export Flyer PDF right now.');
                }
            }
        }

        function updateFlyerPreview() {
            const title = String(titleInput.value || '').trim();
            const body = String(bodyInput.value || '').trim();

            titlePreview.textContent = title || 'YOUR FLYER TITLE';
            bodyPreview.textContent = body || 'Add flyer text to preview your announcement here.';
            if (contactPreview) {
                contactPreview.textContent = buildContactLine(getSelectedContact());
            }
        }

        function syncTemplateFromInputs() {
            if (!templateSelect) {
                return;
            }

            const currentTitle = String(titleInput.value || '').trim();
            const currentBody = String(bodyInput.value || '').trim();
            const templateEntries = Object.entries(FLYER_TEMPLATES);
            for (const [templateKey, template] of templateEntries) {
                if (currentTitle === String(template?.title || '').trim() && currentBody === String(template?.body || '').trim()) {
                    templateSelect.value = templateKey;
                    return;
                }
            }

            templateSelect.value = '';
        }

        titleInput.addEventListener('input', () => {
            syncTemplateFromInputs();
            updateFlyerPreview();
        });
        bodyInput.addEventListener('input', () => {
            syncTemplateFromInputs();
            updateFlyerPreview();
        });
        titleInput.addEventListener('change', () => {
            syncTemplateFromInputs();
            updateFlyerPreview();
        });
        bodyInput.addEventListener('change', () => {
            syncTemplateFromInputs();
            updateFlyerPreview();
        });

        if (templateSelect) {
            templateSelect.addEventListener('change', () => {
                const selectedTemplate = String(templateSelect.value || '').trim();
                if (selectedTemplate && FLYER_TEMPLATES[selectedTemplate]) {
                    const template = FLYER_TEMPLATES[selectedTemplate];
                    titleInput.value = String(template.title || '');
                    bodyInput.value = String(template.body || '');
                }
                updateFlyerPreview();
            });
        }

        if (contactUserSelect) {
            contactUserSelect.addEventListener('change', updateFlyerPreview);
        }

        if (downloadJpgBtn) {
            downloadJpgBtn.addEventListener('click', downloadFlyerAsJpg);
        }

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', downloadFlyerAsPdf);
        }

        loadFlyerContacts().finally(() => {
            syncTemplateFromInputs();
            updateFlyerPreview();
        });
    }

    function initContractsWidget() {
        const downloadPdfBtn = document.getElementById('contract-download-pdf');

        if (!downloadPdfBtn) {
            return;
        }

        let jsPdfLoaderPromise = null;
        const clauses = [
            {
                title: 'Limited Purpose',
                body: 'The brokerage grants FAST BRIDGE GROUP, LLC a limited, non-exclusive, revocable permission to reference and use the brokerage\'s real estate license, broker supervision, and related MLS authorization strictly as required to access, receive, display, and maintain MLS data and IDX/VOW-related compliance on FAST BRIDGE systems.'
            },
            {
                title: 'No Ownership, Control, or IP Rights',
                body: 'The brokerage acknowledges and agrees that it has no ownership interest, no equity, no control rights, and no claim whatsoever over FAST BRIDGE GROUP, LLC\'s website, source code, software, automations, user interface, databases, workflows, CRM logic, designs, branding, domains, marketing systems, investor lists, written content, graphics, or business operations. This Agreement does not transfer, assign, license, encumber, or imply any rights in FAST BRIDGE intellectual property other than the narrow MLS/data-use permission expressly stated above.'
            },
            {
                title: 'FAST BRIDGE Responsibility',
                body: 'FAST BRIDGE GROUP, LLC will retain full responsibility for the design, development, hosting, coding, security, maintenance, uptime, vendor relationships, data handling decisions, and all website-related operations. FAST BRIDGE GROUP, LLC will bear responsibility for its own website conduct, implementation choices, and compliance workflows, except that the brokerage remains responsible only for duties that by law cannot be delegated away under its license or MLS rules.'
            },
            {
                title: 'MLS Data Boundary',
                body: 'Any MLS data, listing content, or brokerage-required compliance materials remain subject to applicable MLS rules, broker supervision requirements, and third-party data rights. Outside of that MLS-specific content, all remaining systems, features, code, and platform assets belong exclusively to FAST BRIDGE GROUP, LLC.'
            },
            {
                title: 'No Partnership or Work-for-Hire',
                body: 'This Agreement does not create a partnership, joint venture, merger, employer relationship, franchise, or work-for-hire arrangement. The brokerage is not the owner, developer, operator, or purchaser of the FAST BRIDGE website or codebase by virtue of providing MLS licensing access.'
            },
            {
                title: 'Termination',
                body: 'Upon termination, FAST BRIDGE GROUP, LLC will discontinue use of the brokerage\'s license and any MLS/IDX permissions tied to that brokerage unless replaced by another valid authorization. Termination does not grant the brokerage any right to seize, demand transfer of, copy, or control FAST BRIDGE systems, software, or website assets.'
            }
        ];

        const fieldReaders = {
            effectiveDate: () => document.getElementById('contract-effective-date')?.value || '',
            market: () => document.getElementById('contract-mls-market')?.value || '',
            brokerageName: () => document.getElementById('contract-brokerage-name')?.value || '',
            brokerageSignerName: () => document.getElementById('contract-brokerage-signer-name')?.value || '',
            brokerageSignerTitle: () => document.getElementById('contract-brokerage-signer-title')?.value || '',
            brokerageSignature: () => document.getElementById('contract-brokerage-signature')?.value || '',
            brokerageSignDate: () => document.getElementById('contract-brokerage-sign-date')?.value || '',
            fastbridgeSignerName: () => document.getElementById('contract-fastbridge-signer-name')?.value || '',
            fastbridgeSignerTitle: () => document.getElementById('contract-fastbridge-signer-title')?.value || '',
            fastbridgeSignature: () => document.getElementById('contract-fastbridge-signature')?.value || '',
            fastbridgeSignDate: () => document.getElementById('contract-fastbridge-sign-date')?.value || '',
            extraSignerName: () => document.getElementById('contract-extra-signer-name')?.value || '',
            extraSignerTitle: () => document.getElementById('contract-extra-signer-title')?.value || '',
            extraSignature: () => document.getElementById('contract-extra-signature')?.value || '',
            extraSignDate: () => document.getElementById('contract-extra-sign-date')?.value || ''
        };

        function normalizeValue(value, fallback) {
            const normalized = String(value || '').trim();
            return normalized || fallback;
        }

        function formatDateValue(value) {
            const rawValue = String(value || '').trim();
            if (!rawValue) {
                return '________________';
            }

            const parsed = new Date(rawValue);
            if (Number.isNaN(parsed.getTime())) {
                return rawValue;
            }

            return parsed.toLocaleDateString();
        }

        function buildAgreementFileName(brokerageName) {
            const slug = normalizeValue(brokerageName, 'mls-data-license-only')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            return `${slug || 'mls-data-license-only'}-agreement.pdf`;
        }

        function loadJsPdf() {
            if (window.jspdf && window.jspdf.jsPDF) {
                return Promise.resolve(window.jspdf.jsPDF);
            }

            if (jsPdfLoaderPromise) {
                return jsPdfLoaderPromise;
            }

            jsPdfLoaderPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
                script.async = true;
                script.onload = () => {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        resolve(window.jspdf.jsPDF);
                        return;
                    }
                    reject(new Error('jsPDF did not initialize.'));
                };
                script.onerror = () => reject(new Error('Failed to load jsPDF.'));
                document.head.appendChild(script);
            });

            return jsPdfLoaderPromise;
        }

        function buildAgreementSections() {
            const agreementData = {
                effectiveDate: formatDateValue(fieldReaders.effectiveDate()),
                market: normalizeValue(fieldReaders.market(), '________________'),
                brokerageName: normalizeValue(fieldReaders.brokerageName(), 'the licensed brokerage identified below'),
                brokerageSignerName: normalizeValue(fieldReaders.brokerageSignerName(), '________________'),
                brokerageSignerTitle: normalizeValue(fieldReaders.brokerageSignerTitle(), '________________'),
                brokerageSignature: normalizeValue(fieldReaders.brokerageSignature(), '________________'),
                brokerageSignDate: formatDateValue(fieldReaders.brokerageSignDate()),
                fastbridgeSignerName: normalizeValue(fieldReaders.fastbridgeSignerName(), '________________'),
                fastbridgeSignerTitle: normalizeValue(fieldReaders.fastbridgeSignerTitle(), '________________'),
                fastbridgeSignature: normalizeValue(fieldReaders.fastbridgeSignature(), '________________'),
                fastbridgeSignDate: formatDateValue(fieldReaders.fastbridgeSignDate()),
                extraSignerName: normalizeValue(fieldReaders.extraSignerName(), '________________'),
                extraSignerTitle: normalizeValue(fieldReaders.extraSignerTitle(), '________________'),
                extraSignature: normalizeValue(fieldReaders.extraSignature(), '________________'),
                extraSignDate: formatDateValue(fieldReaders.extraSignDate())
            };

            const sections = [
                {
                    heading: 'License Agreement / Data Use Agreement',
                    lines: [
                        'MLS Data License Only',
                        `Effective Date: ${agreementData.effectiveDate}`,
                        `MLS Market / Region: ${agreementData.market}`,
                        `Brokerage Legal Name: ${agreementData.brokerageName}`,
                        '',
                        `This Agreement is entered into by and between FAST BRIDGE GROUP, LLC and ${agreementData.brokerageName} solely for the limited purpose of enabling lawful MLS data access, display, and compliance under the brokerage\'s license.`
                    ]
                },
                {
                    heading: 'Working Draft Notice',
                    lines: [
                        'This agreement is drafted to allow a brokerage license to be used strictly for MLS data access and compliance. FAST BRIDGE GROUP, LLC retains full ownership and control of the website, codebase, software, branding, business processes, and all non-MLS intellectual property. Final legal review is still recommended before signing.'
                    ]
                },
                ...clauses.map((clause, index) => ({
                    heading: `${String(index + 1).padStart(2, '0')} ${clause.title}`,
                    lines: [clause.body]
                })),
                {
                    heading: 'Intent of This Agreement',
                    lines: [
                        'The brokerage is being engaged only so FAST BRIDGE can lawfully use the brokerage\'s license for MLS data access. The brokerage is not obtaining any ownership, management, coding rights, website rights, or business rights in FAST BRIDGE GROUP, LLC, at all.'
                    ]
                },
                {
                    heading: 'Signature Blocks',
                    lines: [
                        `Brokerage Signer: ${agreementData.brokerageSignerName}`,
                        `Title: ${agreementData.brokerageSignerTitle}`,
                        `Signature: ${agreementData.brokerageSignature}`,
                        `Date: ${agreementData.brokerageSignDate}`,
                        '',
                        `FAST BRIDGE GROUP, LLC Signer: ${agreementData.fastbridgeSignerName}`,
                        `Title: ${agreementData.fastbridgeSignerTitle}`,
                        `Signature: ${agreementData.fastbridgeSignature}`,
                        `Date: ${agreementData.fastbridgeSignDate}`,
                        '',
                        `Additional Signer: ${agreementData.extraSignerName}`,
                        `Title / Role: ${agreementData.extraSignerTitle}`,
                        `Signature: ${agreementData.extraSignature}`,
                        `Date: ${agreementData.extraSignDate}`
                    ]
                }
            ];

            return {
                sections,
                fileName: buildAgreementFileName(agreementData.brokerageName)
            };
        }

        async function downloadAgreementPdf() {
            downloadPdfBtn.disabled = true;

            try {
                const JsPdfConstructor = await loadJsPdf();
                const { sections, fileName } = buildAgreementSections();
                const pdf = new JsPdfConstructor({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'letter'
                });

                const marginX = 48;
                const pageHeight = pdf.internal.pageSize.getHeight();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const contentWidth = pageWidth - (marginX * 2);
                const bottomMargin = 56;
                let cursorY = 58;

                function ensurePage(requiredHeight) {
                    if (cursorY + requiredHeight <= pageHeight - bottomMargin) {
                        return;
                    }
                    pdf.addPage();
                    cursorY = 58;
                }

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(18);
                pdf.text('FAST BRIDGE GROUP, LLC', marginX, cursorY);
                cursorY += 24;

                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                pdf.text('License Agreement / Data Use Agreement PDF Export', marginX, cursorY);
                cursorY += 24;

                sections.forEach((section, sectionIndex) => {
                    const bodyLines = [];
                    section.lines.forEach((line) => {
                        if (!String(line || '').trim()) {
                            bodyLines.push('');
                            return;
                        }
                        const wrappedLines = pdf.splitTextToSize(String(line), contentWidth);
                        wrappedLines.forEach((wrappedLine) => bodyLines.push(wrappedLine));
                    });

                    const estimatedHeight = 22 + (Math.max(1, bodyLines.length) * 14) + 10;
                    ensurePage(estimatedHeight);

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(sectionIndex === 0 ? 16 : 12);
                    pdf.text(section.heading, marginX, cursorY);
                    cursorY += sectionIndex === 0 ? 22 : 18;

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(11);
                    bodyLines.forEach((line) => {
                        if (!line) {
                            cursorY += 8;
                            return;
                        }
                        ensurePage(18);
                        pdf.text(line, marginX, cursorY);
                        cursorY += 14;
                    });

                    cursorY += 10;
                });

                pdf.save(fileName);
                showDashboardToast('success', 'Agreement Downloaded', 'MLS Data License Only was downloaded as a PDF.');
            } catch (error) {
                showDashboardToast('error', 'Download Failed', 'Unable to generate the agreement PDF right now.');
            } finally {
                downloadPdfBtn.disabled = false;
            }
        }

        downloadPdfBtn.addEventListener('click', downloadAgreementPdf);
    }

    async function initDealsPage() {
        const list = document.getElementById('deals-compact-list');
        const count = document.getElementById('deals-compact-count');
        const assignedList = document.getElementById('assigned-properties-list');
        const assignedCount = document.getElementById('assigned-properties-count');
        const importOverlay = document.getElementById('deals-import-overlay');
        const importOpenButton = document.getElementById('deals-import-open');
        const importForm = document.getElementById('deals-import-form');
        const importResetButton = document.getElementById('deals-import-reset');
        const importCloseButtons = importOverlay
            ? Array.from(importOverlay.querySelectorAll('[data-deals-import-close="true"]'))
            : [];

        if (!list || !count || !assignedList || !assignedCount) {
            return;
        }

        await propertyAssignmentsReady;

        const workspaceUser = getWorkspaceUserContext();

        function closeImportWidget() {
            if (!importOverlay || importOverlay.hasAttribute('hidden')) {
                return;
            }

            importOverlay.setAttribute('hidden', 'hidden');
            if (importOpenButton) {
                importOpenButton.setAttribute('aria-expanded', 'false');
            }
            document.body.style.overflow = '';
        }

        function openImportWidget() {
            if (!importOverlay) {
                return;
            }

            importOverlay.removeAttribute('hidden');
            if (importOpenButton) {
                importOpenButton.setAttribute('aria-expanded', 'true');
            }
            document.body.style.overflow = 'hidden';

            window.setTimeout(() => {
                const firstInput = document.getElementById('deals-import-address');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 40);
        }

        if (importOpenButton) {
            importOpenButton.addEventListener('click', openImportWidget);
        }

        importCloseButtons.forEach(button => {
            button.addEventListener('click', closeImportWidget);
        });

        if (importOverlay) {
            importOverlay.addEventListener('click', event => {
                if (event.target === importOverlay) {
                    closeImportWidget();
                }
            });
        }

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeImportWidget();
            }
        });

        function normalizeStatus(value) {
            return ['active', 'pending', 'on-hold', 'closed'].includes(value) ? value : 'active';
        }

        function normalizeMoney(value, fallback = '$0') {
            const raw = String(value || '').trim();
            if (!raw) {
                return fallback;
            }
            if (/^\$/.test(raw)) {
                return raw;
            }
            const digits = raw.replace(/[^0-9.]/g, '');
            if (!digits) {
                return fallback;
            }
            const amount = Number(digits);
            if (!Number.isFinite(amount)) {
                return fallback;
            }
            return `$${Math.round(amount).toLocaleString()}`;
        }

        function normalizeMetric(value, suffix, fallback) {
            const raw = String(value || '').trim();
            if (!raw) {
                return fallback;
            }
            return /[a-z]/i.test(raw) ? raw : `${raw} ${suffix}`;
        }

        function getImportedPropertyImage(value) {
            const raw = String(value || '').trim();
            return raw || 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80';
        }

        function createImportedPropertyRecord(formData) {
            const address = String(formData.get('address') || '').trim();
            const location = String(formData.get('location') || '').trim();
            const mlsId = String(formData.get('mlsId') || '').trim();
            const price = normalizeMoney(formData.get('price'), '$0');
            const arv = normalizeMoney(formData.get('arv'), price);
            const beds = normalizeMetric(formData.get('beds'), 'Beds', '0 Beds');
            const baths = normalizeMetric(formData.get('baths'), 'Baths', '0 Baths');
            const area = normalizeMetric(formData.get('area'), 'sqft', '0 sqft');
            const status = normalizeStatus(String(formData.get('status') || 'active').trim());
            const roi = Number(formData.get('roi'));
            const domValue = Number(formData.get('dom'));
            const dom = Number.isFinite(domValue) && domValue >= 0 ? domValue : 0;
            const imageUrl = getImportedPropertyImage(formData.get('imageUrl'));
            const notes = String(formData.get('notes') || '').trim() || 'Imported from your own MLS property entry.';
            const agentName = String(formData.get('agentName') || '').trim();
            const agentPhone = String(formData.get('agentPhone') || '').trim();
            const agentEmail = String(formData.get('agentEmail') || '').trim();

            const propertySnapshot = {
                address,
                propertyImages: [imageUrl],
                propertyDetails: `Single Family / ${beds.replace('Beds', 'Br').trim()} / ${baths.replace('Baths', 'Ba').trim()} / 2 Gar / -- / ${area.replace('sqft', 'ft²').trim()} / Lot Size TBD / Pool: Unknown`,
                listPrice: price,
                propensity: Math.max(1, Math.min(10, Math.round(Number.isFinite(roi) ? roi : 6))),
                moderatePain: 'Imported Listing',
                taxDelinquency: mlsId ? `MLS ID ${mlsId}` : 'MLS Import',
                highDebt: 'Confirm title, debt, and encumbrances during due diligence.',
                marketInfo: `${dom} Days / ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}`,
                dom,
                cdom: dom,
                askingVsArv: (() => {
                    const priceNum = Number(price.replace(/[^0-9.]/g, ''));
                    const arvNum = Number(arv.replace(/[^0-9.]/g, ''));
                    if (priceNum > 0 && arvNum > 0) {
                        return `${((priceNum / arvNum) * 100).toFixed(2)}%`;
                    }
                    return 'N/A';
                })(),
                arv,
                compData: 'Imported MLS property',
                piq: notes,
                comps: '',
                ia: 'Imported manually into My Deals. Review comps, rehab scope, rent assumptions, and exit strategy before drafting terms.',
                agentRecord: {
                    name: agentName || 'Listing Agent',
                    title: 'Agent Record',
                    phone: agentPhone || 'TBD',
                    email: agentEmail || 'TBD',
                    brokerage: 'MLS Import',
                    avgResponse: 'Unknown',
                    averageDealsPerYear: '-',
                    specialties: 'Imported listing'
                },
                offer: 'Imported listing: build your offer strategy, inspection window, and negotiation plan here.',
                recordCreated: new Date().toLocaleDateString(),
                listingDate: new Date().toLocaleDateString(),
                idx: 'Manual MLS Import',
                propertyType: 'Residential',
                mlsNumber: mlsId || 'MANUAL',
                statusLabel: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
                autoTracker: `Active ${dom} Day${dom === 1 ? '' : 's'}`,
                areaLabel: location || 'Imported MLS Property',
                propertyCover: address || 'Imported Property',
                publicComments: notes,
                agentComments: 'Imported from manual MLS entry. Confirm disclosures, showing notes, and timeline before drafting terms.',
                apn: '-',
                unitNumber: '-',
                totalFloors: '-',
                sewer: '-',
                propertyCondition: '-',
                zoning: '-',
                associationDues: '-',
                commonWalls: '-',
                lockboxType: '-',
                occupied: '-',
                showing: '-'
            };

            return {
                id: `manual:${mlsId || address.toLowerCase().replace(/\s+/g, '-')}`,
                address,
                location: location || 'Imported MLS Property',
                price,
                beds,
                baths,
                area,
                status,
                roi: Number.isFinite(roi) ? roi.toFixed(1) : '0.0',
                imageUrl,
                clickedAt: Date.now(),
                propertySnapshot
            };
        }

        function saveImportedProperty(record) {
            const items = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key);
            const nextItems = [record, ...items.filter(item => String(item.id || '') !== record.id)].slice(0, 120);
            setUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key, nextItems);
            window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
        }

        function getAssignedItemsForWorkspaceUser() {
            const assignmentStore = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
            return Object.values(assignmentStore)
                .filter(item => item && typeof item === 'object')
            .filter(item => usersMatch(item.assignedTo || {}, workspaceUser))
                .sort((a, b) => new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime());
        }

        function buildAssignedByLabel(item) {
            const assignedBy = item.assignedBy && typeof item.assignedBy === 'object' ? item.assignedBy : {};
            const assignedByName = String(assignedBy.name || assignedBy.email || 'Unknown user').trim();
            const assignedAt = item.assignedAt ? new Date(item.assignedAt) : null;
            const assignedAtLabel = assignedAt && !Number.isNaN(assignedAt.getTime())
                ? assignedAt.toLocaleDateString()
                : '';

            if (assignedAtLabel) {
                return `Assigned by ${assignedByName} on ${assignedAtLabel}`;
            }

            return `Assigned by ${assignedByName}`;
        }

        function renderAssigned() {
            const items = getAssignedItemsForWorkspaceUser();
            assignedCount.textContent = String(items.length);
            assignedList.innerHTML = '';

            if (items.length === 0) {
                assignedList.innerHTML = '<p class="deals-compact-empty">No properties have been assigned to you yet.</p>';
                return;
            }

            items.forEach(item => {
                const snapshot = item.propertySnapshot && typeof item.propertySnapshot === 'object'
                    ? item.propertySnapshot
                    : {};
                const statusValue = String(snapshot.piqAgentStatus || 'none').trim().toLowerCase() || 'none';
                const statusLabel = formatAgentStatusLabel(statusValue);
                const roiText = Number(snapshot.roi || item.roi || 0).toFixed(1);

                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'deals-compact-row';
                row.innerHTML = `
                    <div class="deals-compact-thumb-wrap">
                        <img class="deals-compact-thumb" src="${String(snapshot.propertyImages?.[0] || item.imageUrl || '').trim()}" alt="Assigned property preview">
                    </div>
                    <div class="deals-compact-main">
                        <p class="deals-compact-address">${String(item.propertyAddress || snapshot.address || 'Property')}</p>
                        <p class="deals-compact-meta">${String(snapshot.marketInfo || snapshot.location || item.location || '-')}</p>
                        <p class="deals-assigned-by"><strong>${buildAssignedByLabel(item)}</strong></p>
                    </div>
                    <div class="deals-compact-side">
                        <span class="deals-assigned-pill">Assigned</span>
                        <span class="deals-status-pill ${statusValue.replace(/\s+/g, '-').replace(/[^a-z-]/g, '')}">${statusLabel}</span>
                        <span class="deals-roi">ROI ${roiText}%</span>
                    </div>
                `;

                row.addEventListener('click', () => {
                    if (snapshot && typeof snapshot === 'object') {
                        localStorage.setItem('selectedPropertyDetail', JSON.stringify(snapshot));
                    }
                    window.location.href = 'property-details.html';
                });

                assignedList.appendChild(row);
            });
        }

        function render() {
            const items = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key)
                .slice()
                .sort((a, b) => (Number(b.clickedAt) || 0) - (Number(a.clickedAt) || 0));

            count.textContent = String(items.length);
            list.innerHTML = '';

            if (items.length === 0) {
                list.innerHTML = '<p class="deals-compact-empty">No clicked properties yet. Open properties in MLS Hot Deals and they will appear here.</p>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'deals-compact-row';

                const statusLabel = String(item.status || 'active').replace('-', ' ');
                const roiText = Number(item.roi || 0).toFixed(1);

                row.innerHTML = `
                    <div class="deals-compact-thumb-wrap">
                        <img class="deals-compact-thumb" src="${String(item.imageUrl || '').trim()}" alt="Property preview">
                    </div>
                    <div class="deals-compact-main">
                        <p class="deals-compact-address">${String(item.address || 'Property')}</p>
                        <p class="deals-compact-meta">${String(item.location || '-')}
                        <span>•</span> ${String(item.price || '$0')} <span>•</span> ${String(item.beds || '0 Beds')} <span>•</span> ${String(item.baths || '0 Baths')} <span>•</span> ${String(item.area || '0 sqft')}</p>
                    </div>
                    <div class="deals-compact-side">
                        <span class="deals-status-pill ${statusLabel.replace(/\s+/g, '-')}">${statusLabel}</span>
                        <span class="deals-roi">ROI ${roiText}%</span>
                    </div>
                `;

                row.addEventListener('click', () => {
                    if (item.propertySnapshot && typeof item.propertySnapshot === 'object') {
                        localStorage.setItem('selectedPropertyDetail', JSON.stringify(item.propertySnapshot));
                    }
                    window.location.href = 'property-details.html';
                });

                list.appendChild(row);
            });

            renderAssigned();
        }

        render();
        window.addEventListener('storage', render);
        window.addEventListener('dashboard-data-updated', render);
        window.addEventListener('property-assignment-updated', render);

        if (importForm) {
            importForm.addEventListener('submit', event => {
                event.preventDefault();

                const addressInput = document.getElementById('deals-import-address');
                const priceInput = document.getElementById('deals-import-price');
                if (!addressInput || !String(addressInput.value || '').trim()) {
                    showDashboardToast('error', 'Address Required', 'Enter the property address before importing.');
                    return;
                }
                if (!priceInput || !String(priceInput.value || '').trim()) {
                    showDashboardToast('error', 'List Price Required', 'Enter the list price before importing.');
                    return;
                }

                const payload = new FormData(importForm);
                const record = createImportedPropertyRecord(payload);
                saveImportedProperty(record);
                localStorage.setItem('selectedPropertyDetail', JSON.stringify(record.propertySnapshot));
                importForm.reset();
                closeImportWidget();
                const defaultStatus = document.getElementById('deals-import-status');
                if (defaultStatus) {
                    defaultStatus.value = 'active';
                }
                showDashboardToast('success', 'Property Imported', 'Your MLS property was added to My Deals and opened in the system.');
                render();
                window.location.href = 'property-details.html';
            });
        }

        if (importResetButton && importForm) {
            importResetButton.addEventListener('click', () => {
                importForm.reset();
                const defaultStatus = document.getElementById('deals-import-status');
                if (defaultStatus) {
                    defaultStatus.value = 'active';
                }
            });
        }
    }

    // ============================================
    // Property Detail Page
    // ============================================
    async function initPropertyDetailPage() {
        const addressEl = document.getElementById('property-address-title');
        if (!addressEl) return;
        await propertyAssignmentsReady;
        const legacyCompsLine = 'Comparable set will include similar bed/bath properties within 1.0 mile radius and the last 6-12 month window.';

        let detailData = null;
        detailData = getPersistedSelectedPropertyDetail();

        const defaultDetailData = {
            address: 'No property selected',
            propertyImages: [
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'
            ],
            propertyDetails: 'Single Family / 4 Br / 2 Ba / 3 Gar / 1978 / 2,839 ft² / 170,320 ft² / Pool: None',
            listPrice: '$780,000',
            propensity: 8,
            moderatePain: 'Moderate Pain',
            taxDelinquency: 'Tax Delinquency',
            highDebt: 'High Debt (LTV >80%)',
            marketInfo: '41 Days / Active',
            dom: 41,
            cdom: 41,
            askingVsArv: '70.35%',
            arv: '$1,108,806',
            compData: 'A0, P1, B0, C1',
            piq: 'About property notes will appear here.',
            comps: '',
            ia: 'IA tab content placeholder.',
            recordCreated: '- ',
            listingDate: '- ',
            idx: '-',
            propertyType: '-',
            mlsNumber: '-',
            statusLabel: 'Active',
            autoTracker: '-',
            areaLabel: '-',
            city: '',
            county: '',
            propertyCover: '-',
            publicComments: 'No public comments available.',
            agentComments: 'No agent comments available.',
            apn: '-',
            unitNumber: '-',
            totalFloors: '-',
            sewer: '-',
            propertyCondition: '-',
            zoning: '-',
            associationDues: '-',
            commonWalls: '-',
            lockboxType: '-',
            occupied: '-',
            showing: '-',
            agentRecord: {
                name: 'Brandon Wasilewski',
                title: 'Agent Record',
                phone: '(805) 856-8773',
                email: 'lewskisells@gmail.com',
                brokerage: 'Realty ONE Group Summit',
                lastCommunicationDate: '-',
                lastAddressDiscussed: '-',
                lastCommunicatedAA: '-',
                activeInLast2Years: 'TRUE',
                averageDealsPerYear: '3',
                doubleEnded: '0',
                investorSource: '0'
            },
            offer: 'Offer tab content placeholder.'
        };

        detailData = detailData && typeof detailData === 'object' && !Array.isArray(detailData)
            ? {
                ...defaultDetailData,
                ...detailData,
                propertyImages: Array.isArray(detailData.propertyImages) && detailData.propertyImages.length > 0
                    ? detailData.propertyImages
                    : defaultDetailData.propertyImages,
                agentRecord: {
                    ...defaultDetailData.agentRecord,
                    ...(detailData.agentRecord && typeof detailData.agentRecord === 'object' ? detailData.agentRecord : {})
                }
            }
            : defaultDetailData;

        const compsText = String(detailData.comps || '').trim();
        if (
            compsText === legacyCompsLine ||
            compsText === 'Comps tab content placeholder.'
        ) {
            detailData.comps = '';
            localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
        }

        const agentRecord = detailData.agentRecord || {
            name: 'Brandon Wasilewski',
            title: 'Agent Record',
            phone: '(805) 856-8773',
            email: 'lewskisells@gmail.com',
            brokerage: 'Realty ONE Group Summit',
            lastCommunicationDate: '-',
            lastAddressDiscussed: '-',
            lastCommunicatedAA: '-',
            activeInLast2Years: 'TRUE',
            averageDealsPerYear: '3',
            doubleEnded: '0',
            investorSource: '0'
        };

        const workspaceUser = getWorkspaceUserContext();
        const activeUser = getStoredCurrentUserIdentity();
        const propertyAddress = String(detailData.address || '').trim();
        const propertyKey = makePropertyStorageKey(propertyAddress);
        const persistedAssignment = getPropertyAssignmentRecord(propertyKey);

        if (persistedAssignment) {
            detailData.propertyAssignment = {
                assignedTo: persistedAssignment.assignedTo,
                assignedBy: persistedAssignment.assignedBy,
                assignedAt: persistedAssignment.assignedAt
            };
        }

        function syncStatusAcrossPropertyNotes(statusValue) {
            if (!propertyKey) {
                return;
            }

            const normalizedStatus = String(statusValue || 'none').trim().toLowerCase() || 'none';
            const notes = getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            let changed = false;

            const nextNotes = notes.map(note => {
                const noteAddress = String(note.propertyAddress || '').trim().toLowerCase();
                if (noteAddress !== propertyKey) {
                    return note;
                }

                changed = true;
                const nextSnapshot = note.propertySnapshot && typeof note.propertySnapshot === 'object'
                    ? { ...note.propertySnapshot }
                    : {};
                nextSnapshot.piqAgentStatus = normalizedStatus;
                const snapshotAgentRecord = nextSnapshot.agentRecord && typeof nextSnapshot.agentRecord === 'object'
                    ? { ...nextSnapshot.agentRecord }
                    : {};
                snapshotAgentRecord.agentStatus = formatAgentStatusLabel(normalizedStatus);
                nextSnapshot.agentRecord = snapshotAgentRecord;

                return {
                    ...note,
                    piqAgentStatus: normalizedStatus,
                    propertySnapshot: nextSnapshot
                };
            });

            if (changed) {
                setUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key, nextNotes);
            }
        }

        function getPersistedPiqStatus() {
            if (!propertyKey) {
                return '';
            }
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            return String(scopedStatuses[propertyKey] || '').trim().toLowerCase();
        }

        function getLocalAssignableUsers() {
            const seen = new Set();
            const users = [];
            const coreAssignableUsers = [
                {
                    name: 'Isaac Haro',
                    email: 'isaac.haro@fastbridgegroupllc.com',
                    role: 'admin'
                },
                {
                    name: 'Steve Medina',
                    email: 'steve.medina@fastbridgegroupllc.com',
                    role: 'admin'
                }
            ];

            function pushUser(userLike) {
                const user = buildUserIdentity(userLike);
                if (!user.key || seen.has(user.key)) {
                    return;
                }
                seen.add(user.key);
                users.push(user);
            }

            pushUser(activeUser);
            coreAssignableUsers.forEach(pushUser);

            try {
                const profileStore = JSON.parse(localStorage.getItem('userProfilesByUser') || '{}');
                Object.values(profileStore || {}).forEach(profile => pushUser(profile));
            } catch (error) {
                // Ignore local profile parsing errors.
            }

            const assignmentStore = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
            Object.values(assignmentStore).forEach(record => {
                if (!record || typeof record !== 'object') {
                    return;
                }
                pushUser(record.assignedTo || {});
                pushUser(record.assignedBy || {});
            });

            return users.sort((left, right) => left.name.localeCompare(right.name));
        }

        function formatAssignableUserLabel(user) {
            const safeUser = user && typeof user === 'object' ? user : {};
            const role = String(safeUser.role || 'user').trim().toLowerCase();
            const roleLabel = role === 'admin' ? 'Admin' : 'User';
            const displayEmail = String(safeUser.email || safeUser.key || '').trim();
            const displayName = String(safeUser.name || displayEmail || roleLabel).trim();

            if (displayEmail) {
                return `${displayName} (${displayEmail}) - ${roleLabel}`;
            }

            return `${displayName} - ${roleLabel}`;
        }

        async function loadAssignableUsers() {
            const mergedUsers = [];

            function pushUser(userLike) {
                const user = buildUserIdentity(userLike);
                if (!user.key) {
                    return;
                }

                const existingIndex = mergedUsers.findIndex(existingUser => usersMatch(existingUser, user));
                if (existingIndex >= 0) {
                    mergedUsers[existingIndex] = mergeUserIdentityRecords(mergedUsers[existingIndex], user);
                    return;
                }

                mergedUsers.push(user);
            }

            getLocalAssignableUsers().forEach(pushUser);

            const token = localStorage.getItem('authToken') || '';
            if (token) {
                try {
                    const response = await fetch('/api/users', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const payload = await response.json();
                        const rows = Array.isArray(payload?.users) ? payload.users : [];
                        rows.forEach(pushUser);
                    }
                } catch (error) {
                    // Ignore and keep the local fallback set.
                }
            }

            return mergedUsers.sort((left, right) => {
                const leftName = `${left.name} ${left.email}`.trim().toLowerCase();
                const rightName = `${right.name} ${right.email}`.trim().toLowerCase();
                return leftName.localeCompare(rightName);
            });
        }

        function buildAssignmentRecord(assignee) {
            const normalizedAssignee = buildUserIdentity(assignee);
            const normalizedAssigner = buildUserIdentity(activeUser);
            const assignmentMeta = {
                assignedTo: normalizedAssignee,
                assignedBy: normalizedAssigner,
                assignedAt: new Date().toISOString()
            };
            const snapshotBase = { ...detailData };
            delete snapshotBase.propertyAssignment;
            const propertySnapshot = {
                ...snapshotBase,
                propertyAssignment: assignmentMeta
            };

            return {
                propertyKey,
                propertyAddress: propertyAddress || detailData.address || 'Property',
                assignedTo: normalizedAssignee,
                assignedBy: normalizedAssigner,
                assignedAt: assignmentMeta.assignedAt,
                propertySnapshot
            };
        }

        function syncCurrentAssignmentSnapshot() {
            const currentAssignment = getPropertyAssignmentRecord(propertyKey);
            if (!currentAssignment) {
                return;
            }

            const syncedAssignment = {
                ...currentAssignment,
                propertySnapshot: {
                    ...(function() {
                        const snapshotBase = { ...detailData };
                        delete snapshotBase.propertyAssignment;
                        return snapshotBase;
                    })(),
                    propertyAssignment: {
                        assignedTo: currentAssignment.assignedTo,
                        assignedBy: currentAssignment.assignedBy,
                        assignedAt: currentAssignment.assignedAt
                    }
                }
            };
            setPropertyAssignmentRecord(propertyKey, syncedAssignment).catch(() => {
                // Keep the local assignment intact if the snapshot sync fails.
            });
        }

        function setPersistedPiqStatus(statusValue) {
            if (!propertyKey) {
                return;
            }
            const normalizedStatus = String(statusValue || 'none').trim().toLowerCase() || 'none';
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            scopedStatuses[propertyKey] = normalizedStatus;
            setUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key, scopedStatuses);
        }

        function getPropertyOfferDocuments() {
            return getUserScopedItems(OFFER_DOCUMENTS_KEY, workspaceUser.key)
                .filter(item => String(item.propertyAddress || '').trim().toLowerCase() === propertyKey)
                .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        }

        function setPropertyOfferDocuments(nextDocuments) {
            const otherDocuments = getUserScopedItems(OFFER_DOCUMENTS_KEY, workspaceUser.key)
                .filter(item => String(item.propertyAddress || '').trim().toLowerCase() !== propertyKey);
            setUserScopedItems(OFFER_DOCUMENTS_KEY, workspaceUser.key, [...otherDocuments, ...nextDocuments]);
            window.dispatchEvent(new CustomEvent('offer-documents-updated', {
                detail: {
                    propertyKey,
                    count: nextDocuments.length
                }
            }));
        }

        const compactPropertyDetails = String(detailData.propertyDetails || '').replace(/\s*\/\s*/g, '\n');
        const currentStatusValue = String(getPersistedPiqStatus() || detailData.piqAgentStatus || 'none');
        detailData.piqAgentStatus = currentStatusValue;
        detailData.agentRecord = {
            ...(detailData.agentRecord || {}),
            agentStatus: formatAgentStatusLabel(currentStatusValue)
        };
        const currentStatusLabel = formatAgentStatusLabel(currentStatusValue);

        const idMap = {
            'property-address-title': detailData.address,
            'property-details-line': detailData.propertyDetails,
            'property-list-price': detailData.listPrice,
            'property-propensity': String(detailData.propensity),
            'property-moderate-pain': detailData.moderatePain,
            'property-tax-delinquency': detailData.taxDelinquency,
            'property-high-debt': detailData.highDebt,
            'property-market-info': detailData.marketInfo,
            'property-dom-cdom': `DOM: ${detailData.dom} / CDOM: ${detailData.cdom}`,
            'property-record-created': detailData.recordCreated,
            'property-listing-date': detailData.listingDate,
            'property-idx': detailData.idx,
            'property-type': detailData.propertyType,
            'property-mls-number': detailData.mlsNumber,
            'property-status-label': detailData.statusLabel,
            'property-auto-tracker': detailData.autoTracker,
            'property-area': detailData.areaLabel,
            'property-cover': detailData.propertyCover,
            'property-public-comments': detailData.publicComments,
            'property-agent-comments': detailData.agentComments,
            'property-apn': detailData.apn,
            'property-unit-number': detailData.unitNumber,
            'property-total-floors': detailData.totalFloors,
            'property-sewer': detailData.sewer,
            'property-condition': detailData.propertyCondition,
            'property-zoning': detailData.zoning,
            'property-association-dues': detailData.associationDues,
            'property-common-walls': detailData.commonWalls,
            'property-lockbox-type': detailData.lockboxType,
            'property-occupied': detailData.occupied,
            'property-showing': detailData.showing,
            'property-asking-vs-arv': detailData.askingVsArv,
            'property-arv': detailData.arv,
            'property-comp-data': detailData.compData,
            'comps-summary-property-details': compactPropertyDetails,
            'comps-summary-list-price': detailData.listPrice,
            'comps-summary-propensity': String(detailData.propensity),
            'comps-summary-moderate-pain': detailData.moderatePain,
            'comps-summary-tax-delinquency': detailData.taxDelinquency,
            'comps-summary-high-debt': detailData.highDebt,
            'comps-summary-market-info': detailData.marketInfo,
            'comps-summary-dom-cdom': `DOM: ${detailData.dom} / CDOM: ${detailData.cdom}`,
            'comps-summary-asking-vs-arv': detailData.askingVsArv,
            'comps-summary-arv': detailData.arv,
            'comps-summary-comp-data': detailData.compData,
            'tab-content-piq': detailData.piq,
            'tab-content-comps': detailData.comps,
            'tab-content-ia': detailData.ia,
            'agent-name': agentRecord.name,
            'agent-record-title': agentRecord.title,
            'agent-phone': agentRecord.phone,
            'agent-email': agentRecord.email,
            'agent-brokerage': agentRecord.brokerage,
            'agent-current-status': currentStatusLabel,
            'agent-last-communication-date': agentRecord.lastCommunicationDate,
            'agent-last-address-discussed': agentRecord.lastAddressDiscussed,
            'agent-last-communicated-aa': agentRecord.lastCommunicatedAA,
            'agent-active-last-2-years': agentRecord.activeInLast2Years,
            'agent-average-deals-per-year': agentRecord.averageDealsPerYear,
            'agent-double-ended': agentRecord.doubleEnded,
            'agent-investor-source': agentRecord.investorSource,
            'tab-content-offer': detailData.offer
        };

        Object.keys(idMap).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = idMap[id];
            }
        });

        const tabButtons = Array.from(document.querySelectorAll('.property-tab-btn[data-tab]'));
        const tabPanels = Array.from(document.querySelectorAll('.property-tab-panel[data-panel]'));

        function activatePropertyTab(tabId) {
            const normalizedTabId = String(tabId || 'piq').trim().toLowerCase() || 'piq';

            tabButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.tab === normalizedTabId);
            });

            tabPanels.forEach(panel => {
                panel.classList.toggle('active', panel.dataset.panel === normalizedTabId);
            });
        }

        tabButtons.forEach(button => {
            if (button.dataset.propertyTabBound === 'true') {
                return;
            }

            button.dataset.propertyTabBound = 'true';
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                activatePropertyTab(tabId);
            });
        });

        const initialActiveTab = tabButtons.find(button => button.classList.contains('active'))?.dataset.tab
            || tabPanels.find(panel => panel.classList.contains('active'))?.dataset.panel
            || 'piq';
        activatePropertyTab(initialActiveTab);

        const previewGallery = document.getElementById('piq-property-image-preview');
        const imageGallery = document.getElementById('piq-property-image-gallery');
        const imageTabButtons = Array.from(document.querySelectorAll('.piq-image-tab[data-piq-image-tab]'));
        const imagePanels = Array.from(document.querySelectorAll('.piq-image-panel[data-piq-image-panel]'));
        const images = Array.from(new Set(
            (Array.isArray(detailData.propertyImages) ? detailData.propertyImages : [])
                .map(url => String(url || '').trim())
                .filter(url => url.length > 0)
        ));

        if (previewGallery) {
            previewGallery.innerHTML = '';
            if (images.length === 0) {
                previewGallery.innerHTML = '<p class="outreach-empty">No property images available.</p>';
            } else {
                images.slice(0, 4).forEach((url, index) => {
                    const image = document.createElement('img');
                    image.className = 'piq-image-thumb-large';
                    image.loading = 'lazy';
                    image.src = url;
                    image.alt = `Property preview image ${index + 1}`;
                    previewGallery.appendChild(image);
                });
            }
        }

        if (imageGallery) {
            imageGallery.innerHTML = '';
            if (images.length === 0) {
                imageGallery.innerHTML = '<p class="outreach-empty">No property images available.</p>';
            } else {
                images.forEach((url, index) => {
                    const image = document.createElement('img');
                    image.className = 'piq-image-thumb-strip';
                    image.loading = 'lazy';
                    image.src = url;
                    image.alt = `Property image ${index + 1}`;
                    imageGallery.appendChild(image);
                });
            }
        }

        if (imageTabButtons.length > 0 && imagePanels.length > 0) {
            imageTabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const selectedTab = button.dataset.piqImageTab;
                    imageTabButtons.forEach(tabButton => {
                        tabButton.classList.toggle('active', tabButton === button);
                    });
                    imagePanels.forEach(panel => {
                        panel.classList.toggle('active', panel.dataset.piqImagePanel === selectedTab);
                    });
                });
            });
        }

        const piqAgentStatusSelect = document.getElementById('piq-agent-status');
        const propertyAssigneeSelect = document.getElementById('property-assignee-select');
        const agentCurrentStatusEl = document.getElementById('agent-current-status');
        const offerNegotiatorEl = document.getElementById('offer-negotiator-name');

        function getOfferNegotiatorName(assignmentLike) {
            const assignment = assignmentLike && typeof assignmentLike === 'object' ? assignmentLike : {};
            const assignedTo = assignment.assignedTo && typeof assignment.assignedTo === 'object'
                ? assignment.assignedTo
                : detailData.propertyAssignment && typeof detailData.propertyAssignment === 'object'
                    ? (detailData.propertyAssignment.assignedTo || {})
                    : {};
            const assignedName = String(assignedTo.name || '').trim();
            return assignedName || 'N/A';
        }

        function renderOfferNegotiator(assignmentLike) {
            if (!offerNegotiatorEl) {
                return;
            }
            offerNegotiatorEl.textContent = getOfferNegotiatorName(assignmentLike);
        }

        renderOfferNegotiator(persistedAssignment);

        if (piqAgentStatusSelect) {
            const defaultStatus = 'none';
            const persistedStatus = getPersistedPiqStatus();
            const savedStatus = String(persistedStatus || detailData.piqAgentStatus || defaultStatus);
            const hasSavedOption = Array.from(piqAgentStatusSelect.options).some(option => option.value === savedStatus);
            piqAgentStatusSelect.value = hasSavedOption ? savedStatus : defaultStatus;

            detailData.piqAgentStatus = piqAgentStatusSelect.value || defaultStatus;
            detailData.agentRecord = {
                ...(detailData.agentRecord || {}),
                agentStatus: formatAgentStatusLabel(detailData.piqAgentStatus)
            };
            setPersistedPiqStatus(detailData.piqAgentStatus);
            syncStatusAcrossPropertyNotes(detailData.piqAgentStatus);
            localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));

            if (agentCurrentStatusEl) {
                agentCurrentStatusEl.textContent = formatAgentStatusLabel(piqAgentStatusSelect.value || defaultStatus);
            }

            piqAgentStatusSelect.addEventListener('change', () => {
                detailData.piqAgentStatus = piqAgentStatusSelect.value || defaultStatus;
                detailData.agentRecord = {
                    ...(detailData.agentRecord || {}),
                    agentStatus: formatAgentStatusLabel(detailData.piqAgentStatus)
                };
                if (agentCurrentStatusEl) {
                    agentCurrentStatusEl.textContent = formatAgentStatusLabel(detailData.piqAgentStatus);
                }
                setPersistedPiqStatus(detailData.piqAgentStatus);
                syncStatusAcrossPropertyNotes(detailData.piqAgentStatus);
                localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
                syncCurrentAssignmentSnapshot();
            });
        }

        if (propertyAssigneeSelect) {
            const currentAssignedKey = String(persistedAssignment?.assignedTo?.key || '').trim();

            function renderAssigneeOptions(users) {
                const previousValue = String(propertyAssigneeSelect.value || currentAssignedKey || '').trim();
                propertyAssigneeSelect.innerHTML = '<option value="">Unassigned</option>';

                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.key;
                    option.textContent = formatAssignableUserLabel(user);
                    propertyAssigneeSelect.appendChild(option);
                });

                const validValue = users.some(user => user.key === previousValue) ? previousValue : '';
                propertyAssigneeSelect.value = validValue;
            }

            loadAssignableUsers().then(users => {
                renderAssigneeOptions(users);

                propertyAssigneeSelect.addEventListener('change', async () => {
                    const selectedUser = users.find(user => user.key === propertyAssigneeSelect.value) || null;
                    const previousAssignment = getPropertyAssignmentRecord(propertyKey);
                    const previousAssignedKey = String(previousAssignment?.assignedTo?.key || '').trim();

                    propertyAssigneeSelect.disabled = true;

                    try {
                        if (!selectedUser) {
                            delete detailData.propertyAssignment;
                            localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
                            await setPropertyAssignmentRecord(propertyKey, null);
                            renderOfferNegotiator(null);
                            showDashboardToast('success', 'Property Unassigned', 'This property is no longer assigned to a user.');
                            return;
                        }

                        const assignmentRecord = buildAssignmentRecord(selectedUser);
                        detailData.propertyAssignment = {
                            assignedTo: assignmentRecord.assignedTo,
                            assignedBy: assignmentRecord.assignedBy,
                            assignedAt: assignmentRecord.assignedAt
                        };
                        localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
                        const persistedRecord = await setPropertyAssignmentRecord(propertyKey, assignmentRecord);
                        renderOfferNegotiator(persistedRecord);
                        showDashboardToast('success', 'Property Assigned', `${assignmentRecord.propertyAddress} was assigned to ${selectedUser.name}.`);
                    } catch (error) {
                        if (previousAssignment) {
                            detailData.propertyAssignment = {
                                assignedTo: previousAssignment.assignedTo,
                                assignedBy: previousAssignment.assignedBy,
                                assignedAt: previousAssignment.assignedAt
                            };
                        } else {
                            delete detailData.propertyAssignment;
                        }

                        localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
                        propertyAssigneeSelect.value = previousAssignedKey;
                        renderOfferNegotiator(previousAssignment);
                        showDashboardToast('error', 'Assignment Failed', String(error && error.message || 'Unable to save the property assignment.'));
                    } finally {
                        propertyAssigneeSelect.disabled = false;
                    }
                });
            });
        }

        const compsMapFrame = document.getElementById('comps-map-frame');
        const compsMapOpenLink = document.getElementById('comps-map-open-link');
        function initCompsExplorer() {
            const nearbyList = document.getElementById('comps-nearby-list');
            const summaryRow = document.getElementById('comps-applied-summary');
            const resultsMeta = document.getElementById('comps-results-meta');
            const applyBtn = document.getElementById('comps-apply-filters');
            const resetBtn = document.getElementById('comps-reset-filters');

            if (!nearbyList || !summaryRow || !resultsMeta || !applyBtn || !resetBtn) {
                if (compsMapFrame || compsMapOpenLink) {
                    const locationQuery = `real estate comps near ${detailData.address || 'California'}`;
                    const encodedQuery = encodeURIComponent(locationQuery);
                    const mapsEmbedUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;
                    const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

                    if (compsMapFrame) compsMapFrame.src = mapsEmbedUrl;
                    if (compsMapOpenLink) compsMapOpenLink.href = mapsSearchUrl;
                }
                return;
            }

            const defaults = {
                sqftMin: 1420,
                sqftMax: 2070,
                builtMin: 1974,
                builtMax: 1989,
                radius: 1,
                closedWithin: 180,
                zipcode: '93060',
                city: 'Santa Paula'
            };

            const compsPool = [
                { address: '935 Prospect St, Santa Paula, CA 93060', sqft: 1825, built: 1978, distance: 0.3, price: 640000, beds: 3, baths: 2, lot: 6100, garage: 2, dom: 19, closedDays: 42, slcType: 'STD', propertyType: 'Single Family', status: 'Closed', condition: 'Standard', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '1112 Glenwood Ave, Santa Paula, CA 93060', sqft: 1690, built: 1981, distance: 0.4, price: 615000, beds: 3, baths: 2, lot: 5900, garage: 2, dom: 22, closedDays: 78, slcType: 'STD', propertyType: 'Single Family', status: 'Closed', condition: 'Standard', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '1246 Olive Rd, Santa Paula, CA 93060', sqft: 1960, built: 1985, distance: 0.6, price: 679000, beds: 4, baths: 2.5, lot: 7200, garage: 2, dom: 27, closedDays: 95, slcType: 'STD', propertyType: 'Single Family', status: 'Closed', condition: 'Standard', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '802 Oakleaf Dr, Santa Paula, CA 93060', sqft: 1550, built: 1976, distance: 0.7, price: 589000, beds: 3, baths: 2, lot: 5400, garage: 2, dom: 17, closedDays: 54, slcType: 'STD', propertyType: 'Condo', status: 'Closed', condition: 'Standard', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '1419 River Park Ct, Santa Paula, CA 93060', sqft: 2035, built: 1988, distance: 0.8, price: 705000, beds: 4, baths: 3, lot: 7600, garage: 2, dom: 31, closedDays: 120, slcType: 'STD', propertyType: 'Townhouse', status: 'Closed', condition: 'Standard', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '718 Magnolia St, Santa Paula, CA 93060', sqft: 1460, built: 1975, distance: 0.95, price: 572000, beds: 3, baths: 2, lot: 5000, garage: 1, dom: 14, closedDays: 88, slcType: 'STD', propertyType: 'Single Family', status: 'Closed', condition: 'As-Is', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '983 Meadow Ln, Santa Paula, CA 93060', sqft: 2140, built: 1991, distance: 1.2, price: 739000, beds: 4, baths: 3, lot: 8200, garage: 3, dom: 40, closedDays: 175, slcType: 'REO', propertyType: 'Single Family', status: 'Closed', condition: 'Fixer', zip: '93060', area: '-', city: 'Santa Paula' },
                { address: '670 Citrus View Dr, Santa Paula, CA 93060', sqft: 1745, built: 1980, distance: 0.85, price: 624000, beds: 3, baths: 2, lot: 5800, garage: 2, dom: 20, closedDays: 28, slcType: 'STD', propertyType: 'Multi Family', status: 'Closed', condition: 'Standard', zip: '93060', area: '-', city: 'Santa Paula' }
            ];

            function inputValue(id) {
                const el = document.getElementById(id);
                return el ? String(el.value || '').trim() : '';
            }

            function inputNumber(id) {
                const value = Number(inputValue(id));
                return Number.isFinite(value) ? value : null;
            }

            function checkedValues(selector) {
                return Array.from(document.querySelectorAll(selector))
                    .filter(el => el.checked)
                    .map(el => el.value);
            }

            function setDefaults() {
                const defaultMap = {
                    'comps-sqft-min': defaults.sqftMin,
                    'comps-sqft-max': defaults.sqftMax,
                    'comps-built-min': defaults.builtMin,
                    'comps-built-max': defaults.builtMax,
                    'comps-radius': defaults.radius,
                    'comps-closed-within': defaults.closedWithin,
                    'comps-zipcode': defaults.zipcode,
                    'comps-city': defaults.city,
                    'comps-area': ''
                };

                Object.keys(defaultMap).forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = defaultMap[id];
                });

                document.querySelectorAll('.comps-slc').forEach(el => {
                    el.checked = el.value === 'STD';
                });
                document.querySelectorAll('.comps-status').forEach(el => {
                    el.checked = el.value === 'Closed';
                });
                document.querySelectorAll('.comps-condition').forEach(el => {
                    el.checked = el.value === 'Standard';
                });
                document.querySelectorAll('.comps-type').forEach(el => {
                    el.checked = true;
                });
            }

            function matchesMinMax(value, min, max) {
                if (min !== null && value < min) return false;
                if (max !== null && value > max) return false;
                return true;
            }

            function formatCurrency(value) {
                const safeValue = Number(value) || 0;
                return `$${safeValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
            }

            function average(values) {
                if (!Array.isArray(values) || values.length === 0) {
                    return 0;
                }
                return values.reduce((sum, value) => sum + (Number(value) || 0), 0) / values.length;
            }

            function median(values) {
                if (!Array.isArray(values) || values.length === 0) {
                    return 0;
                }

                const sorted = values
                    .map(value => Number(value) || 0)
                    .sort((left, right) => left - right);
                const middleIndex = Math.floor(sorted.length / 2);

                if (sorted.length % 2 === 0) {
                    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
                }

                return sorted[middleIndex];
            }

            function renderResults() {
                const filters = {
                    sqftMin: inputNumber('comps-sqft-min'),
                    sqftMax: inputNumber('comps-sqft-max'),
                    builtMin: inputNumber('comps-built-min'),
                    builtMax: inputNumber('comps-built-max'),
                    radius: inputNumber('comps-radius') || 1,
                    closedWithin: inputNumber('comps-closed-within') || 180,
                    bedMin: inputNumber('comps-bed-min'),
                    bedMax: inputNumber('comps-bed-max'),
                    bathMin: inputNumber('comps-bath-min'),
                    bathMax: inputNumber('comps-bath-max'),
                    priceMin: inputNumber('comps-price-min'),
                    priceMax: inputNumber('comps-price-max'),
                    lotMin: inputNumber('comps-lot-min'),
                    lotMax: inputNumber('comps-lot-max'),
                    garageMin: inputNumber('comps-garage-min'),
                    garageMax: inputNumber('comps-garage-max'),
                    domMin: inputNumber('comps-dom-min'),
                    domMax: inputNumber('comps-dom-max'),
                    zipcode: inputValue('comps-zipcode').toLowerCase(),
                    area: inputValue('comps-area').toLowerCase(),
                    city: inputValue('comps-city').toLowerCase(),
                    slcTypes: checkedValues('.comps-slc'),
                    propertyTypes: checkedValues('.comps-type'),
                    statuses: checkedValues('.comps-status'),
                    conditions: checkedValues('.comps-condition')
                };

                const filteredPool = compsPool
                    .filter(comp => matchesMinMax(comp.sqft, filters.sqftMin, filters.sqftMax))
                    .filter(comp => matchesMinMax(comp.built, filters.builtMin, filters.builtMax))
                    .filter(comp => comp.distance <= filters.radius)
                    .filter(comp => comp.closedDays <= filters.closedWithin)
                    .filter(comp => matchesMinMax(comp.beds, filters.bedMin, filters.bedMax))
                    .filter(comp => matchesMinMax(comp.baths, filters.bathMin, filters.bathMax))
                    .filter(comp => matchesMinMax(comp.price, filters.priceMin, filters.priceMax))
                    .filter(comp => matchesMinMax(comp.lot, filters.lotMin, filters.lotMax))
                    .filter(comp => matchesMinMax(comp.garage, filters.garageMin, filters.garageMax))
                    .filter(comp => matchesMinMax(comp.dom, filters.domMin, filters.domMax))
                    .filter(comp => !filters.zipcode || comp.zip.toLowerCase().includes(filters.zipcode))
                    .filter(comp => !filters.area || String(comp.area || '').toLowerCase().includes(filters.area))
                    .filter(comp => !filters.city || comp.city.toLowerCase().includes(filters.city))
                    .filter(comp => filters.slcTypes.length === 0 || filters.slcTypes.includes(comp.slcType))
                    .filter(comp => filters.propertyTypes.length === 0 || filters.propertyTypes.includes(comp.propertyType))
                    .filter(comp => filters.statuses.length === 0 || filters.statuses.includes(comp.status))
                    .filter(comp => filters.conditions.length === 0 || filters.conditions.includes(comp.condition))
                    .sort((a, b) => a.distance - b.distance);
                const filtered = filteredPool.slice(0, 5);

                nearbyList.innerHTML = '';
                if (filtered.length === 0) {
                    nearbyList.innerHTML = '<p class="outreach-empty">No nearby comps match your filters.</p>';
                } else {
                    filtered.forEach(comp => {
                        const compPpsf = Math.round(comp.price / Math.max(comp.sqft, 1));
                        const item = document.createElement('article');
                        item.className = 'comp-near-card';
                        item.innerHTML = `
                            <h5>${comp.address}</h5>
                            <p class="comp-near-meta">${comp.propertyType} · ${comp.condition} · ${comp.slcType}</p>
                            <p>${comp.beds} Bd / ${comp.baths} Ba / ${comp.sqft.toLocaleString()} sqft / Lot ${comp.lot.toLocaleString()} / Garage ${comp.garage}</p>
                            <p>${formatCurrency(comp.price)} · ${formatCurrency(compPpsf)}/sqft · ${comp.distance.toFixed(2)} mi</p>
                            <p>DOM ${comp.dom} · Closed ${comp.closedDays} days ago · ${comp.status}</p>
                        `;
                        nearbyList.appendChild(item);
                    });
                }

                summaryRow.innerHTML = [
                    `<span class="comps-chip">${filters.sqftMin || 0}-${filters.sqftMax || 99999} sqft</span>`,
                    `<span class="comps-chip">Built ${filters.builtMin || 0}-${filters.builtMax || 9999}</span>`,
                    `<span class="comps-chip">${filters.radius} mile radius</span>`,
                    `<span class="comps-chip">Closed: Last ${filters.closedWithin} days</span>`,
                    `<span class="comps-chip">Type: ${filters.propertyTypes.length} selected</span>`,
                    `<span class="comps-chip">${filteredPool.length} comp(s) matched</span>`,
                    filteredPool.length > 0 ? `<span class="comps-chip">Avg DOM ${average(filteredPool.map(comp => comp.dom)).toFixed(1)}</span>` : '',
                    filteredPool.length > 0 ? `<span class="comps-chip">Median ${formatCurrency(Math.round(median(filteredPool.map(comp => comp.price))))}</span>` : ''
                ].join('');

                const advancedCount = [filters.bedMin, filters.bedMax, filters.bathMin, filters.bathMax, filters.priceMin, filters.priceMax, filters.lotMin, filters.lotMax, filters.garageMin, filters.garageMax, filters.domMin, filters.domMax, filters.area].filter(v => v !== null && v !== '').length;
                if (filteredPool.length > 0) {
                    const averagePpsf = average(filteredPool.map(comp => comp.price / Math.max(comp.sqft, 1)));
                    const medianPrice = median(filteredPool.map(comp => comp.price));
                    resultsMeta.textContent = `${filteredPool.length} comps · Avg ${formatCurrency(Math.round(averagePpsf))}/sqft · Median ${formatCurrency(Math.round(medianPrice))} · More Filters: ${advancedCount}`;
                } else {
                    resultsMeta.textContent = `Type: ${filters.propertyTypes.length} selected · Closed: Last ${filters.closedWithin} days · More Filters: ${advancedCount}`;
                }

                if (compsMapFrame || compsMapOpenLink) {
                    const mapQueryCore = filtered.length > 0
                        ? filtered.map(comp => comp.address).join(' OR ')
                        : `real estate comps near ${detailData.address || 'California'}`;
                    const mapQuery = `${mapQueryCore} near ${detailData.address || 'Santa Paula, CA'}`;
                    const encodedQuery = encodeURIComponent(mapQuery);
                    const mapsEmbedUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;
                    const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

                    if (compsMapFrame) compsMapFrame.src = mapsEmbedUrl;
                    if (compsMapOpenLink) compsMapOpenLink.href = mapsSearchUrl;
                }
            }

            applyBtn.addEventListener('click', renderResults);
            resetBtn.addEventListener('click', () => {
                setDefaults();
                renderResults();
            });

            setDefaults();
            renderResults();
        }

        initCompsExplorer();

        function initAgentNotesForProperty() {
            const noteInput = document.getElementById('agent-note-input');
            const saveButton = document.getElementById('save-agent-note-btn');
            const noteList = document.getElementById('agent-note-list');
            const statusSelect = document.getElementById('piq-agent-status');
            if (!noteInput || !saveButton || !noteList) {
                return;
            }

            const workspaceUser = getWorkspaceUserContext();
            const propertyAddress = String(detailData.address || '').trim();
            const agentName = String(agentRecord.name || '').trim();
            const propertyKey = propertyAddress.toLowerCase();
            const agentKey = agentName.toLowerCase();

            function getNotes() {
                return getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            }

            function setNotes(items) {
                setUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key, items);
            }

            function renderNotes() {
                const canonicalStatus = String(getPersistedPiqStatus() || detailData.piqAgentStatus || 'none');
                const notes = getNotes()
                    .filter(note => {
                        const noteAddress = String(note.propertyAddress || '').trim().toLowerCase();
                        const noteAgent = String(note.agentName || '').trim().toLowerCase();
                        return noteAddress === propertyKey && noteAgent === agentKey;
                    })
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                noteList.innerHTML = '';
                if (notes.length === 0) {
                    noteList.innerHTML = '<p class="outreach-empty">No notes for this agent/property yet.</p>';
                    return;
                }

                notes.slice(0, 10).forEach(note => {
                    const card = document.createElement('article');
                    card.className = 'agent-note-item';

                    const head = document.createElement('div');
                    head.className = 'agent-note-item-head';

                    const heading = document.createElement('strong');
                    heading.textContent = agentName || 'Agent Note';

                    const time = document.createElement('span');
                    time.className = 'agent-note-item-time';
                    time.textContent = new Date(Number(note.createdAt) || Date.now()).toLocaleString();

                    const status = document.createElement('span');
                    status.className = 'agent-note-status';
                    status.textContent = formatAgentStatusLabel(canonicalStatus);

                    const body = document.createElement('p');
                    body.textContent = String(note.note || '').trim();

                    head.appendChild(heading);
                    head.appendChild(time);
                    card.appendChild(head);
                    card.appendChild(status);
                    card.appendChild(body);
                    noteList.appendChild(card);
                });
            }

            saveButton.addEventListener('click', () => {
                const noteText = noteInput.value.trim();
                if (!noteText) {
                    showDashboardToast('error', 'Note Required', 'Write a note before saving.');
                    return;
                }

                const currentStatus = String(
                    (statusSelect && statusSelect.value) ||
                    detailData.piqAgentStatus ||
                    'none'
                );
                detailData.piqAgentStatus = currentStatus;
                detailData.agentRecord = {
                    ...(detailData.agentRecord || {}),
                    agentStatus: formatAgentStatusLabel(currentStatus)
                };
                setPersistedPiqStatus(currentStatus);
                syncStatusAcrossPropertyNotes(currentStatus);
                localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));

                const currentStatusLabel = formatAgentStatusLabel(currentStatus);
                if (statusSelect && statusSelect.value !== currentStatus) {
                    statusSelect.value = currentStatus;
                }
                const agentCurrentStatusEl = document.getElementById('agent-current-status');
                if (agentCurrentStatusEl) {
                    agentCurrentStatusEl.textContent = currentStatusLabel;
                }

                const notes = getNotes();
                notes.push({
                    id: `agn-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                    note: noteText,
                    propertyAddress,
                    agentName,
                    agentPhone: agentRecord.phone || '',
                    agentEmail: agentRecord.email || '',
                    agentBrokerage: agentRecord.brokerage || '',
                    piqAgentStatus: currentStatus,
                    createdAt: Date.now(),
                    propertySnapshot: {
                        ...detailData,
                        piqAgentStatus: currentStatus,
                        agentRecord: { ...(detailData.agentRecord || {}) }
                    }
                });

                setNotes(notes);
                noteInput.value = '';
                renderNotes();
                showDashboardToast('success', 'Agent Note Saved', 'Saved and available in the dashboard Agent Notes widget.');
            });

            renderNotes();
        }

        initAgentNotesForProperty();

        function initOfferNumberInputFormatting() {
            const offerNumericInputs = [
                document.getElementById('offer-purchase-price'),
                document.getElementById('offer-close-escrow-days'),
                document.getElementById('offer-assignment-request')
            ].filter(Boolean);
            const depositAmountInput = document.getElementById('offer-deposit-flat-fee');
            const depositAmountModeSelect = document.getElementById('offer-deposit-amount-mode');
            const depositAmountLabel = document.getElementById('offer-deposit-amount-label');
            const sellerCompToggle = document.getElementById('offer-seller-comp-enabled');
            const sellerCompFields = document.getElementById('offer-seller-comp-fields');
            const sellerCompPercentInput = document.getElementById('offer-seller-comp-percent');
            const sellerCompAmountInput = document.getElementById('offer-seller-comp-amount');
            const purchasePriceInput = document.getElementById('offer-purchase-price');
            const assignmentRequestInput = document.getElementById('offer-assignment-request');
            const otherOfferSelect = document.getElementById('offer-other-offer');

            if (offerNumericInputs.length === 0 && !depositAmountInput) {
                return;
            }

            function formatOfferIntegerInput(input) {
                const rawValue = String(input.value || '');
                const digitsOnly = rawValue.replace(/[^0-9]/g, '');
                if (!digitsOnly) {
                    input.value = '';
                    return;
                }

                const normalized = digitsOnly.replace(/^0+(?=\d)/, '') || '0';
                input.value = Number(normalized).toLocaleString('en-US');
            }

            function formatOfferDecimalInput(input) {
                const rawValue = String(input.value || '');
                const cleaned = rawValue.replace(/,/g, '').replace(/[^0-9.]/g, '');
                if (!cleaned) {
                    input.value = '';
                    return;
                }

                if (cleaned === '.') {
                    input.value = '0.';
                    return;
                }

                const hasDot = cleaned.includes('.');
                const parts = cleaned.split('.');
                const integerPartRaw = parts[0] || '0';
                const decimalPartRaw = parts[1] || '';
                const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
                const formattedInteger = Number(integerPart).toLocaleString('en-US');
                input.value = hasDot ? `${formattedInteger}.${decimalPartRaw}` : formattedInteger;
            }

            function parseOfferNumericValue(value) {
                const numeric = Number(String(value || '').replace(/,/g, '').replace(/[^0-9.]/g, ''));
                return Number.isFinite(numeric) ? numeric : 0;
            }

            function updateSellerCompensationAmount() {
                if (!sellerCompToggle || !sellerCompToggle.checked || !sellerCompPercentInput || !sellerCompAmountInput) {
                    return;
                }

                const percent = parseOfferNumericValue(sellerCompPercentInput.value);
                const purchasePrice = parseOfferNumericValue(purchasePriceInput ? purchasePriceInput.value : '');
                if (percent <= 0 || purchasePrice <= 0) {
                    return;
                }

                const computedAmount = Math.round((purchasePrice * percent) / 100);
                sellerCompAmountInput.value = String(computedAmount);
                formatOfferIntegerInput(sellerCompAmountInput);
            }

            function updateSellerCompensationUi() {
                if (!sellerCompToggle || !sellerCompFields) {
                    return;
                }

                sellerCompFields.hidden = !sellerCompToggle.checked;
                if (sellerCompToggle.checked) {
                    updateSellerCompensationAmount();
                }
            }

            function applyOtherOfferPreset() {
                if (!otherOfferSelect || !assignmentRequestInput) {
                    return;
                }

                if (otherOfferSelect.value === 'wholesale') {
                    assignmentRequestInput.value = '15000';
                    formatOfferIntegerInput(assignmentRequestInput);
                } else if (otherOfferSelect.value === 'cash-for-keys') {
                    assignmentRequestInput.value = '10000';
                    formatOfferIntegerInput(assignmentRequestInput);
                }
            }

            function applyDepositAmountModeUi() {
                if (!depositAmountInput) return;

                const isPercentage = depositAmountModeSelect && depositAmountModeSelect.value === 'percentage';
                if (depositAmountLabel) {
                    depositAmountLabel.firstChild.textContent = isPercentage ? 'Percentage' : 'Flat Fee';
                }

                if (isPercentage) {
                    depositAmountInput.inputMode = 'decimal';
                    depositAmountInput.placeholder = 'e.g., 3.5';
                    formatOfferDecimalInput(depositAmountInput);
                } else {
                    depositAmountInput.inputMode = 'numeric';
                    depositAmountInput.placeholder = 'e.g., 5000';
                    if (!String(depositAmountInput.value || '').trim()) {
                        depositAmountInput.value = '5000';
                    }
                    formatOfferIntegerInput(depositAmountInput);
                }
            }

            offerNumericInputs.forEach(input => {
                formatOfferIntegerInput(input);
                input.addEventListener('input', () => {
                    formatOfferIntegerInput(input);
                    if (input === purchasePriceInput) {
                        updateSellerCompensationAmount();
                    }
                });
            });

            if (depositAmountInput) {
                if (!String(depositAmountInput.value || '').trim()) {
                    depositAmountInput.value = '5000';
                }
                applyDepositAmountModeUi();

                depositAmountInput.addEventListener('input', () => {
                    const isPercentage = depositAmountModeSelect && depositAmountModeSelect.value === 'percentage';
                    if (isPercentage) {
                        formatOfferDecimalInput(depositAmountInput);
                    } else {
                        formatOfferIntegerInput(depositAmountInput);
                    }
                });
            }

            if (depositAmountModeSelect) {
                depositAmountModeSelect.addEventListener('change', applyDepositAmountModeUi);
            }

            if (otherOfferSelect) {
                otherOfferSelect.addEventListener('change', applyOtherOfferPreset);
            }

            if (sellerCompToggle) {
                sellerCompToggle.addEventListener('change', updateSellerCompensationUi);
            }

            if (sellerCompPercentInput) {
                sellerCompPercentInput.addEventListener('input', () => {
                    formatOfferDecimalInput(sellerCompPercentInput);
                    updateSellerCompensationAmount();
                });
            }

            if (sellerCompAmountInput) {
                sellerCompAmountInput.addEventListener('input', () => {
                    formatOfferIntegerInput(sellerCompAmountInput);
                });
            }

            if (sellerCompToggle) {
                sellerCompToggle.checked = false;
            }
            applyOtherOfferPreset();
            updateSellerCompensationUi();
        }

        function initPropertyTabNumericFormatting() {
            const formattedInputs = Array.from(document.querySelectorAll(
                '.property-tab-panel input[type="text"][inputmode="numeric"], .property-tab-panel input[type="text"][inputmode="decimal"]'
            ));

            function formatInputValue(input) {
                if (!input) {
                    return;
                }

                const inputMode = String(input.inputMode || '').trim().toLowerCase();
                if (inputMode === 'decimal') {
                    const rawValue = String(input.value || '');
                    const cleaned = rawValue.replace(/,/g, '').replace(/[^0-9.]/g, '');
                    if (!cleaned) {
                        input.value = '';
                        return;
                    }

                    if (cleaned === '.') {
                        input.value = '0.';
                        return;
                    }

                    const hasDot = cleaned.includes('.');
                    const parts = cleaned.split('.');
                    const integerPartRaw = parts[0] || '0';
                    const decimalPartRaw = parts[1] || '';
                    const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
                    const formattedInteger = Number(integerPart).toLocaleString('en-US');
                    input.value = hasDot ? `${formattedInteger}.${decimalPartRaw}` : formattedInteger;
                    return;
                }

                const digitsOnly = String(input.value || '').replace(/[^0-9]/g, '');
                if (!digitsOnly) {
                    input.value = '';
                    return;
                }

                const normalized = digitsOnly.replace(/^0+(?=\d)/, '') || '0';
                input.value = Number(normalized).toLocaleString('en-US');
            }

            formattedInputs.forEach(input => {
                if (input.dataset.numericFormattingBound === 'true') {
                    formatInputValue(input);
                    return;
                }

                input.dataset.numericFormattingBound = 'true';
                formatInputValue(input);
                input.addEventListener('input', () => {
                    formatInputValue(input);
                });
                input.addEventListener('blur', () => {
                    formatInputValue(input);
                });
            });
        }

        initOfferNumberInputFormatting();
        initPropertyTabNumericFormatting();

        function initOfferDocumentsForProperty() {
            const entitySelect = document.getElementById('offer-entity');
            const docsList = document.getElementById('offer-docs-list');
            const docsNote = document.getElementById('offer-docs-note');
            const linkButton = document.getElementById('offer-link-document-btn');
            const uploadButton = document.getElementById('offer-upload-files-btn');
            const pdfButton = document.getElementById('offer-pdf-template-btn');
            const googleDocButton = document.getElementById('offer-google-doc-btn');
            const attachLinkButton = document.getElementById('offer-link-document-btn-attach');
            const attachUploadButton = document.getElementById('offer-upload-files-btn-attach');
            const attachPdfButton = document.getElementById('offer-pdf-template-btn-attach');
            const attachGoogleDocButton = document.getElementById('offer-google-doc-btn-attach');
            const uploadInput = document.getElementById('offer-upload-input');

            if (!entitySelect || !docsList || !docsNote || !linkButton || !uploadButton || !pdfButton || !googleDocButton || !uploadInput) {
                return;
            }

            const actionButtons = [linkButton, uploadButton, pdfButton, googleDocButton];

            function getSelectLabel(selectEl) {
                const option = selectEl && selectEl.selectedOptions ? selectEl.selectedOptions[0] : null;
                return option ? String(option.textContent || '').trim() : '';
            }

            function getEntityLabel(value) {
                const option = Array.from(entitySelect.options).find(item => item.value === value);
                return option ? String(option.textContent || '').trim() : 'No Entity';
            }

            function refreshActionState() {
                const hasEntity = Boolean(entitySelect.value);
                const documentCount = getPropertyOfferDocuments().length;

                if (!hasEntity) {
                    docsNote.textContent = 'Select an entity first, then use Link, Upload, PDF Template, or Google Doc.';
                    return;
                }

                docsNote.textContent = documentCount > 0
                    ? `Attached to ${getEntityLabel(entitySelect.value)}. Documents stay saved to this property.`
                    : `Ready to add documents under ${getEntityLabel(entitySelect.value)}.`;
            }

            function createActionButton(label, onClick, className = '') {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `offer-doc-action-btn ${className}`.trim();
                button.textContent = label;
                button.addEventListener('click', onClick);
                return button;
            }

            function renderEmptyDocumentsState() {
                docsList.innerHTML = `
                    <div class="offer-docs-empty">
                        <div class="offer-docs-empty-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
                                <path d="M14 3v5h5"></path>
                                <path d="M9 13h6"></path>
                                <path d="M9 17h4"></path>
                            </svg>
                        </div>
                        <div class="offer-docs-empty-copy">
                            <strong>No documents attached yet.</strong>
                            <p>Start building this offer package with a link, upload, PDF template, or Google Doc.</p>
                        </div>
                    </div>
                `;
            }

            function requireEntity() {
                if (entitySelect.value) {
                    return entitySelect.value;
                }

                entitySelect.focus();
                showDashboardToast('error', 'Entity Required', 'Select an entity before adding offer documents.');
                return '';
            }

            function saveDocumentMetadata(documentItem) {
                const documents = getPropertyOfferDocuments();
                documents.unshift(documentItem);
                setPropertyOfferDocuments(documents);
                renderDocuments();
                refreshActionState();
            }

            async function openStoredDocument(documentItem, download = false) {
                const blob = await getOfferDocumentBlob(documentItem.id);
                if (!blob) {
                    showDashboardToast('error', 'File Missing', 'This document file is no longer available in browser storage.');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                if (download) {
                    link.download = documentItem.fileName || documentItem.label || 'offer-document';
                } else {
                    link.target = '_blank';
                    link.rel = 'noopener';
                }
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 30000);
            }

            async function removeDocument(documentItem) {
                const confirmed = window.confirm(`Remove "${documentItem.label}" from this offer package?`);
                if (!confirmed) {
                    return;
                }

                if (documentItem.storage === 'indexeddb') {
                    try {
                        await deleteOfferDocumentBlob(documentItem.id);
                    } catch (error) {
                        showDashboardToast('error', 'Delete Failed', 'Unable to remove the stored file.');
                        return;
                    }
                }

                setPropertyOfferDocuments(getPropertyOfferDocuments().filter(item => item.id !== documentItem.id));
                renderDocuments();
                refreshActionState();
                showDashboardToast('success', 'Document Removed', 'The document was removed from this property.');
            }

            function renderDocuments() {
                const documents = getPropertyOfferDocuments();
                docsList.innerHTML = '';

                if (documents.length === 0) {
                    renderEmptyDocumentsState();
                    return;
                }

                const listWrap = document.createElement('div');
                listWrap.className = 'offer-docs-list';

                documents.forEach(documentItem => {
                    const item = document.createElement('article');
                    item.className = 'offer-doc-item';

                    const head = document.createElement('div');
                    head.className = 'offer-doc-item-head';

                    const titleWrap = document.createElement('div');
                    const title = document.createElement('strong');
                    title.textContent = documentItem.label || documentItem.fileName || 'Offer Document';
                    const subtitle = document.createElement('p');
                    subtitle.textContent = `Added ${new Date(Number(documentItem.createdAt) || Date.now()).toLocaleString()}`;
                    titleWrap.appendChild(title);
                    titleWrap.appendChild(subtitle);

                    const meta = document.createElement('div');
                    meta.className = 'offer-doc-meta';
                    [
                        getEntityLabel(documentItem.entity || ''),
                        documentItem.kindLabel || 'Document',
                        documentItem.fileSize ? formatFileSize(documentItem.fileSize) : '',
                        documentItem.fileType || ''
                    ].filter(Boolean).forEach(value => {
                        const chip = document.createElement('span');
                        chip.className = 'offer-doc-chip';
                        chip.textContent = value;
                        meta.appendChild(chip);
                    });

                    head.appendChild(titleWrap);
                    head.appendChild(meta);
                    item.appendChild(head);

                    if (documentItem.url) {
                        const urlText = document.createElement('p');
                        urlText.textContent = documentItem.url;
                        item.appendChild(urlText);
                    }

                    const actions = document.createElement('div');
                    actions.className = 'offer-doc-actions';

                    if (documentItem.url) {
                        actions.appendChild(createActionButton('Open Link', () => {
                            window.open(documentItem.url, '_blank', 'noopener');
                        }));
                    } else {
                        actions.appendChild(createActionButton('Open', async () => {
                            await openStoredDocument(documentItem, false);
                        }));
                        actions.appendChild(createActionButton('Download', async () => {
                            await openStoredDocument(documentItem, true);
                        }));
                    }

                    actions.appendChild(createActionButton('Remove', async () => {
                        await removeDocument(documentItem);
                    }, 'danger'));

                    item.appendChild(actions);
                    listWrap.appendChild(item);
                });

                docsList.appendChild(listWrap);
            }

            function readOfferField(id) {
                const element = document.getElementById(id);
                return element ? String(element.value || '').trim() : '';
            }

            function getSellerCompensationDisplay() {
                const enabled = document.getElementById('offer-seller-comp-enabled');
                if (!enabled || !enabled.checked) {
                    return '';
                }

                const percent = readOfferField('offer-seller-comp-percent');
                const amount = readOfferField('offer-seller-comp-amount');
                if (percent && amount) {
                    return `${percent}% ($${amount})`;
                }
                if (percent) {
                    return `${percent}%`;
                }
                if (amount) {
                    return `$${amount}`;
                }
                return 'Enabled';
            }

            function getOfferDepositAmountDisplay() {
                const mode = readOfferField('offer-deposit-amount-mode') === 'percentage' ? 'percentage' : 'flat-fee';
                const amount = readOfferField('offer-deposit-flat-fee');
                if (!amount) {
                    return 'N/A';
                }
                return mode === 'percentage' ? `${amount}%` : amount;
            }

            function buildOfferPdfLines(selectedEntity) {
                return [
                    'FAST BRIDGE GROUP Offer Template',
                    '',
                    `Property: ${propertyAddress || 'N/A'}`,
                    `Entity: ${getEntityLabel(selectedEntity)}`,
                    `Purchase Price: ${readOfferField('offer-purchase-price') || 'N/A'}`,
                    `Close of Escrow (Days): ${readOfferField('offer-close-escrow-days') || 'N/A'}`,
                    `Deposit Amount: ${getOfferDepositAmountDisplay()}`,
                    `Deposit Type: ${getSelectLabel(document.getElementById('offer-deposit-type')) || 'N/A'}`,
                    `Offer Type: ${getSelectLabel(document.getElementById('offer-type')) || 'N/A'}`,
                    `Inspection Period: ${getSelectLabel(document.getElementById('offer-inspection-period')) || 'N/A'}`,
                    `Escrow Fees: ${getSelectLabel(document.getElementById('offer-escrow-fees')) || 'N/A'}`,
                    `Title Fees: ${getSelectLabel(document.getElementById('offer-title-fees')) || 'N/A'}`,
                    `Escrow: ${readOfferField('offer-escrow') || 'N/A'}`,
                    `Title Company: ${readOfferField('offer-title-company') || 'N/A'}`,
                    `Other Terms: ${readOfferField('offer-other-terms') || 'N/A'}`,
                    `Seller Compensation: ${getSellerCompensationDisplay() || 'Not included'}`,
                    `Generated: ${new Date().toLocaleString()}`
                ];
            }

            linkButton.addEventListener('click', () => {
                const selectedEntity = requireEntity();
                if (!selectedEntity) return;

                const rawUrl = window.prompt('Paste the document URL to attach to this offer:');
                const url = normalizeExternalUrl(rawUrl);
                if (!url) {
                    if (rawUrl !== null) {
                        showDashboardToast('error', 'Invalid URL', 'Enter a full http:// or https:// document link.');
                    }
                    return;
                }

                const label = (window.prompt('Label for this linked document:', 'Linked Document') || '').trim() || 'Linked Document';
                saveDocumentMetadata({
                    id: `offer-doc-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                    propertyAddress,
                    entity: selectedEntity,
                    label,
                    kind: 'link',
                    kindLabel: 'Linked URL',
                    url,
                    createdAt: Date.now()
                });
                showDashboardToast('success', 'Document Linked', 'The document link was added to this offer package.');
            });

            googleDocButton.addEventListener('click', () => {
                const selectedEntity = requireEntity();
                if (!selectedEntity) return;

                const rawUrl = window.prompt('Paste the Google Doc link:');
                const url = normalizeExternalUrl(rawUrl);
                if (!url || !/docs\.google\.com/i.test(url)) {
                    if (rawUrl !== null) {
                        showDashboardToast('error', 'Invalid Google Doc', 'Use a valid docs.google.com link.');
                    }
                    return;
                }

                const label = (window.prompt('Label for this Google Doc:', 'Google Doc') || '').trim() || 'Google Doc';
                saveDocumentMetadata({
                    id: `offer-doc-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                    propertyAddress,
                    entity: selectedEntity,
                    label,
                    kind: 'google-doc',
                    kindLabel: 'Google Doc',
                    url,
                    createdAt: Date.now()
                });
                showDashboardToast('success', 'Google Doc Added', 'The Google Doc link was attached to this offer package.');
            });

            uploadButton.addEventListener('click', () => {
                const selectedEntity = requireEntity();
                if (!selectedEntity) return;
                uploadInput.click();
            });

            uploadInput.addEventListener('change', async () => {
                const selectedEntity = requireEntity();
                const files = Array.from(uploadInput.files || []);
                if (!selectedEntity || files.length === 0) {
                    uploadInput.value = '';
                    return;
                }

                try {
                    for (const file of files) {
                        const documentId = `offer-doc-${Date.now()}-${Math.round(Math.random() * 10000)}`;
                        await putOfferDocumentBlob(documentId, file);
                        saveDocumentMetadata({
                            id: documentId,
                            propertyAddress,
                            entity: selectedEntity,
                            label: file.name,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type || 'File',
                            kind: 'upload',
                            kindLabel: 'Uploaded File',
                            storage: 'indexeddb',
                            createdAt: Date.now()
                        });
                    }
                } catch (error) {
                    showDashboardToast('error', 'Upload Failed', 'The browser could not store one or more selected files.');
                    uploadInput.value = '';
                    return;
                }

                uploadInput.value = '';
                showDashboardToast('success', 'Files Added', 'Selected files were attached to this offer package.');
            });

            pdfButton.addEventListener('click', async () => {
                const selectedEntity = requireEntity();
                if (!selectedEntity) return;

                const documentId = `offer-doc-${Date.now()}-${Math.round(Math.random() * 10000)}`;
                const fileName = `${propertyAddress || 'offer'}-${selectedEntity}-template.pdf`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '') || 'offer-template.pdf';

                try {
                    const pdfBlob = buildSimplePdfBlob(buildOfferPdfLines(selectedEntity));
                    await putOfferDocumentBlob(documentId, pdfBlob);
                    const documentItem = {
                        id: documentId,
                        propertyAddress,
                        entity: selectedEntity,
                        label: 'Offer PDF Template',
                        fileName,
                        fileSize: pdfBlob.size,
                        fileType: 'application/pdf',
                        kind: 'template',
                        kindLabel: 'PDF Template',
                        storage: 'indexeddb',
                        createdAt: Date.now()
                    };
                    saveDocumentMetadata({
                        ...documentItem
                    });
                    await openStoredDocument(documentItem, true);
                    showDashboardToast('success', 'PDF Template Added', 'A PDF template was generated and added to the offer package.');
                } catch (error) {
                    showDashboardToast('error', 'Template Failed', 'Unable to generate the PDF template in this browser.');
                }
            });

            entitySelect.addEventListener('change', refreshActionState);

            [
                [attachLinkButton, linkButton],
                [attachUploadButton, uploadButton],
                [attachPdfButton, pdfButton],
                [attachGoogleDocButton, googleDocButton]
            ].forEach(([aliasButton, sourceButton]) => {
                if (!aliasButton || !sourceButton) {
                    return;
                }

                aliasButton.addEventListener('click', () => {
                    sourceButton.click();
                });
            });

            renderDocuments();
            refreshActionState();
        }

        initOfferDocumentsForProperty();

        function initOfferEmailPrep() {
            const senderNameInput = document.getElementById('offer-email-sender-name');
            const senderEmailInput = document.getElementById('offer-email-sender');
            const recipientNameInput = document.getElementById('offer-email-recipient-name');
            const recipientEmailInput = document.getElementById('offer-email-recipient');
            const categorySelect = document.getElementById('offer-email-category');
            const subcategorySelect = document.getElementById('offer-email-subcategory');
            const templateSelect = document.getElementById('offer-email-template');
            const investorAttachmentsSelect = document.getElementById('offer-email-investor-attachments');
            const sendModeSelect = document.getElementById('offer-email-send-mode');
            const ecardSelect = document.getElementById('offer-email-ecard');
                const ecardToggle = document.getElementById('offer-email-ecard-toggle');
            const includeTermsToggle = document.getElementById('offer-email-include-terms');
            const subjectInput = document.getElementById('offer-email-subject');
            const bodyInput = document.getElementById('offer-email-body');
            const copySubjectButton = document.getElementById('offer-email-copy-subject-btn');
            const copyBodyButton = document.getElementById('offer-email-copy-body-btn');
            const sendAgentButton = document.getElementById('offer-email-send-agent-btn');
            const openButton = document.getElementById('offer-email-open-btn');
            const docSummary = document.getElementById('offer-email-doc-summary');
            const emailNote = document.getElementById('offer-email-note');
            const entitySelect = document.getElementById('offer-entity');

            if (!senderNameInput || !senderEmailInput || !recipientNameInput || !recipientEmailInput || !categorySelect || !subcategorySelect || !templateSelect || !investorAttachmentsSelect || !sendModeSelect || !includeTermsToggle || !subjectInput || !bodyInput || !copySubjectButton || !copyBodyButton || !sendAgentButton || !openButton || !docSummary || !emailNote || !entitySelect || !ecardSelect) {
                return;
            }

            const EMAIL_GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=Fira+Sans:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family=Lato:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Manrope:wght@400;500;600;700;800&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700;800&family=Open+Sans:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&family=Quicksand:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Rubik:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap';
            const EMAIL_FONT_OPTIONS = [
                { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
                { label: 'Outfit', value: "'Outfit', Arial, sans-serif" },
                { label: 'DM Sans', value: "'DM Sans', Arial, sans-serif" },
                { label: 'Manrope', value: "'Manrope', Arial, sans-serif" },
                { label: 'Open Sans', value: "'Open Sans', Arial, sans-serif" },
                { label: 'Roboto', value: "'Roboto', Arial, sans-serif" },
                { label: 'Lato', value: "'Lato', Arial, sans-serif" },
                { label: 'Source Sans 3', value: "'Source Sans 3', Arial, sans-serif" },
                { label: 'Nunito Sans', value: "'Nunito Sans', Arial, sans-serif" },
                { label: 'Work Sans', value: "'Work Sans', Arial, sans-serif" },
                { label: 'IBM Plex Sans', value: "'IBM Plex Sans', Arial, sans-serif" },
                { label: 'Karla', value: "'Karla', Arial, sans-serif" },
                { label: 'Fira Sans', value: "'Fira Sans', Arial, sans-serif" },
                { label: 'Montserrat', value: "'Montserrat', Arial, sans-serif" },
                { label: 'Poppins', value: "'Poppins', Arial, sans-serif" },
                { label: 'Raleway', value: "'Raleway', Arial, sans-serif" },
                { label: 'Rubik', value: "'Rubik', Arial, sans-serif" },
                { label: 'Quicksand', value: "'Quicksand', Arial, sans-serif" },
                { label: 'Noto Sans', value: "'Noto Sans', Arial, sans-serif" },
                { label: 'PT Sans', value: "'PT Sans', Arial, sans-serif" },
                { label: 'Georgia', value: 'Georgia, Times New Roman, serif' },
                { label: 'Merriweather', value: "'Merriweather', Georgia, serif" },
                { label: 'Libre Baskerville', value: "'Libre Baskerville', Georgia, serif" },
                { label: 'Playfair Display', value: "'Playfair Display', Georgia, serif" },
                { label: 'Bitter', value: "'Bitter', Georgia, serif" }
            ];
            const DEFAULT_EMAIL_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
            const DEFAULT_EMAIL_TEXT_COLOR = '#111827';
            const LEGACY_EMAIL_FONT_MAP = {
                'Arial': 'Arial, Helvetica, sans-serif',
                'Georgia': 'Georgia, Times New Roman, serif',
                'Tahoma': 'Arial, Helvetica, sans-serif',
                'Trebuchet MS': "'DM Sans', Arial, sans-serif",
                'Verdana': "'Open Sans', Arial, sans-serif"
            };

            function ensureEmailGoogleFontsLoaded() {
                const head = document.head || document.getElementsByTagName('head')[0];
                if (!head) {
                    return;
                }

                if (!document.getElementById('offer-email-fonts-preconnect')) {
                    const preconnect = document.createElement('link');
                    preconnect.id = 'offer-email-fonts-preconnect';
                    preconnect.rel = 'preconnect';
                    preconnect.href = 'https://fonts.googleapis.com';
                    head.appendChild(preconnect);
                }

                if (!document.getElementById('offer-email-fonts-gstatic')) {
                    const preconnectGstatic = document.createElement('link');
                    preconnectGstatic.id = 'offer-email-fonts-gstatic';
                    preconnectGstatic.rel = 'preconnect';
                    preconnectGstatic.href = 'https://fonts.gstatic.com';
                    preconnectGstatic.crossOrigin = 'anonymous';
                    head.appendChild(preconnectGstatic);
                }

                if (!document.getElementById('offer-email-fonts-stylesheet')) {
                    const stylesheet = document.createElement('link');
                    stylesheet.id = 'offer-email-fonts-stylesheet';
                    stylesheet.rel = 'stylesheet';
                    stylesheet.href = EMAIL_GOOGLE_FONTS_URL;
                    head.appendChild(stylesheet);
                }
            }

            function normalizeEmailFontFamily(value) {
                const rawValue = String(value || '').trim();
                const mappedValue = LEGACY_EMAIL_FONT_MAP[rawValue] || rawValue;
                return EMAIL_FONT_OPTIONS.some((option) => option.value === mappedValue)
                    ? mappedValue
                    : DEFAULT_EMAIL_FONT_FAMILY;
            }

            function populateEmailFontFamilyOptions(selectEl) {
                if (!selectEl) {
                    return;
                }

                selectEl.innerHTML = '';
                EMAIL_FONT_OPTIONS.forEach((option) => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option.value;
                    optionEl.textContent = option.label;
                    optionEl.style.fontFamily = option.value;
                    selectEl.appendChild(optionEl);
                });
            }

            function getSelectedEmailFontFamily() {
                return normalizeEmailFontFamily((document.getElementById('offer-email-font-family') || {}).value || savedDraft.fontFamily || DEFAULT_EMAIL_FONT_FAMILY);
            }

            function getSelectedEmailFontSizeValue() {
                const selectedFontSize = String((document.getElementById('offer-email-font-size') || {}).value || savedDraft.fontSize || '3').trim();
                return /^[1-7]$/.test(selectedFontSize) ? selectedFontSize : '3';
            }

            function normalizeEmailTextColor(value) {
                const rawValue = String(value || '').trim();
                return /^#[0-9a-f]{6}$/i.test(rawValue) ? rawValue.toLowerCase() : DEFAULT_EMAIL_TEXT_COLOR;
            }

            function getSelectedEmailTextColor() {
                return normalizeEmailTextColor((document.getElementById('offer-email-text-color') || {}).value || savedDraft.textColor || DEFAULT_EMAIL_TEXT_COLOR);
            }

            const OFFER_EMAIL_LIBRARY = {
                'initial-offer': {
                    label: 'Initial Offer',
                    subcategories: {
                        cash: {
                            label: 'Cash',
                            templates: {
                                'standard-terms': { label: 'Standard Terms' },
                                'quick-close': { label: 'Quick Close' }
                            }
                        },
                        'hard-money': {
                            label: 'Hard Money',
                            templates: {
                                'standard-terms': { label: 'Standard Terms' },
                                'as-is-close': { label: 'As-Is Close' }
                            }
                        },
                        conventional: {
                            label: 'Conventional',
                            templates: {
                                'standard-terms': { label: 'Standard Terms' }
                            }
                        },
                        'fha-203k': {
                            label: 'FHA 203K',
                            templates: {
                                'standard-terms': { label: 'Standard Terms' }
                            }
                        },
                        'seller-finance': {
                            label: 'Seller Finance',
                            templates: {
                                'structured-terms': { label: 'Structured Terms' }
                            }
                        },
                        general: {
                            label: 'General',
                            templates: {
                                'terms-summary': { label: 'Terms Summary' }
                            }
                        }
                    }
                },
                'counter-offer': {
                    label: 'Counter / Revision',
                    subcategories: {
                        general: {
                            label: 'General',
                            templates: {
                                'revised-terms': { label: 'Revised Terms' },
                                'price-update': { label: 'Price Update' }
                            }
                        }
                    }
                },
                'follow-up': {
                    label: 'Follow Up',
                    subcategories: {
                        general: {
                            label: 'General',
                            templates: {
                                'check-status': { label: 'Check Status' },
                                'doc-follow-up': { label: 'Doc Follow Up' }
                            }
                        }
                    }
                },
                'doc-delivery': {
                    label: 'Document Delivery',
                    subcategories: {
                        general: {
                            label: 'General',
                            templates: {
                                'package-ready': { label: 'Package Ready' }
                            }
                        }
                    }
                }
            };

            const savedDraft = detailData.offerEmailDraft && typeof detailData.offerEmailDraft === 'object'
                ? detailData.offerEmailDraft
                : {};
            let investorAttachmentPackages = [];

            function readLocalJson(key) {
                try {
                    return JSON.parse(localStorage.getItem(key) || '{}');
                } catch (error) {
                    return {};
                }
            }

            function getSenderProfile() {
                const profile = readLocalJson('userProfile');
                const user = readLocalJson('user');
                const smtpSettings = readLocalJson('smtpSettings');
                const smtpUser = String(smtpSettings && smtpSettings.smtpUser ? smtpSettings.smtpUser : '').trim();
                return {
                    name: String(savedDraft.senderName || profile.name || user.name || workspaceUser.name || '').trim(),
                    email: String(savedDraft.senderEmail || smtpUser || profile.email || user.email || '').trim()
                };
            }

            function getOfferSignerName() {
                const profile = readLocalJson('userProfile');
                const user = readLocalJson('user');
                return String(
                    savedDraft.senderName ||
                    profile.name ||
                    user.name ||
                    workspaceUser.name ||
                    ''
                ).trim();
            }

            function getStoredUserProfile() {
                const scopedStore = readLocalJson('userProfilesByUser');
                const scopedProfile = scopedStore && typeof scopedStore === 'object'
                    ? scopedStore[workspaceUser.key]
                    : null;
                if (scopedProfile && typeof scopedProfile === 'object') {
                    return scopedProfile;
                }
                return readLocalJson('userProfile');
            }

            function getStoredSmtpSettings() {
                const smtpSettings = readLocalJson('smtpSettings');
                return smtpSettings && typeof smtpSettings === 'object' ? smtpSettings : {};
            }

            function getECardSignatureLines() {
                const profile = getStoredUserProfile();
                const fullName = String(profile.ecardDisplayName || profile.name || workspaceUser.name || '').trim();
                const role = String(profile.jobTitle || profile.role || 'Broker / Investor').trim();
                const phone = String(profile.ecardDisplayPhone || profile.phone || '').trim();
                const email = String(profile.email || '').trim();
                const license = String(profile.licenseNumber || '').trim();
                const address = String(profile.address || '').trim();
                const buyBox = String(profile.buyBox || '').trim();
                const targetAreas = String(profile.targetAreas || '').trim();

                const lines = [
                    fullName || 'User',
                    role || 'Broker / Investor'
                ];

                if (phone) lines.push(`Phone: ${phone}`);
                if (email) lines.push(`Email: ${email}`);
                if (license) lines.push(`License: ${license}`);
                if (address) lines.push(`Address: ${address}`);
                if (buyBox) lines.push(`Buying Box: ${buyBox}`);
                if (targetAreas) lines.push(`Areas/Counties: ${targetAreas}`);
                lines.push('FAST BRIDGE GROUP, LLC');
                return lines;
            }

            function getSavedGmailSignatureLines() {
                const smtpSettings = getStoredSmtpSettings();
                return String(smtpSettings.smtpSignature || '')
                    .split(/\r?\n/)
                    .map(line => String(line || '').trim())
                    .filter(Boolean);
            }

            function getPreferredSignatureLines() {
                const gmailSignatureLines = getSavedGmailSignatureLines();
                if (gmailSignatureLines.length > 0) {
                    return gmailSignatureLines;
                }
                return getECardSignatureLines();
            }

            function getOfferFieldValue(id) {
                const element = document.getElementById(id);
                return element ? String(element.value || '').trim() : '';
            }

            function getOfferSelectText(id) {
                const element = document.getElementById(id);
                const option = element && element.selectedOptions ? element.selectedOptions[0] : null;
                return option ? String(option.textContent || '').trim() : '';
            }

            let availableECardEntries = [];

            function normalizeECardMatchValue(value) {
                return String(value || '')
                    .toLowerCase()
                    .replace(/\.[a-z0-9]+$/i, '')
                    .replace(/[^a-z0-9]+/g, ' ')
                    .trim();
            }

            function getAvailableECardEntry(value) {
                const normalized = String(value || '').trim();
                if (!normalized) {
                    return null;
                }

                return availableECardEntries.find((entry) => String(entry.relativePath || '').trim() === normalized) || null;
            }

            function isAllowedECardPath(value) {
                return Boolean(getAvailableECardEntry(value));
            }

            function getECardLabel(value) {
                const entry = getAvailableECardEntry(value);
                if (entry && entry.label) {
                    return String(entry.label).trim();
                }

                return String(value || '')
                    .split('/')
                    .pop()
                    .replace(/\.[a-z0-9]+$/i, '')
                    .trim();
            }

            function populateECardOptions() {
                if (!ecardSelect) {
                    return;
                }

                const currentValue = String(ecardSelect.value || '').trim();
                ecardSelect.innerHTML = '<option value="">Do not include E-card</option>';
                availableECardEntries.forEach((entry) => {
                    const option = document.createElement('option');
                    option.value = entry.relativePath;
                    option.textContent = entry.label || getECardLabel(entry.relativePath);
                    ecardSelect.appendChild(option);
                });

                if (isAllowedECardPath(currentValue)) {
                    ecardSelect.value = currentValue;
                }
            }

            async function loadAvailableECardOptions(preferredValue = '') {
                try {
                    const response = await fetch('/api/admin-ecards');
                    if (!response.ok) {
                        throw new Error('Could not load E-card folders.');
                    }

                    const result = await response.json();
                    availableECardEntries = Array.isArray(result?.ecards) ? result.ecards : [];
                } catch (error) {
                    availableECardEntries = [];
                    emailNote.textContent = 'E-card folders could not be loaded right now. Send To Agent can still resolve your E-card from the USERS folder when available.';
                }

                populateECardOptions();

                const selectedPath = isAllowedECardPath(preferredValue) ? String(preferredValue || '').trim() : '';
                if (selectedPath) {
                    ensureECardOption(selectedPath);
                    ecardSelect.value = selectedPath;
                }
            }

            function getUserECardJpgPath() {
                const profile = getStoredUserProfile();
                const name = String(profile.name || workspaceUser.name || '').trim();
                if (!name) {
                    return '';
                }

                const normalizedName = normalizeECardMatchValue(name);
                const match = availableECardEntries.find((entry) => {
                    const normalizedOwnerName = normalizeECardMatchValue(entry.ownerName || '');
                    const normalizedLabel = normalizeECardMatchValue(entry.label || '');
                    const normalizedFileName = normalizeECardMatchValue(entry.fileName || getECardLabel(entry.relativePath));
                    return normalizedOwnerName === normalizedName
                        || normalizedOwnerName.includes(normalizedName)
                        || normalizedName.includes(normalizedOwnerName)
                        || normalizedLabel.includes(normalizedName)
                        || normalizedFileName.includes(normalizedName);
                });

                return match ? match.relativePath : '';
            }

            function getECardAttachmentName(value) {
                const entry = getAvailableECardEntry(value);
                const fallbackName = String(entry?.ownerName || getECardLabel(value) || 'E-Card').trim();
                const extensionMatch = String(value || '').match(/(\.[a-z0-9]+)$/i);
                const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '.jpg';

                return fallbackName ? `${fallbackName} E-Card${extension}` : `E-Card${extension}`;
            }

            function ensureECardOption(value) {
                if (!value || !isAllowedECardPath(value)) {
                    return;
                }

                const existingOption = Array.from(ecardSelect.options).find(option => option.value === value);
                if (existingOption) {
                    return;
                }

                const option = document.createElement('option');
                option.value = value;
                option.textContent = getECardLabel(value);
                ecardSelect.appendChild(option);
            }

            function getSelectedECardPath() {
                const value = String(ecardSelect.value || '').trim();
                return isAllowedECardPath(value) ? value : '';
            }

            function getSelectedECardLink() {
                const relativePath = getSelectedECardPath();
                if (!relativePath) {
                    return '';
                }

                const encodedPath = encodeURI(relativePath);
                if (window.location && /^https?:/i.test(String(window.location.origin || ''))) {
                    return `${window.location.origin}/${encodedPath}`;
                }
                return encodedPath;
            }

            function escapeHtml(value) {
                return String(value || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            function saveDraft() {
                detailData.offerEmailDraft = {
                    senderName: senderNameInput.value.trim(),
                    senderEmail: senderEmailInput.value.trim(),
                    recipientName: recipientNameInput.value.trim(),
                    recipientEmail: recipientEmailInput.value.trim(),
                    category: categorySelect.value,
                    subcategory: subcategorySelect.value,
                    template: templateSelect.value,
                    investorAttachmentFolder: investorAttachmentsSelect.value,
                    sendMode: sendModeSelect.value,
                    ecard: ecardSelect.value,
                    includeECard: Boolean(ecardToggle && ecardToggle.checked),
                    includeTerms: Boolean(includeTermsToggle.checked),
                    subject: subjectInput.value,
                    body: (bodyInput.contentEditable === 'true' ? bodyInput.innerHTML : getBodyValue()),
                    subjectEdited: Boolean(subjectInput.dataset.userEdited === 'true'),
                    bodyEdited: Boolean(bodyInput.dataset.userEdited === 'true'),
                    fontFamily: (document.getElementById('offer-email-font-family') || {}).value || DEFAULT_EMAIL_FONT_FAMILY,
                    fontSize: (document.getElementById('offer-email-font-size') || {}).value || '3',
                    textColor: getSelectedEmailTextColor()
                };
                localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
            }

            function getBodyValue() {
                if (typeof bodyInput.value === 'string') {
                    return bodyInput.value;
                }
                return String(bodyInput.innerText || '').trim();
            }

            function getBodyHtml() {
                if (typeof bodyInput.value === 'string') {
                    return escapeHtml(bodyInput.value).replace(/\n/g, '<br>');
                }

                const rawHtml = String(bodyInput.innerHTML || '').trim();
                if (rawHtml) {
                    return rawHtml;
                }

                return escapeHtml(getBodyValue()).replace(/\n/g, '<br>');
            }

            function buildServerEmailHtml() {
                const bodyHtml = getBodyHtml();
                if (!bodyHtml) {
                    return '';
                }

                const fontFamily = getSelectedEmailFontFamily();
                const fontSize = fontSizePtMap[getSelectedEmailFontSizeValue()] || '12pt';
                const textColor = getSelectedEmailTextColor();

                return `
                    <style type="text/css">@import url('${EMAIL_GOOGLE_FONTS_URL}');</style>
                    <div style="font-family: ${fontFamily}; font-size: ${fontSize}; line-height: 1.65; color: ${textColor};">
                        ${bodyHtml}
                    </div>
                `.trim();
            }

            function blobToBase64(blob) {
                return new Promise((resolve, reject) => {
                    if (!(blob instanceof Blob)) {
                        reject(new Error('Attachment data is not a valid file blob.'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = String(reader.result || '');
                        const separatorIndex = result.indexOf(',');
                        resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result);
                    };
                    reader.onerror = () => {
                        reject(reader.error || new Error('Unable to encode the attachment file.'));
                    };
                    reader.readAsDataURL(blob);
                });
            }

            async function buildServerEmailAttachments() {
                const { uploads } = getDocumentSummaryParts();
                const attachments = [];

                for (const item of uploads) {
                    if (item.url) {
                        continue;
                    }

                    const blob = await getOfferDocumentBlob(item.id);
                    if (!blob) {
                        throw new Error(`Unable to load ${item.fileName || item.label || 'an attached file'} from browser storage.`);
                    }

                    attachments.push({
                        filename: String(item.fileName || item.label || `offer-document-${attachments.length + 1}`).trim(),
                        contentType: String(item.fileType || blob.type || 'application/octet-stream').trim(),
                        contentBase64: await blobToBase64(blob)
                    });
                }

                return attachments;
            }

            function populateInvestorAttachmentOptions(preferredValue = '') {
                investorAttachmentsSelect.innerHTML = '';

                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = 'No investor package';
                investorAttachmentsSelect.appendChild(placeholderOption);

                investorAttachmentPackages.forEach((entry) => {
                    const option = document.createElement('option');
                    option.value = entry.folderName;
                    option.textContent = `${entry.label} (${entry.fileCount})`;
                    investorAttachmentsSelect.appendChild(option);
                });

                investorAttachmentsSelect.value = investorAttachmentPackages.some((entry) => entry.folderName === preferredValue)
                    ? preferredValue
                    : '';
            }

            async function loadInvestorAttachmentPackages() {
                try {
                    const response = await fetch('/api/investor-attachments');
                    if (!response.ok) {
                        throw new Error('Could not load investor attachment folders.');
                    }

                    const result = await response.json();
                    investorAttachmentPackages = Array.isArray(result?.packages) ? result.packages : [];
                    populateInvestorAttachmentOptions(savedDraft.investorAttachmentFolder || '');
                } catch (error) {
                    investorAttachmentPackages = [];
                    populateInvestorAttachmentOptions('');
                    emailNote.textContent = 'Investor attachment folders could not be loaded right now. Uploaded files in the Offer Documents section below will still be sent automatically with Send To Agent.';
                }
            }

            function getSelectedInvestorAttachmentPackage() {
                const selectedFolder = String(investorAttachmentsSelect.value || '').trim();
                return investorAttachmentPackages.find((entry) => entry.folderName === selectedFolder) || null;
            }

            function getSelectedInvestorAttachmentPaths() {
                const selectedPackage = getSelectedInvestorAttachmentPackage();
                if (!selectedPackage || !Array.isArray(selectedPackage.files)) {
                    return [];
                }

                return selectedPackage.files
                    .map((fileEntry) => String(fileEntry?.relativePath || '').trim())
                    .filter(Boolean);
            }

            function setSubjectValue(value, options = {}) {
                subjectInput.value = String(value || '');
                if (options.userEdited) {
                    subjectInput.dataset.userEdited = 'true';
                } else {
                    delete subjectInput.dataset.userEdited;
                }
            }

            function setBodyValue(value, options = {}) {
                const safeValue = String(value || '');
                if (typeof bodyInput.value === 'string') {
                    bodyInput.value = safeValue;
                } else if (/<[a-z][\s\S]*>/i.test(safeValue)) {
                    // If the value already contains HTML tags (e.g. saved draft with formatting), inject as HTML.
                    bodyInput.innerHTML = safeValue;
                } else {
                    bodyInput.innerHTML = safeValue
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n/g, '<br>');
                }

                if (options.userEdited) {
                    bodyInput.dataset.userEdited = 'true';
                } else {
                    delete bodyInput.dataset.userEdited;
                }
            }

            function refreshPreparedEmail(options = {}) {
                const draft = buildDraftFromSelection({
                    includeTerms: Object.prototype.hasOwnProperty.call(options, 'includeTerms')
                        ? Boolean(options.includeTerms)
                        : Boolean(includeTermsToggle.checked)
                });
                const preserveManualEdits = options.preserveManualEdits !== false;
                const subjectWasEdited = subjectInput.dataset.userEdited === 'true';
                const bodyWasEdited = bodyInput.dataset.userEdited === 'true';

                if (!preserveManualEdits || !subjectWasEdited) {
                    setSubjectValue(draft.subject);
                }

                if (!preserveManualEdits || !bodyWasEdited) {
                    setBodyValue(draft.body);
                }
            }

            function getDocumentSummaryParts() {
                const documents = getPropertyOfferDocuments();
                const linked = documents.filter(item => item.url);
                const uploads = documents.filter(item => !item.url);
                return { documents, linked, uploads };
            }

            function renderDocumentSummary() {
                const { documents, linked, uploads } = getDocumentSummaryParts();
                const selectedInvestorPackage = getSelectedInvestorAttachmentPackage();
                const investorFiles = selectedInvestorPackage && Array.isArray(selectedInvestorPackage.files)
                    ? selectedInvestorPackage.files
                    : [];
                const totalPreparedDocuments = documents.length + investorFiles.length;

                if (totalPreparedDocuments === 0) {
                    docSummary.textContent = 'No offer documents attached yet.';
                    emailNote.textContent = 'Uploaded files in the Offer Documents section below will be sent automatically with Send To Agent. Browser-based mail drafts still cannot auto-attach local files.';
                    return;
                }

                const lines = [`${totalPreparedDocuments} document(s) prepared for this property.`];
                if (linked.length > 0) {
                    lines.push('Linked docs:');
                    linked.forEach(item => {
                        lines.push(`- ${item.label}: ${item.url}`);
                    });
                }
                if (uploads.length > 0) {
                    lines.push('Local files prepared for manual attachment:');
                    uploads.forEach(item => {
                        lines.push(`- ${item.fileName || item.label}`);
                    });
                }
                if (investorFiles.length > 0) {
                    lines.push(`Investor package: ${selectedInvestorPackage.label}`);
                    investorFiles.forEach(item => {
                        lines.push(`- ${item.name}`);
                    });
                }

                docSummary.textContent = lines.join('\n');
                emailNote.textContent = uploads.length > 0 || investorFiles.length > 0
                    ? 'Linked documents can be referenced in the body. Uploaded files and selected investor package files are sent automatically with Send To Agent. Open Email Draft still cannot auto-attach local files. Send To Agent can embed the selected E-card JPG inline.'
                    : 'All prepared documents are link-based and can be referenced directly in the email body. Send To Agent can embed the selected E-card JPG inline.';
            }

            function fillOptions(selectEl, options, placeholder) {
                selectEl.innerHTML = '';
                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = placeholder;
                selectEl.appendChild(placeholderOption);

                options.forEach(optionData => {
                    const option = document.createElement('option');
                    option.value = optionData.value;
                    option.textContent = optionData.label;
                    selectEl.appendChild(option);
                });
            }

            function syncSubcategories(preferredValue = '') {
                const category = OFFER_EMAIL_LIBRARY[categorySelect.value];
                if (!category) {
                    fillOptions(subcategorySelect, [], 'Select Sub Category');
                    fillOptions(templateSelect, [], 'Select Template');
                    return;
                }

                const subcategories = Object.keys(category.subcategories).map(value => ({
                    value,
                    label: category.subcategories[value].label
                }));
                fillOptions(subcategorySelect, subcategories, 'Select Sub Category');
                subcategorySelect.value = category.subcategories[preferredValue] ? preferredValue : subcategories[0]?.value || '';
                syncTemplates(savedDraft.template || '');
            }

            function syncTemplates(preferredValue = '') {
                const category = OFFER_EMAIL_LIBRARY[categorySelect.value];
                const subcategory = category && category.subcategories[subcategorySelect.value];
                if (!subcategory) {
                    fillOptions(templateSelect, [], 'Select Template');
                    return;
                }

                const templates = Object.keys(subcategory.templates).map(value => ({
                    value,
                    label: subcategory.templates[value].label
                }));
                fillOptions(templateSelect, templates, 'Select Template');
                templateSelect.value = subcategory.templates[preferredValue] ? preferredValue : templates[0]?.value || '';
            }

            function getEffectiveSubcategory() {
                const offerType = getOfferFieldValue('offer-type');
                if (offerType && (offerType in ((OFFER_EMAIL_LIBRARY[categorySelect.value] || {}).subcategories || {}))) {
                    return offerType;
                }
                return subcategorySelect.value || 'general';
            }

            function buildDraftFromSelection(options = {}) {
                const includeTerms = options.includeTerms !== false;
                const senderName = senderNameInput.value.trim();
                const recipientName = recipientNameInput.value.trim();
                const recipientEmail = recipientEmailInput.value.trim();
                const signerName = getOfferSignerName() || senderName || 'N/A';
                const entityText = getOfferSelectText('offer-entity') || 'Selected Entity';
                const categoryLabel = OFFER_EMAIL_LIBRARY[categorySelect.value]?.label || 'Offer Terms';
                const subcategoryLabel = OFFER_EMAIL_LIBRARY[categorySelect.value]?.subcategories[getEffectiveSubcategory()]?.label || 'General';
                const templateLabel = templateSelect.selectedOptions[0] ? templateSelect.selectedOptions[0].textContent.trim() : 'Standard Template';
                const purchasePrice = getOfferFieldValue('offer-purchase-price') || 'N/A';
                const closeEscrowDays = getOfferFieldValue('offer-close-escrow-days') || 'N/A';
                const depositMode = getOfferFieldValue('offer-deposit-amount-mode') === 'percentage' ? 'Percentage' : 'Flat Fee';
                const depositAmountValue = getOfferFieldValue('offer-deposit-flat-fee');
                const depositAmount = depositAmountValue ? (depositMode === 'Percentage' ? `${depositAmountValue}%` : depositAmountValue) : 'N/A';
                const appraisal = getOfferSelectText('offer-appraisal') || 'N/A';
                const inspection = getOfferSelectText('offer-inspection-period') || 'N/A';
                const termite = getOfferSelectText('offer-termite-inspection') || 'N/A';
                const escrow = getOfferFieldValue('offer-escrow') || 'TBD';
                const titleCompany = getOfferFieldValue('offer-title-company') || 'TBD';
                const offerType = getOfferSelectText('offer-type') || subcategoryLabel;
                const otherTerms = getOfferFieldValue('offer-other-terms') || 'None listed.';
                const sellerCompEnabled = document.getElementById('offer-seller-comp-enabled')?.checked;
                const sellerCompPercent = getOfferFieldValue('offer-seller-comp-percent');
                const sellerCompAmount = getOfferFieldValue('offer-seller-comp-amount');
                const documents = getDocumentSummaryParts();

                const subject = `${categoryLabel} | ${propertyAddress || 'Property'} | ${entityText}`;

                const lines = [
                    recipientName ? `Hi ${recipientName},` : 'Hello,',
                    '',
                    `Please see our ${templateLabel.toLowerCase()} for ${propertyAddress || 'the property'} submitted by ${entityText}.`,
                ];

                if (includeTerms) {
                    lines.push(
                        '',
                        'Offer Summary',
                        `• Sender: ${senderName || 'FAST BRIDGE GROUP'}`,
                        `• Recipient: ${recipientName || recipientEmail || 'Listing Agent'}`,
                        `• Offer type: ${offerType}`,
                        `• Purchase price: ${purchasePrice}`,
                        `• Close of escrow: ${closeEscrowDays} days`,
                        `• Deposit (${depositMode}): ${depositAmount}`,
                        `• Appraisal: ${appraisal}`,
                        `• Inspection period: ${inspection}`,
                        `• Termite: ${termite}`,
                        `• Escrow: ${escrow}`,
                        `• Title company: ${titleCompany}`,
                        `• Additional terms: ${otherTerms}`,
                        `• Buyer: Fast Bridge Group, LLC`,
                        `• Signer: ${signerName}`,
                        sellerCompEnabled
                            ? `• Seller compensation: ${sellerCompPercent ? `${sellerCompPercent}%` : ''}${sellerCompPercent && sellerCompAmount ? ' | ' : ''}${sellerCompAmount ? `$${sellerCompAmount}` : ''}`
                            : '• Seller compensation: Not included'
                    );

                    lines.push(
                        '',
                        'Assignment / Contract Verbiage',
                        '“EMD to be fully refundable in the instance of seller/assignor non-performance including property not being delivered vacant, not having clear and marketable title, or not in similar condition as when this assignment was executed. Buyer will not assume any payoffs, liens, or assessments. Buyer to walk through on date of funding to verify occupancy status and condition. Any personal property remaining at the property at close of escrow is expressly abandoned by the seller and otherwise released to the buyer.”'
                    );
                }

                if (documents.linked.length > 0) {
                    lines.push('', 'Linked Documents');
                    documents.linked.forEach(item => {
                        lines.push(`• ${item.label}: ${item.url}`);
                    });
                }

                if (documents.uploads.length > 0) {
                    lines.push('', 'Files Prepared For Attachment');
                    documents.uploads.forEach(item => {
                        lines.push(`• ${item.fileName || item.label}`);
                    });
                    lines.push('Please manually attach the uploaded files from the Offer Documents section after the draft opens.');
                }

                lines.push('', 'Please confirm receipt and let me know if you need anything else.');

                return {
                    subject,
                    body: lines.join('\n')
                };
            }

            async function copyTextValue(value, successTitle) {
                if (!value.trim()) {
                    showDashboardToast('error', 'Nothing To Copy', 'Prepare the email first or enter text to copy.');
                    return;
                }

                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(value);
                    } else {
                        const helper = document.createElement('textarea');
                        helper.value = value;
                        helper.style.position = 'fixed';
                        helper.style.opacity = '0';
                        document.body.appendChild(helper);
                        helper.focus();
                        helper.select();
                        document.execCommand('copy');
                        helper.remove();
                    }
                    showDashboardToast('success', successTitle, 'Copied to clipboard.');
                } catch (error) {
                    showDashboardToast('error', 'Copy Failed', 'Unable to copy in this browser.');
                }
            }

            function openEmailDraft() {
                const recipientEmail = recipientEmailInput.value.trim();
                const subject = subjectInput.value.trim();
                const body = getBodyValue();
                const senderEmail = senderEmailInput.value.trim();

                if (!recipientEmail) {
                    showDashboardToast('error', 'Recipient Required', 'Add the recipient email before opening the draft.');
                    return;
                }

                if (!senderEmail) {
                    showDashboardToast('error', 'Sender Email Required', 'Set the sender email in the prep form first.');
                    return;
                }

                const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoUrl;
                showDashboardToast('success', 'Draft Opened', 'Your default email app was opened with the prepared draft.');
            }

            function syncOpenButtonLabel() {
                openButton.textContent = sendModeSelect.value === 'copy' ? 'Copy Email Draft' : 'Open Email Draft';
            }

            const senderProfile = getSenderProfile();
            let userECardPath = '';
            senderNameInput.value = senderProfile.name;
            senderEmailInput.value = senderProfile.email;
            recipientNameInput.value = String(savedDraft.recipientName || agentRecord.name || '').trim();
            recipientEmailInput.value = String(savedDraft.recipientEmail || agentRecord.email || '').trim();
            setSubjectValue(String(savedDraft.subject || '').trim(), { userEdited: Boolean(savedDraft.subjectEdited) });
            includeTermsToggle.checked = Boolean(savedDraft.includeTerms);
            setBodyValue(savedDraft.body || '', { userEdited: Boolean(savedDraft.bodyEdited) });
            sendModeSelect.value = savedDraft.sendMode || 'mailto';
            loadAvailableECardOptions(String(savedDraft.ecard || '').trim()).finally(() => {
                userECardPath = getUserECardJpgPath();
                if (userECardPath) {
                    ensureECardOption(userECardPath);
                    if (!getSelectedECardPath() && isAllowedECardPath(String(savedDraft.ecard || '').trim())) {
                        ecardSelect.value = String(savedDraft.ecard || '').trim();
                    }
                }
            });
            if (ecardToggle) {
                ecardToggle.checked = false;
            }
            syncOpenButtonLabel();
            populateInvestorAttachmentOptions(savedDraft.investorAttachmentFolder || '');
            loadInvestorAttachmentPackages().finally(renderDocumentSummary);

            fillOptions(categorySelect, Object.keys(OFFER_EMAIL_LIBRARY).map(value => ({
                value,
                label: OFFER_EMAIL_LIBRARY[value].label
            })), 'Select Category');

            const initialCategory = savedDraft.category || 'initial-offer';
            categorySelect.value = OFFER_EMAIL_LIBRARY[initialCategory] ? initialCategory : 'initial-offer';
            syncSubcategories(savedDraft.subcategory || getOfferFieldValue('offer-type') || 'general');

            if (!savedDraft.template) {
                syncTemplates('');
            }

            categorySelect.addEventListener('change', () => {
                syncSubcategories(getOfferFieldValue('offer-type') || 'general');
                saveDraft();
            });

            subcategorySelect.addEventListener('change', () => {
                syncTemplates('');
                saveDraft();
            });

            templateSelect.addEventListener('change', saveDraft);
            investorAttachmentsSelect.addEventListener('change', () => {
                renderDocumentSummary();
                saveDraft();
            });
            sendModeSelect.addEventListener('change', () => {
                syncOpenButtonLabel();
                saveDraft();
            });
            ecardSelect.addEventListener('change', () => {
                refreshPreparedEmail();
                saveDraft();
            });
            if (ecardToggle) {
                ecardToggle.addEventListener('change', () => {
                    if (ecardToggle.checked) {
                        if (userECardPath) {
                            ensureECardOption(userECardPath);
                            ecardSelect.value = userECardPath;
                        } else {
                            showDashboardToast('info', 'Resolving E-Card', 'Your E-card will be resolved from the USERS folder when the email is sent.');
                        }
                    } else {
                        ecardSelect.value = '';
                    }

                    refreshPreparedEmail();
                    saveDraft();
                });
            }
            includeTermsToggle.addEventListener('change', () => {
                if (includeTermsToggle.checked) {
                    refreshPreparedEmail({ includeTerms: true });
                    showDashboardToast('success', 'Offer Terms Added', 'All offer terms were added to the email body.');
                } else {
                    setSubjectValue('');
                    setBodyValue('');
                }
                saveDraft();
            });

            [senderNameInput, senderEmailInput, recipientNameInput, recipientEmailInput].forEach(input => {
                input.addEventListener('input', saveDraft);
            });

            subjectInput.addEventListener('input', () => {
                subjectInput.dataset.userEdited = 'true';
                saveDraft();
            });

            bodyInput.addEventListener('input', () => {
                bodyInput.dataset.userEdited = 'true';
                saveDraft();
            });

            copySubjectButton.addEventListener('click', async () => {
                await copyTextValue(subjectInput.value, 'Subject Copied');
            });

            copyBodyButton.addEventListener('click', async () => {
                await copyTextValue(getBodyValue(), 'Email Body Copied');
            });

            sendAgentButton.addEventListener('click', async () => {
                const recipientName = recipientNameInput.value.trim();
                const recipientEmail = recipientEmailInput.value.trim();

                if (!recipientEmail) {
                    showDashboardToast('error', 'Recipient Email Required', 'Add the recipient email before sending.');
                    return;
                }
                saveDraft();

                const senderName = senderNameInput.value.trim();
                const senderEmail = senderEmailInput.value.trim();
                const subject = subjectInput.value.trim();
                const body = getBodyValue();

                if (!senderEmail) {
                    showDashboardToast('error', 'Sender Email Required', 'Set the sender email in the prep form first.');
                    return;
                }

                sendAgentButton.disabled = true;
                sendAgentButton.textContent = 'Sending...';

                try {
                    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
                    const attachments = await buildServerEmailAttachments();
                    const investorAttachmentPaths = getSelectedInvestorAttachmentPaths();
                    const resolvedECardPath = ecardToggle && ecardToggle.checked ? (getSelectedECardPath() || userECardPath || '') : '';
                    const response = await fetch('/api/send-agent-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                            fromName: senderName,
                            fromEmail: senderEmail,
                            toName: recipientName,
                            toEmail: recipientEmail,
                            subject,
                            body,
                            htmlBody: buildServerEmailHtml(),
                            includeECard: Boolean(ecardToggle && ecardToggle.checked),
                            ecardPath: resolvedECardPath,
                            ecardAttachmentName: resolvedECardPath ? getECardAttachmentName(resolvedECardPath) : '',
                            attachments,
                            investorAttachmentPaths
                        })
                    });
                    const rawResponse = await response.text();
                    let result = {};
                    try {
                        result = rawResponse ? JSON.parse(rawResponse) : {};
                    } catch (parseError) {
                        result = { error: rawResponse || 'Could not send email.' };
                    }
                    if (response.ok) {
                        showDashboardToast('success', 'Email Sent', `Offer email sent to ${recipientName || recipientEmail}.`);
                    } else {
                        showDashboardToast('error', 'Send Failed', result.error || 'Could not send email.');
                    }
                } catch (err) {
                    showDashboardToast('error', 'Send Failed', err && err.message ? err.message : 'Network error — check your server connection.');
                } finally {
                    sendAgentButton.disabled = false;
                    sendAgentButton.textContent = 'Send To Agent';
                }
            });

            openButton.addEventListener('click', async () => {
                saveDraft();

                if (sendModeSelect.value === 'copy') {
                    await copyTextValue(`${subjectInput.value.trim()}\n\n${getBodyValue()}`, 'Email Draft Copied');
                    return;
                }

                openEmailDraft();
            });

            window.addEventListener('offer-documents-updated', event => {
                if (!event.detail || event.detail.propertyKey === propertyKey) {
                    renderDocumentSummary();
                    saveDraft();
                }
            });

            // ── Toolbar wiring ────────────────────────────────────────────
            const toolbarEl = document.getElementById('offer-email-toolbar');
            const textColorInputEl = document.getElementById('offer-email-text-color');
            if (toolbarEl) {
                // B / I / U / Bullets / Clear — use mousedown to keep editor selection intact
                toolbarEl.querySelectorAll('[data-command]').forEach(function (btn) {
                    btn.addEventListener('mousedown', function (e) {
                        e.preventDefault();
                        document.execCommand(btn.dataset.command, false, null);
                        saveDraft();
                    });
                });
            }

            const fontFamilySelectEl = document.getElementById('offer-email-font-family');
            const fontSizeSelectEl = document.getElementById('offer-email-font-size');
            const fontSizePtMap = { '1': '8pt', '2': '10pt', '3': '12pt', '4': '14pt', '5': '18pt', '6': '24pt', '7': '36pt' };
            let savedBodySelectionRange = null;

            function captureBodySelectionRange() {
                const selection = window.getSelection ? window.getSelection() : null;
                if (!selection || selection.rangeCount === 0) {
                    return;
                }

                const range = selection.getRangeAt(0);
                if (bodyInput.contains(range.commonAncestorContainer)) {
                    savedBodySelectionRange = range.cloneRange();
                }
            }

            function restoreBodySelectionRange() {
                if (!savedBodySelectionRange || !window.getSelection) {
                    return false;
                }

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedBodySelectionRange);
                return true;
            }

            function applyBodyTextColor(color) {
                const normalizedColor = normalizeEmailTextColor(color);
                bodyInput.style.color = normalizedColor;

                if (typeof bodyInput.value === 'string') {
                    return;
                }

                bodyInput.focus();
                restoreBodySelectionRange();
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('foreColor', false, normalizedColor);
                captureBodySelectionRange();
            }

            ensureEmailGoogleFontsLoaded();
            populateEmailFontFamilyOptions(fontFamilySelectEl);

            if (fontFamilySelectEl) {
                const savedFF = normalizeEmailFontFamily(savedDraft.fontFamily || DEFAULT_EMAIL_FONT_FAMILY);
                fontFamilySelectEl.value = savedFF;
                bodyInput.style.fontFamily = savedFF;
                fontFamilySelectEl.addEventListener('change', function () {
                    bodyInput.style.fontFamily = getSelectedEmailFontFamily();
                    saveDraft();
                });
            }

            if (fontSizeSelectEl) {
                const savedFS = savedDraft.fontSize || '3';
                fontSizeSelectEl.value = savedFS;
                bodyInput.style.fontSize = fontSizePtMap[savedFS] || '12pt';
                fontSizeSelectEl.addEventListener('change', function () {
                    bodyInput.style.fontSize = fontSizePtMap[fontSizeSelectEl.value] || '12pt';
                    saveDraft();
                });
            }

            if (textColorInputEl) {
                const savedTextColor = normalizeEmailTextColor(savedDraft.textColor || DEFAULT_EMAIL_TEXT_COLOR);
                textColorInputEl.value = savedTextColor;
                bodyInput.style.color = savedTextColor;

                textColorInputEl.addEventListener('click', captureBodySelectionRange);
                textColorInputEl.addEventListener('input', function () {
                    applyBodyTextColor(textColorInputEl.value);
                    bodyInput.dataset.userEdited = 'true';
                    saveDraft();
                });
                textColorInputEl.addEventListener('change', function () {
                    applyBodyTextColor(textColorInputEl.value);
                    bodyInput.dataset.userEdited = 'true';
                    saveDraft();
                });
            }

            bodyInput.addEventListener('mouseup', captureBodySelectionRange);
            bodyInput.addEventListener('keyup', captureBodySelectionRange);
            bodyInput.addEventListener('focus', captureBodySelectionRange);

            renderDocumentSummary();

            saveDraft();

        }

        initOfferEmailPrep();

        function parseMoney(value) {
            if (typeof value === 'number') {
                return value;
            }
            const numeric = Number(String(value || '').replace(/[^0-9.-]/g, ''));
            return Number.isFinite(numeric) ? numeric : 0;
        }

        function asNumber(input, fallback = 0) {
            if (!input) return fallback;
            const value = parseMoney(input.value);
            return Number.isFinite(value) ? value : fallback;
        }

        function formatMoney(value, digits = 0) {
            const safe = Number.isFinite(value) ? value : 0;
            return '$' + safe.toLocaleString(undefined, {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits
            });
        }

        function formatPercent(value) {
            const safe = Number.isFinite(value) ? value : 0;
            return safe.toFixed(2) + '%';
        }

        function setText(id, text) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        }

        function initIaCalculator() {
            const root = document.getElementById('ia-calculator-root');
            if (!root) return;

            const arvInput = document.getElementById('ia-arv');
            const renovationInput = document.getElementById('ia-renovation-budget');
            const sellSidePercentInput = document.getElementById('ia-sell-side-percent');
            const offerPriceInput = document.getElementById('ia-offer-price-input');
            const targetPercentInput = document.getElementById('ia-target-profit-percent');
            const targetDollarInput = document.getElementById('ia-target-profit-dollar');
            const holdMonthsInput = document.getElementById('ia-hold-months');
            const financingModeInput = document.getElementById('ia-financing-mode');
            const costCapUsageEl = document.getElementById('ia-cost-cap-usage');
            const arvCapUsageEl = document.getElementById('ia-arv-cap-usage');
            const customCostCapInput = document.getElementById('ia-custom-cost-cap');
            const customArvMaxInput = document.getElementById('ia-custom-arv-max');
            const customCostCapLabel = document.getElementById('ia-custom-cost-cap-label');
            const customArvMaxLabel = document.getElementById('ia-custom-arv-max-label');
            const loanToArvInput = document.getElementById('ia-loan-to-arv');
            const interestRateInput = document.getElementById('ia-interest-rate');
            const originationPointsInput = document.getElementById('ia-origination-points');
            const lenderFeesInput = document.getElementById('ia-lender-fees');
            const calcButton = document.getElementById('ia-calc-btn');
            const strikeZonePctEl = document.getElementById('ia-strike-zone-pct');
            const strikeZoneAcqEl = document.getElementById('ia-strike-zone-acq');
            const strikeZoneAcqPctEl = document.getElementById('ia-strike-zone-acq-pct');
            const strikeZoneGapEl = document.getElementById('ia-strike-zone-gap');
            const strikeZoneAreaEl = document.getElementById('ia-strike-zone-area');
            const iaSummaryCopyBtn = document.getElementById('ia-summary-copy-btn');
            const cashNote = document.getElementById('ia-cash-note');
            const financingSection = document.getElementById('ia-financing-section');
            const financingSectionBody = document.getElementById('ia-financing-body');
            const financingToggleButton = document.getElementById('ia-financing-toggle');
            const financingToggleText = financingToggleButton ? financingToggleButton.querySelector('.ia-section-toggle-text') : null;
            const financingToggleIcon = financingToggleButton ? financingToggleButton.querySelector('.ia-section-toggle-icon') : null;

            const addOtherCostButton = document.getElementById('ia-add-other-cost');
            const otherCostNameInput = document.getElementById('ia-other-cost-name');
            const otherCostAmountInput = document.getElementById('ia-other-cost-amount');
            const otherCostList = document.getElementById('ia-other-cost-list');
            const invSummaryCopyBtn = document.getElementById('inv-summary-copy-btn');
            const invEscrowPctInput = document.getElementById('inv-escrow-pct');
            const invProratedPctInput = document.getElementById('inv-prorated-pct');
            const invConcessionsPctInput = document.getElementById('inv-concessions-pct');
            const invBuyerAgentPctInput = document.getElementById('inv-buyer-agent-pct');
            const invListingAgentPctInput = document.getElementById('inv-listing-agent-pct');
            const invPerDiemPctInput = document.getElementById('inv-per-diem-pct');
            const invAssetMgmtPctInput = document.getElementById('inv-asset-mgmt-pct');
            const invDueDiligenceInput = document.getElementById('inv-due-diligence');
            const invAcquisitionFeeInput = document.getElementById('inv-acquisition-fee');
            const invCashForKeysInput = document.getElementById('inv-cash-for-keys');

            const investorDefaults = {
                 invEscrowPct: '0',
                invProratedPct: '0',
                invConcessionsPct: '0',
                invBuyerAgentPct: '0',
                invListingAgentPct: '0',
                invPerDiemPct: '0',
                invAssetMgmtPct: '0',
                invDueDiligence: '0',
                invAcquisitionFee: '0',
                invCashForKeys: '0'
            };

            if (!arvInput || !renovationInput || !sellSidePercentInput || !offerPriceInput || !targetPercentInput || !targetDollarInput || !holdMonthsInput || !loanToArvInput || !interestRateInput || !originationPointsInput || !lenderFeesInput || !otherCostList || !financingModeInput || !customCostCapInput || !customArvMaxInput) {
                return;
            }

            arvInput.value = String(parseMoney(detailData.arv || 694592));

            const buySideRate = 0.006617;
            let otherCosts = [];
            let targetMode = 'dollar';
            let offerPriceMode = 'target';
            let financingHoldCollapsed = false;
            let iaSummaryMessage = '';
            let investorSummaryMessage = '';

            function sanitizeIaInvestorDefaults(defaults) {
                const nextDefaults = defaults && typeof defaults === 'object'
                    ? { ...defaults }
                    : {};

                nextDefaults.invEscrowPct = '0';
                nextDefaults.invBuyerAgentPct = '0';
                nextDefaults.invListingAgentPct = '0';

                return nextDefaults;
            }

            function sanitizeIaCalculatorState(state) {
                if (!state || typeof state !== 'object') {
                    return state;
                }

                const nextState = {
                    ...state,
                    investorDefaults: sanitizeIaInvestorDefaults(state.investorDefaults)
                };

                if (typeof nextState.sellSidePercent === 'string' && !nextState.sellSidePercent.trim()) {
                    nextState.sellSidePercent = null;
                }

                return nextState;
            }

            function getPersistedIaCalculatorState() {
                if (!propertyKey) {
                    return null;
                }

                const savedState = getUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key)
                    .find(item => String(item.propertyKey || '').trim().toLowerCase() === propertyKey) || null;

                return sanitizeIaCalculatorState(savedState);
            }

            function setPersistedIaCalculatorState(state) {
                if (!propertyKey || !state || typeof state !== 'object') {
                    return;
                }

                const sanitizedState = sanitizeIaCalculatorState(state);

                const items = getUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key)
                    .filter(item => String(item.propertyKey || '').trim().toLowerCase() !== propertyKey);

                const nextState = {
                    propertyKey,
                    propertyAddress,
                    updatedAt: Date.now(),
                    ...sanitizedState
                };

                setUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key, [...items, nextState]);
                detailData.iaCalculatorState = nextState;
                localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
            }

            function applyPersistedIaCalculatorState(state) {
                if (!state || typeof state !== 'object') {
                    return;
                }

                const sanitizedState = sanitizeIaCalculatorState(state);
                if (JSON.stringify(sanitizedState) !== JSON.stringify(state)) {
                    setPersistedIaCalculatorState(sanitizedState);
                }

                arvInput.value = String(sanitizedState.arv ?? arvInput.value ?? '');
                renovationInput.value = String(sanitizedState.renovation ?? renovationInput.value ?? '');
                sellSidePercentInput.value = String(sanitizedState.sellSidePercent ?? sellSidePercentInput.value ?? '');
                offerPriceInput.value = String(sanitizedState.offerPrice ?? offerPriceInput.value ?? '');
                targetPercentInput.value = String(sanitizedState.targetProfitPercent ?? targetPercentInput.value ?? '');
                targetDollarInput.value = String(sanitizedState.targetProfitDollar ?? targetDollarInput.value ?? '');
                holdMonthsInput.value = String(sanitizedState.holdMonths ?? holdMonthsInput.value ?? '');
                financingModeInput.value = String(sanitizedState.financingMode ?? financingModeInput.value ?? '100-100');
                customCostCapInput.value = String(sanitizedState.customCostCap ?? customCostCapInput.value ?? '100');
                customArvMaxInput.value = String(sanitizedState.customArvMax ?? customArvMaxInput.value ?? '80');
                loanToArvInput.value = String(sanitizedState.loanToArv ?? loanToArvInput.value ?? '');
                interestRateInput.value = String(sanitizedState.interestRate ?? interestRateInput.value ?? '');
                originationPointsInput.value = String(sanitizedState.originationPoints ?? originationPointsInput.value ?? '');
                lenderFeesInput.value = String(sanitizedState.lenderFees ?? lenderFeesInput.value ?? '');
                otherCosts = Array.isArray(sanitizedState.otherCosts)
                    ? sanitizedState.otherCosts
                        .map(item => ({
                            name: String(item && item.name ? item.name : 'Other Cost').trim() || 'Other Cost',
                            amount: Math.max(parseMoneyValue(item && item.amount), 0)
                        }))
                        .filter(item => item.amount > 0)
                    : [];

                const savedInvestorDefaults = sanitizedState.investorDefaults && typeof sanitizedState.investorDefaults === 'object'
                    ? sanitizedState.investorDefaults
                    : null;
                if (savedInvestorDefaults) {
                    investorDefaults.invEscrowPct = '0';
                    investorDefaults.invProratedPct = String(savedInvestorDefaults.invProratedPct ?? investorDefaults.invProratedPct);
                    investorDefaults.invConcessionsPct = String(savedInvestorDefaults.invConcessionsPct ?? investorDefaults.invConcessionsPct);
                    investorDefaults.invBuyerAgentPct = '0';
                    investorDefaults.invListingAgentPct = '0';
                    investorDefaults.invPerDiemPct = String(savedInvestorDefaults.invPerDiemPct ?? investorDefaults.invPerDiemPct);
                    investorDefaults.invAssetMgmtPct = String(savedInvestorDefaults.invAssetMgmtPct ?? investorDefaults.invAssetMgmtPct);
                    investorDefaults.invDueDiligence = String(savedInvestorDefaults.invDueDiligence ?? investorDefaults.invDueDiligence);
                    investorDefaults.invAcquisitionFee = String(savedInvestorDefaults.invAcquisitionFee ?? investorDefaults.invAcquisitionFee);
                    investorDefaults.invCashForKeys = String(savedInvestorDefaults.invCashForKeys ?? investorDefaults.invCashForKeys);
                }

                if (invEscrowPctInput) invEscrowPctInput.value = investorDefaults.invEscrowPct;
                if (invProratedPctInput) invProratedPctInput.value = investorDefaults.invProratedPct;
                if (invConcessionsPctInput) invConcessionsPctInput.value = investorDefaults.invConcessionsPct;
                if (invBuyerAgentPctInput) invBuyerAgentPctInput.value = investorDefaults.invBuyerAgentPct;
                if (invListingAgentPctInput) invListingAgentPctInput.value = investorDefaults.invListingAgentPct;
                if (invPerDiemPctInput) invPerDiemPctInput.value = investorDefaults.invPerDiemPct;
                if (invAssetMgmtPctInput) invAssetMgmtPctInput.value = investorDefaults.invAssetMgmtPct;
                if (invDueDiligenceInput) invDueDiligenceInput.value = investorDefaults.invDueDiligence;
                if (invAcquisitionFeeInput) invAcquisitionFeeInput.value = investorDefaults.invAcquisitionFee;
                if (invCashForKeysInput) invCashForKeysInput.value = investorDefaults.invCashForKeys;

                targetMode = state.targetMode === 'percent' ? 'percent' : 'dollar';
                offerPriceMode = state.offerPriceMode === 'manual' ? 'manual' : 'target';
                financingHoldCollapsed = Boolean(state.financingHoldCollapsed);
            }

            function buildIaCalculatorState() {
                syncInvestorDefaultsFromInputs();

                return {
                    arv: arvInput.value,
                    renovation: renovationInput.value,
                    sellSidePercent: sellSidePercentInput.value,
                    offerPrice: offerPriceInput.value,
                    targetProfitPercent: targetPercentInput.value,
                    targetProfitDollar: targetDollarInput.value,
                    holdMonths: holdMonthsInput.value,
                    financingMode: financingModeInput.value,
                    customCostCap: customCostCapInput.value,
                    customArvMax: customArvMaxInput.value,
                    loanToArv: loanToArvInput.value,
                    interestRate: interestRateInput.value,
                    originationPoints: originationPointsInput.value,
                    lenderFees: lenderFeesInput.value,
                    otherCosts: otherCosts.map(item => ({
                        name: String(item.name || 'Other Cost').trim() || 'Other Cost',
                        amount: Math.max(parseMoneyValue(item.amount), 0)
                    })),
                    investorDefaults: sanitizeIaInvestorDefaults(investorDefaults),
                    targetMode,
                    offerPriceMode,
                    financingHoldCollapsed
                };
            }

            function setFinancingSectionCollapsed(collapsed, options = {}) {
                financingHoldCollapsed = !!collapsed;

                if (financingSection) {
                    financingSection.classList.toggle('is-collapsed', financingHoldCollapsed);
                }

                if (financingSectionBody) {
                    financingSectionBody.hidden = financingHoldCollapsed;
                }

                if (financingToggleButton) {
                    financingToggleButton.setAttribute('aria-expanded', String(!financingHoldCollapsed));
                }

                if (financingToggleText) {
                    financingToggleText.textContent = financingHoldCollapsed ? 'Open' : 'Minimize';
                }

                if (financingToggleIcon) {
                    financingToggleIcon.textContent = financingHoldCollapsed ? '+' : '-';
                }

                if (!options.skipPersist) {
                    setPersistedIaCalculatorState(buildIaCalculatorState());
                }
            }

            function formatNumericInputValue(input, options = {}) {
                if (!input) return;
                const allowNegative = !!options.allowNegative;
                const rawValue = String(input.value || '');
                const cleaned = rawValue.replace(/,/g, '').replace(/[^0-9.]/g, '');
                const isNegative = allowNegative && rawValue.trim().startsWith('-');
                if (!cleaned) {
                    input.value = isNegative ? '-' : '';
                    return;
                }

                if (cleaned === '.') {
                    input.value = isNegative ? '-0.' : '0.';
                    return;
                }

                const hasDot = cleaned.includes('.');
                const parts = cleaned.split('.');
                const integerPartRaw = parts[0] || '0';
                const decimalPartRaw = parts[1] || '';
                const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
                const formattedInteger = Number(integerPart).toLocaleString('en-US');
                const formattedValue = hasDot ? `${formattedInteger}.${decimalPartRaw}` : formattedInteger;
                input.value = isNegative ? `-${formattedValue}` : formattedValue;
            }

            function formatPercentSuffixInputValue(input, options = {}) {
                if (!input) return;

                const allowNegative = !!options.allowNegative;
                const rawValue = String(input.value || '');
                const cleaned = rawValue.replace(/,/g, '').replace(/[^0-9.]/g, '');
                const isNegative = allowNegative && rawValue.trim().startsWith('-');

                if (!cleaned) {
                    input.value = isNegative ? '-%' : '%';
                    return;
                }

                if (cleaned === '.') {
                    input.value = isNegative ? '-0.%' : '0.%';
                    return;
                }

                const hasDot = cleaned.includes('.');
                const parts = cleaned.split('.');
                const integerPartRaw = parts[0] || '0';
                const decimalPartRaw = parts[1] || '';
                const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
                const formattedInteger = Number(integerPart).toLocaleString('en-US');
                const formattedValue = hasDot ? `${formattedInteger}.${decimalPartRaw}` : formattedInteger;
                input.value = `${isNegative ? '-' : ''}${formattedValue}%`;
            }

            function formatCurrencyPrefixInputValue(input, options = {}) {
                if (!input) return;

                const allowNegative = !!options.allowNegative;
                const rawValue = String(input.value || '');
                const cleaned = rawValue.replace(/,/g, '').replace(/[^0-9.]/g, '');
                const isNegative = allowNegative && rawValue.trim().startsWith('-');

                if (!cleaned) {
                    input.value = isNegative ? '-$' : '$';
                    return;
                }

                if (cleaned === '.') {
                    input.value = isNegative ? '-$0.' : '$0.';
                    return;
                }

                const hasDot = cleaned.includes('.');
                const parts = cleaned.split('.');
                const integerPartRaw = parts[0] || '0';
                const decimalPartRaw = parts[1] || '';
                const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
                const formattedInteger = Number(integerPart).toLocaleString('en-US');
                const formattedValue = hasDot ? `${formattedInteger}.${decimalPartRaw}` : formattedInteger;
                input.value = `${isNegative ? '-$' : '$'}${formattedValue}`;
            }

            function placePercentSuffixCaret(input) {
                if (!input || typeof input.setSelectionRange !== 'function') {
                    return;
                }

                const value = String(input.value || '');
                const suffixIndex = value.endsWith('%') ? value.length - 1 : value.length;
                window.requestAnimationFrame(() => {
                    input.setSelectionRange(suffixIndex, suffixIndex);
                });
            }

            function placeCurrencyPrefixCaret(input) {
                if (!input || typeof input.setSelectionRange !== 'function') {
                    return;
                }

                const value = String(input.value || '');
                const prefixLength = value.startsWith('-$') ? 2 : value.startsWith('$') ? 1 : 0;
                const selectionStart = typeof input.selectionStart === 'number' ? input.selectionStart : prefixLength;
                const nextCaret = Math.max(selectionStart, prefixLength);

                window.requestAnimationFrame(() => {
                    input.setSelectionRange(nextCaret, nextCaret);
                });
            }

            function formatIaNumericInputs() {
                [
                    arvInput,
                    renovationInput,
                    offerPriceInput,
                    sellSidePercentInput,
                    holdMonthsInput,
                    customCostCapInput,
                    customArvMaxInput,
                    loanToArvInput,
                    interestRateInput,
                    originationPointsInput,
                    lenderFeesInput,
                    otherCostAmountInput
                ].forEach(formatNumericInputValue);

                formatPercentSuffixInputValue(targetPercentInput, { allowNegative: true });
                formatCurrencyPrefixInputValue(targetDollarInput, { allowNegative: true });
            }

            function syncInvestorDefaultsFromInputs() {
                 investorDefaults.invEscrowPct = '0';
                 if (invEscrowPctInput) invEscrowPctInput.value = '0';
                if (invProratedPctInput) investorDefaults.invProratedPct = String(invProratedPctInput.value || investorDefaults.invProratedPct);
                if (invConcessionsPctInput) investorDefaults.invConcessionsPct = String(invConcessionsPctInput.value || investorDefaults.invConcessionsPct);
                investorDefaults.invBuyerAgentPct = '0';
                investorDefaults.invListingAgentPct = '0';
                if (invBuyerAgentPctInput) invBuyerAgentPctInput.value = '0';
                if (invListingAgentPctInput) invListingAgentPctInput.value = '0';
                if (invPerDiemPctInput) investorDefaults.invPerDiemPct = String(invPerDiemPctInput.value || investorDefaults.invPerDiemPct);
                if (invAssetMgmtPctInput) investorDefaults.invAssetMgmtPct = String(invAssetMgmtPctInput.value || investorDefaults.invAssetMgmtPct);
                if (invDueDiligenceInput) investorDefaults.invDueDiligence = String(invDueDiligenceInput.value || investorDefaults.invDueDiligence);
                if (invAcquisitionFeeInput) investorDefaults.invAcquisitionFee = String(invAcquisitionFeeInput.value || investorDefaults.invAcquisitionFee);
                if (invCashForKeysInput) investorDefaults.invCashForKeys = String(invCashForKeysInput.value || investorDefaults.invCashForKeys);
            }

            function getFinancingModeAssumptions(mode) {
                if (mode === '90-100') {
                    return {
                        loanToArv: '75',
                        originationPoints: '1',
                        interestRate: '10',
                        lenderFees: '999',
                        holdMonths: '4',
                        costAdvanceRate: 0.9,
                        arvAdvanceRate: 0.75
                    };
                }

                if (mode === '100-100') {
                    return {
                        loanToArv: '80',
                        originationPoints: '1.5',
                        interestRate: '10.44',
                        lenderFees: '999',
                        holdMonths: '4',
                        costAdvanceRate: 1,
                        arvAdvanceRate: 0.8
                    };
                }

                if (mode === '100-95-13-excel-ia') {
                    return {
                        loanToArv: '95.13',
                        originationPoints: '1.5',
                        interestRate: '10.44',
                        lenderFees: '999',
                        holdMonths: '4',
                        costAdvanceRate: 1,
                        arvAdvanceRate: 0.9513
                    };
                }

                if (mode === 'cash') {
                    return {
                        loanToArv: '0',
                        originationPoints: '0',
                        interestRate: '0',
                        lenderFees: '0',
                        holdMonths: '0',
                        costAdvanceRate: 0,
                        arvAdvanceRate: 0
                    };
                }

                if (mode === 'custom') {
                    return {
                        costAdvanceRate: Math.max(asNumber(customCostCapInput, 0), 0) / 100,
                        arvAdvanceRate: Math.max(asNumber(customArvMaxInput, 0), 0) / 100
                    };
                }

                return null;
            }

            function syncCustomFinancingVisibility(mode) {
                const isCustom = mode === 'custom';
                const isCash = mode === 'cash';

                if (customCostCapLabel) {
                    customCostCapLabel.hidden = !isCustom;
                }
                if (customArvMaxLabel) {
                    customArvMaxLabel.hidden = !isCustom;
                }

                customCostCapInput.disabled = !isCustom || isCash;
                customArvMaxInput.disabled = !isCustom || isCash;
            }

            function applyFinancingModeDefaults(mode, options = {}) {
                const preserveValues = !!options.preserveValues;
                const assumptions = getFinancingModeAssumptions(mode);

                if (!preserveValues) {
                    if (assumptions) {
                        loanToArvInput.value = assumptions.loanToArv;
                        originationPointsInput.value = assumptions.originationPoints;
                        interestRateInput.value = assumptions.interestRate;
                        lenderFeesInput.value = assumptions.lenderFees;
                        holdMonthsInput.value = assumptions.holdMonths;
                    } else if (mode === 'custom') {
                        // Keep current values for fully manual underwriting.
                    }
                }

                const isCash = mode === 'cash';
                loanToArvInput.disabled = isCash;
                originationPointsInput.disabled = isCash;
                interestRateInput.disabled = isCash;
                lenderFeesInput.disabled = isCash;
                holdMonthsInput.disabled = isCash;
                syncCustomFinancingVisibility(mode);
                if (cashNote) {
                    cashNote.hidden = !isCash;
                }

                formatIaNumericInputs();
            }

            function renderOtherCosts() {
                otherCostList.innerHTML = '';
                otherCosts.forEach((item, index) => {
                    const row = document.createElement('li');
                    row.className = 'ia-other-item';
                    row.innerHTML = `<span>${item.name}: ${formatMoney(item.amount)}</span>`;

                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.textContent = 'Remove';
                    remove.addEventListener('click', () => {
                        otherCosts = otherCosts.filter((_, itemIndex) => itemIndex !== index);
                        renderOtherCosts();
                        recalculate();
                    });

                    row.appendChild(remove);
                    otherCostList.appendChild(row);
                });
            }

            function otherCostsTotal() {
                return otherCosts.reduce((sum, item) => sum + item.amount, 0);
            }

            function applyOtherCostPreset() {
                if (!otherCostNameInput || !otherCostAmountInput) {
                    return;
                }

                const normalizedName = String(otherCostNameInput.value || '').trim().toLowerCase();
                if (normalizedName === 'whole sale' || normalizedName === 'wholesale') {
                    otherCostAmountInput.value = '15000';
                    formatNumericInputValue(otherCostAmountInput);
                } else if (normalizedName === 'cash for keys') {
                    otherCostAmountInput.value = '10000';
                    formatNumericInputValue(otherCostAmountInput);
                }
            }

            async function updateStrikeZoneReadout() {
                if (!strikeZonePctEl || !strikeZoneAreaEl) {
                    return;
                }

                const propertyCity = extractCityFromPropertyAddress(propertyAddress) || String(detailData.city || '').trim();
                const propertyCounty = String(detailData.county || '').trim();
                if (!propertyAddress && !propertyCity && !propertyCounty) {
                    strikeZonePctEl.textContent = 'NA';
                    if (strikeZoneGapEl) strikeZoneGapEl.textContent = 'Gap to strike zone: NA';
                    strikeZoneAreaEl.textContent = 'Area: NA';
                    recalculate();
                    return;
                }

                const rules = await loadStrikeZoneRules();
                const match = findStrikeZoneRuleForProperty(rules, propertyAddress || detailData.address || '', propertyCity, propertyCounty);

                if (!match || match.isPass || !match.pct || String(match.pct).toUpperCase() === 'NA') {
                    strikeZonePctEl.textContent = 'NA';
                    if (strikeZoneGapEl) strikeZoneGapEl.textContent = 'Gap to strike zone: NA';
                    strikeZoneAreaEl.textContent = 'Area: NA';
                    recalculate();
                    return;
                }

                strikeZonePctEl.textContent = match.pct;
                strikeZoneAreaEl.textContent = `Area: ${match.area}${match.county ? `, ${match.county}` : ''}`;
                recalculate();
            }

            function recalculate() {
                syncInvestorDefaultsFromInputs();

                const rawArv = Math.max(asNumber(arvInput, 0), 1);
                const renovation = Math.max(asNumber(renovationInput, 0), 0);
                const sellSidePct = Math.max(asNumber(sellSidePercentInput, 0), 0);
                const holdMonths = Math.max(asNumber(holdMonthsInput, 0), 0);
                const loanToArvPct = Math.max(asNumber(loanToArvInput, 0), 0);
                const interestRatePct = Math.max(asNumber(interestRateInput, 0), 0);
                const pointsPct = Math.max(asNumber(originationPointsInput, 0), 0);
                const lenderFees = Math.max(asNumber(lenderFeesInput, 0), 0);
                const invEscrowPct = 0;
                const invProratedPct = Math.max(parseMoneyValue(investorDefaults.invProratedPct), 0);
                const invConcessionsPct = Math.max(parseMoneyValue(investorDefaults.invConcessionsPct), 0);
                const invBuyerAgentPct = 0;
                const invListingAgentPct = 0;
                const invPerDiemPct = Math.max(parseMoneyValue(investorDefaults.invPerDiemPct), 0);
                const invAssetMgmtPct = Math.max(parseMoneyValue(investorDefaults.invAssetMgmtPct), 0);
                const invDueDiligence = Math.max(parseMoneyValue(investorDefaults.invDueDiligence), 0);
                const invAcquisitionFee = Math.max(parseMoneyValue(investorDefaults.invAcquisitionFee), 0);
                const invCashForKeys = Math.max(parseMoneyValue(investorDefaults.invCashForKeys), 0);
                const financingMode = financingModeInput.value || '100-100';

                const extraCosts = otherCostsTotal();
                const estimatedSalesPrice = rawArv;
                const arvBasis = Math.max(estimatedSalesPrice, 1);
                const sellSideCost = estimatedSalesPrice * (sellSidePct / 100);
                const invEscrowAmount = estimatedSalesPrice * (invEscrowPct / 100);
                const invProratedAmount = estimatedSalesPrice * (invProratedPct / 100);
                const invConcessionsAmount = estimatedSalesPrice * (invConcessionsPct / 100);
                const invBuyerAgentAmount = estimatedSalesPrice * (invBuyerAgentPct / 100);
                const invListingAgentAmount = estimatedSalesPrice * (invListingAgentPct / 100);
                const invPerDiemAmount = estimatedSalesPrice * (invPerDiemPct / 100);
                const invAssetMgmtAmount = estimatedSalesPrice * (invAssetMgmtPct / 100);
                const grossSaleAdjustmentTotal = invEscrowAmount
                    + invProratedAmount
                    + invConcessionsAmount
                    + invBuyerAgentAmount
                    + invListingAgentAmount
                    + invPerDiemAmount
                    + invAssetMgmtAmount;
                const grossPurchaseAdjustmentTotal = invDueDiligence + invAcquisitionFee + invCashForKeys;
                const grossScopeAdjustmentTotal = grossSaleAdjustmentTotal + grossPurchaseAdjustmentTotal;

                let targetProfitDollar = asNumber(targetDollarInput, 0);
                let targetProfitPercent = asNumber(targetPercentInput, 0);
                function estimateFinancing(offerCandidate) {
                    const safeOfferCandidate = Math.max(Number(offerCandidate) || 0, 0);
                    const buySideCostCandidate = safeOfferCandidate * buySideRate;
                    const financingAssumptions = getFinancingModeAssumptions(financingMode);
                    const loanArvCapAmount = rawArv * (loanToArvPct / 100);
                    const loanCostBase = safeOfferCandidate + renovation;
                    let loanAmountCandidate = financingMode === 'cash' ? 0 : loanArvCapAmount;

                    if (financingAssumptions) {
                        const assumedArvCapAmount = rawArv * financingAssumptions.arvAdvanceRate;
                        const assumedCostCapAmount = loanCostBase * financingAssumptions.costAdvanceRate;
                        loanAmountCandidate = Math.min(loanArvCapAmount, assumedArvCapAmount, assumedCostCapAmount);
                    }

                    const originationAmountCandidate = financingMode === 'cash' ? 0 : loanAmountCandidate * (pointsPct / 100);
                    const interestCostCandidate = financingMode === 'cash' ? 0 : loanAmountCandidate * (interestRatePct / 100) * (holdMonths / 12);
                    const totalFinancingCostCandidate = financingMode === 'cash' ? 0 : (originationAmountCandidate + interestCostCandidate);
                    const baselineForTargetCandidate = safeOfferCandidate + buySideCostCandidate + renovation + grossScopeAdjustmentTotal + totalFinancingCostCandidate;

                    return {
                        buySideCost: buySideCostCandidate,
                        loanAmount: loanAmountCandidate,
                        originationAmount: originationAmountCandidate,
                        interestCost: interestCostCandidate,
                        totalFinancingCost: totalFinancingCostCandidate,
                        baselineForTarget: baselineForTargetCandidate
                    };
                }

                let offerPrice = offerPriceMode === 'manual'
                    ? Math.max(asNumber(offerPriceInput, 0), 0)
                    : Math.max(estimatedSalesPrice - sellSideCost - grossScopeAdjustmentTotal - renovation - extraCosts - targetProfitDollar, 0);
                let buySideCost = 0;
                let loanAmount = 0;
                let originationAmount = 0;
                let interestCost = 0;
                let totalFinancingCost = 0;

                for (let index = 0; index < 4; index += 1) {
                    const estimate = estimateFinancing(offerPrice);
                    buySideCost = estimate.buySideCost;
                    loanAmount = estimate.loanAmount;
                    originationAmount = estimate.originationAmount;
                    interestCost = estimate.interestCost;
                    totalFinancingCost = estimate.totalFinancingCost;

                    if (targetMode === 'percent') {
                        targetProfitDollar = estimate.baselineForTarget * (targetProfitPercent / 100);
                    } else {
                        targetProfitPercent = estimate.baselineForTarget > 0 ? (targetProfitDollar / estimate.baselineForTarget) * 100 : 0;
                    }

                    if (offerPriceMode !== 'manual') {
                        offerPrice = Math.max(
                            estimatedSalesPrice
                            - sellSideCost
                            - targetProfitDollar
                            - grossScopeAdjustmentTotal
                            - renovation
                            - buySideCost
                            - extraCosts
                            - totalFinancingCost,
                            0
                        );
                    }
                }

                const finalEstimate = estimateFinancing(offerPrice);
                buySideCost = finalEstimate.buySideCost;
                loanAmount = finalEstimate.loanAmount;
                originationAmount = finalEstimate.originationAmount;
                interestCost = finalEstimate.interestCost;
                totalFinancingCost = finalEstimate.totalFinancingCost;

                if (targetMode === 'percent') {
                    targetProfitDollar = finalEstimate.baselineForTarget * (targetProfitPercent / 100);
                    targetDollarInput.value = targetProfitDollar.toFixed(0);
                    formatCurrencyPrefixInputValue(targetDollarInput, { allowNegative: true });
                } else {
                    targetProfitPercent = finalEstimate.baselineForTarget > 0 ? (targetProfitDollar / finalEstimate.baselineForTarget) * 100 : 0;
                    targetPercentInput.value = targetProfitPercent.toFixed(2);
                    formatPercentSuffixInputValue(targetPercentInput, { allowNegative: true });
                }

                if (offerPriceMode === 'manual') {
                    formatNumericInputValue(offerPriceInput);
                } else {
                    offerPriceInput.value = offerPrice.toFixed(0);
                    formatNumericInputValue(offerPriceInput);
                }

                const totalPurchaseCost = offerPrice + buySideCost + grossPurchaseAdjustmentTotal + extraCosts;
                const totalProjectCost = totalPurchaseCost + renovation;
                const totalProjectWithFinancing = totalProjectCost + totalFinancingCost;
                const leveragedProfit = estimatedSalesPrice - sellSideCost - grossSaleAdjustmentTotal - totalProjectWithFinancing;
                const financingAssumptions = getFinancingModeAssumptions(financingMode);
                const loanCostBase = offerPrice + renovation;
                const programCostCapAmount = financingAssumptions ? loanCostBase * financingAssumptions.costAdvanceRate : 0;
                const programArvCapAmount = financingAssumptions ? rawArv * financingAssumptions.arvAdvanceRate : rawArv * (loanToArvPct / 100);

                const grossProfitToSeller = estimatedSalesPrice - sellSideCost - grossSaleAdjustmentTotal;

                const invTotalAcquisition = totalPurchaseCost;
                const invHardMoneyCosts = totalFinancingCost;
                const invMiscLessInterest = 0;
                const invTotalDevelopmentCost = totalProjectWithFinancing;
                const invTotalPurchaseCosts = totalPurchaseCost;
                const invCashRequiredToClose = Math.max(invTotalPurchaseCosts + renovation + originationAmount - loanAmount, 0);
                const invTotalCashInvestment = invCashRequiredToClose + interestCost;
                const invShortFundsToEscrow = invCashRequiredToClose;

                const invNetProfit = grossProfitToSeller - invTotalDevelopmentCost;
                const invCashProfit = invNetProfit + invHardMoneyCosts;

                function updateStrikeZoneGapState(state) {
                    if (!strikeZoneGapEl) {
                        return;
                    }

                    strikeZoneGapEl.classList.remove('is-under', 'is-over', 'is-na');
                    strikeZoneGapEl.classList.add(state);
                }

                setText('ia-buy-side-cost', formatMoney(buySideCost));
                setText('ia-buy-side-cost-arv', formatPercent((buySideCost / arvBasis) * 100));
                setText('ia-reno-arv', formatPercent((renovation / arvBasis) * 100));
                setText('ia-sell-side-amount', formatMoney(sellSideCost));
                setText('ia-offer-price-arv', formatPercent((offerPrice / arvBasis) * 100));

                setText('ia-total-acquisition', formatMoney(totalPurchaseCost));
                setText('ia-total-acquisition-arv', formatPercent((totalPurchaseCost / arvBasis) * 100));
                setText('ia-summary-acq', `${formatMoney(totalPurchaseCost)} (${formatPercent((totalPurchaseCost / arvBasis) * 100)} ARV)`);
                setText('ia-summary-project', `${formatMoney(totalProjectCost)} (${formatPercent((totalProjectCost / arvBasis) * 100)} ARV)`);
                setText('ia-summary-project-fin', `${formatMoney(totalProjectWithFinancing)} (${formatPercent((totalProjectWithFinancing / arvBasis) * 100)} ARV)`);

                const acquisitionPctOfArv = (totalPurchaseCost / arvBasis) * 100;
                const strikeZonePct = parseMoneyValue(strikeZonePctEl ? strikeZonePctEl.textContent : '');
                setText('ia-strike-zone-acq', formatMoney(totalPurchaseCost));
                setText('ia-strike-zone-acq-pct', formatPercent(acquisitionPctOfArv));
                if (strikeZoneGapEl) {
                    if (strikeZonePct > 0) {
                        const strikeZoneGap = strikeZonePct - acquisitionPctOfArv;
                        updateStrikeZoneGapState(strikeZoneGap >= 0 ? 'is-under' : 'is-over');
                        strikeZoneGapEl.textContent = strikeZoneGap >= 0
                            ? `Gap to strike zone: ${formatPercent(strikeZoneGap)} under max`
                            : `Gap to strike zone: ${formatPercent(Math.abs(strikeZoneGap))} over max`;
                    } else {
                        updateStrikeZoneGapState('is-na');
                        strikeZoneGapEl.textContent = 'Gap to strike zone: NA';
                    }
                }

                setText('ia-other-cost-total', formatMoney(extraCosts));
                setText('ia-loan-amount', formatMoney(loanAmount));
                setText(
                    'ia-cost-cap-usage',
                    programCostCapAmount > 0
                        ? formatPercent((loanAmount / programCostCapAmount) * 100)
                        : 'NA'
                );
                setText(
                    'ia-arv-cap-usage',
                    programArvCapAmount > 0
                        ? formatPercent((loanAmount / programArvCapAmount) * 100)
                        : 'NA'
                );
                setText('ia-origination-amount', formatMoney(originationAmount, 1));
                setText('ia-interest-cost', formatMoney(interestCost));
                setText('ia-total-financing', formatMoney(totalFinancingCost));
                setText('ia-cash-required-close', formatMoney(invCashRequiredToClose));
                setText('ia-total-cash-investment', formatMoney(invTotalCashInvestment));

                iaSummaryMessage = [
                    'IA Calculator Snapshot',
                    '-',
                    `ARV: ${formatMoney(rawArv)}`,
                    `Financing Program: ${financingModeInput.selectedOptions && financingModeInput.selectedOptions[0] ? financingModeInput.selectedOptions[0].textContent.trim() : financingMode}`,
                    `Hold Time: ${holdMonths} month${holdMonths === 1 ? '' : 's'}`,
                    `Renovation Budget: ${formatMoney(renovation)}`,
                    `Buy-Side Closing Costs: ${formatMoney(buySideCost)}`,
                    `Sell-Side Closing Amount: ${formatMoney(sellSideCost)} (${formatPercent(sellSidePct)})`,
                    `Other Cost Total: ${formatMoney(extraCosts)}`,
                    `Gross Profit Adjustments: ${formatMoney(grossScopeAdjustmentTotal)}`,
                    '-',
                    `Offer Price: ${formatMoney(offerPrice)}`,
                    '-',
                    `Total Purchase Cost: ${formatMoney(totalPurchaseCost)} (${formatPercent((totalPurchaseCost / arvBasis) * 100)} ARV)`,
                    `Total Project Cost: ${formatMoney(totalProjectCost)} (${formatPercent((totalProjectCost / arvBasis) * 100)} ARV)`,
                    `Total Project Cost w/ Financing: ${formatMoney(totalProjectWithFinancing)} (${formatPercent((totalProjectWithFinancing / arvBasis) * 100)} ARV)`,
                    `Cash Required To Close: ${formatMoney(invCashRequiredToClose)}`,
                    `Cash In w/ Payments: ${formatMoney(invTotalCashInvestment)}`,
                    `Gross Profit To Seller: ${formatMoney(grossProfitToSeller)}`,
                    '-',
                    'Net Profits',
                    `Net Profit: ${formatMoney(invNetProfit)}`,
                    `Net Profit %: ${formatPercent((invNetProfit / arvBasis) * 100)}`,
                    `Cash Profit: ${formatMoney(invCashProfit)}`,
                    `Cash Profit %: ${formatPercent((invCashProfit / arvBasis) * 100)}`,
                    '-',
                    `Hard Money Costs: ${formatMoney(totalFinancingCost)}`,
                    `Interest Carry: ${formatMoney(interestCost)}`,
                    `Leveraged Profit: ${formatMoney(leveragedProfit)}`
                ].join('\n');

                setText('inv-net-profit', formatMoney(invNetProfit));
                setText('inv-net-profit-pct', formatPercent((invNetProfit / arvBasis) * 100));
                setText('inv-cash-profit', formatMoney(invCashProfit));
                setText('inv-cash-profit-pct', formatPercent((invCashProfit / arvBasis) * 100));

                investorSummaryMessage = [
                    'Investor Profit Snapshot',
                    '-',
                    `ARV: ${formatMoney(rawArv)}`,
                    `Offer Price: ${formatMoney(offerPrice)}`,
                    `Total Purchase Costs: ${formatMoney(invTotalPurchaseCosts)} (${formatPercent((invTotalPurchaseCosts / arvBasis) * 100)})`,
                    `Total Development Cost: ${formatMoney(invTotalDevelopmentCost)} (${formatPercent((invTotalDevelopmentCost / arvBasis) * 100)})`,
                    `Net Profit: ${formatMoney(invNetProfit)} (${formatPercent((invNetProfit / arvBasis) * 100)})`,
                    `Cash Profit: ${formatMoney(invCashProfit)} (${formatPercent((invCashProfit / arvBasis) * 100)})`
                ].join('\n');

                setPersistedIaCalculatorState(buildIaCalculatorState());
            }

            addOtherCostButton.addEventListener('click', () => {
                const name = (otherCostNameInput.value || '').trim() || 'Other Cost';
                const amount = Math.max(asNumber(otherCostAmountInput, 0), 0);
                if (amount <= 0) {
                    return;
                }
                otherCosts.push({ name, amount });
                otherCostNameInput.value = '';
                otherCostAmountInput.value = '0';
                renderOtherCosts();
                recalculate();
            });

            targetPercentInput.addEventListener('input', () => {
                targetMode = 'percent';
                offerPriceMode = 'target';
                formatPercentSuffixInputValue(targetPercentInput, { allowNegative: true });
                placePercentSuffixCaret(targetPercentInput);
                recalculate();
            });
            targetPercentInput.addEventListener('focus', () => {
                formatPercentSuffixInputValue(targetPercentInput, { allowNegative: true });
                placePercentSuffixCaret(targetPercentInput);
            });
            targetPercentInput.addEventListener('click', () => {
                placePercentSuffixCaret(targetPercentInput);
            });
            targetPercentInput.addEventListener('keydown', (event) => {
                const value = String(targetPercentInput.value || '');
                const suffixIndex = value.endsWith('%') ? value.length - 1 : value.length;
                const selectionStart = typeof targetPercentInput.selectionStart === 'number' ? targetPercentInput.selectionStart : suffixIndex;
                const selectionEnd = typeof targetPercentInput.selectionEnd === 'number' ? targetPercentInput.selectionEnd : suffixIndex;

                if (selectionStart > suffixIndex || selectionEnd > suffixIndex) {
                    event.preventDefault();
                    placePercentSuffixCaret(targetPercentInput);
                }
            });
            targetDollarInput.addEventListener('input', () => {
                targetMode = 'dollar';
                offerPriceMode = 'target';
                formatCurrencyPrefixInputValue(targetDollarInput, { allowNegative: true });
                placeCurrencyPrefixCaret(targetDollarInput);
                recalculate();
            });
            targetDollarInput.addEventListener('focus', () => {
                formatCurrencyPrefixInputValue(targetDollarInput, { allowNegative: true });
                placeCurrencyPrefixCaret(targetDollarInput);
            });
            targetDollarInput.addEventListener('click', () => {
                placeCurrencyPrefixCaret(targetDollarInput);
            });
            targetDollarInput.addEventListener('keydown', (event) => {
                const value = String(targetDollarInput.value || '');
                const prefixLength = value.startsWith('-$') ? 2 : value.startsWith('$') ? 1 : 0;
                const selectionStart = typeof targetDollarInput.selectionStart === 'number' ? targetDollarInput.selectionStart : prefixLength;
                const selectionEnd = typeof targetDollarInput.selectionEnd === 'number' ? targetDollarInput.selectionEnd : prefixLength;

                if (selectionStart < prefixLength || selectionEnd < prefixLength) {
                    event.preventDefault();
                    placeCurrencyPrefixCaret(targetDollarInput);
                }
            });
            offerPriceInput.addEventListener('input', () => {
                offerPriceMode = 'manual';
                formatNumericInputValue(offerPriceInput);
                recalculate();
            });

            [
                arvInput,
                renovationInput,
                sellSidePercentInput,
                holdMonthsInput,
                customCostCapInput,
                customArvMaxInput,
                loanToArvInput,
                interestRateInput,
                originationPointsInput,
                lenderFeesInput
            ].forEach(input => {
                input.addEventListener('input', () => {
                    formatNumericInputValue(input);
                    recalculate();
                });
            });

            [
                invEscrowPctInput,
                invProratedPctInput,
                invConcessionsPctInput,
                invBuyerAgentPctInput,
                invListingAgentPctInput,
                invPerDiemPctInput,
                invAssetMgmtPctInput,
                invDueDiligenceInput,
                invAcquisitionFeeInput,
                invCashForKeysInput
            ].forEach(input => {
                if (!input) {
                    return;
                }
                input.addEventListener('input', () => {
                    formatNumericInputValue(input);
                    recalculate();
                });
            });

            if (otherCostAmountInput) {
                otherCostAmountInput.addEventListener('input', () => {
                    formatNumericInputValue(otherCostAmountInput);
                });
            }

            if (otherCostNameInput) {
                otherCostNameInput.addEventListener('input', applyOtherCostPreset);
                otherCostNameInput.addEventListener('change', applyOtherCostPreset);
            }

            financingModeInput.addEventListener('change', () => {
                applyFinancingModeDefaults(financingModeInput.value);
                recalculate();
            });

            if (financingToggleButton) {
                financingToggleButton.addEventListener('click', () => {
                    setFinancingSectionCollapsed(!financingHoldCollapsed);
                });
            }

            async function copyTextWithToast(value, emptyMessage) {
                const text = String(value || '').trim();
                if (!text) {
                    if (typeof showDashboardToast === 'function') {
                        showDashboardToast('error', 'Nothing To Copy', emptyMessage || 'No text available yet.');
                    }
                    return;
                }

                let copied = false;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(text);
                        copied = true;
                    }
                } catch (error) {
                    copied = false;
                }

                if (!copied) {
                    const helper = document.createElement('textarea');
                    helper.value = text;
                    helper.setAttribute('readonly', 'readonly');
                    helper.style.position = 'fixed';
                    helper.style.opacity = '0';
                    helper.style.pointerEvents = 'none';
                    document.body.appendChild(helper);
                    helper.select();
                    try {
                        copied = document.execCommand('copy');
                    } catch (error) {
                        copied = false;
                    }
                    document.body.removeChild(helper);
                }

                if (copied) {
                    if (typeof showDashboardToast === 'function') {
                        showDashboardToast('success', 'Copied', 'Copied to clipboard');
                    }
                } else if (typeof showDashboardToast === 'function') {
                    showDashboardToast('error', 'Copy Failed', 'Unable to copy in this browser.');
                }
            }

            if (iaSummaryCopyBtn) {
                iaSummaryCopyBtn.addEventListener('click', async () => {
                    await copyTextWithToast(iaSummaryMessage, 'No IA summary is available yet.');
                });
            }

            if (calcButton) {
                calcButton.addEventListener('click', () => {
                    offerPriceMode = 'target';
                    recalculate();
                });
            }

            if (invSummaryCopyBtn) {
                invSummaryCopyBtn.addEventListener('click', async () => {
                    await copyTextWithToast(investorSummaryMessage, 'No investor summary is available yet.');
                });
            }

            const persistedIaCalculatorState = getPersistedIaCalculatorState()
                || sanitizeIaCalculatorState(detailData.iaCalculatorState && typeof detailData.iaCalculatorState === 'object' ? detailData.iaCalculatorState : null);

            if (persistedIaCalculatorState) {
                applyPersistedIaCalculatorState(persistedIaCalculatorState);
            }

            setFinancingSectionCollapsed(financingHoldCollapsed, { skipPersist: true });

            renderOtherCosts();
            applyFinancingModeDefaults(financingModeInput.value, { preserveValues: !!persistedIaCalculatorState });
            formatIaNumericInputs();
            updateStrikeZoneReadout();
            recalculate();
        }

        initIaCalculator();

    }


    // ============================================
    // Initialize All Functions
    // ============================================
    function init() {
        initSiteLegalFooter();
        initAccentPreference();
        initMyAgentsAccessRules();
        initThemeToggle();
        initBuildVersionLabel();
        initNavbarDateTime();
        initNavbarSearch();
        initTiltEffect();
        initCounters();
        initMobileMenu();
        initMenuSoundEffects();
        initSoundSettingsTab();
        initFormValidation();
        initPasswordToggle();
        initPageTransitions();
        initSettingsTabs();
        initLiveKpiStats();
        initClosedDealsWidget();
        initWidgetControls();
        initInteractiveCalendar();
        initDashboardChatGptWidget();
        initDailyBibleVerseWidget();
        initPersonalOutreachWorkspace();
        initAgentNotesWidget();
        initAdminAccessRequests();
        initAdminSmtpApprovals();
        initAdminUserManager();
        initTodoGoalsWidget();
        initPlannerNotifications();
        initContractsWidget();
        initMlsDealsBoard();
        initMlsSearchHub();
        initFlyerMaker();
        initDealsPage();
        initPropertyDetailPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); // End of main IIFE