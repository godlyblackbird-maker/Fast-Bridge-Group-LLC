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
    const AGENT_WORKSPACE_EMAIL_PREP_KEY = 'agentWorkspaceEmailPrepByUser';
    const IA_CALCULATOR_STATE_KEY = 'iaCalculatorStateByUser';
    const PIQ_AGENT_STATUS_KEY = 'piqAgentStatusByUser';
    const CLOSED_DEALS_KEY = 'closedDealsByUser';
    const NOTIFICATION_HISTORY_KEY = 'dashboardNotificationHistoryByUser';
    const MLS_LISTING_NOTIFICATIONS_KEY = 'mlsListingNotificationsByUser';
    const PROPERTY_ASSIGNMENTS_KEY = 'propertyAssignments';
    const MAX_NOTIFICATION_HISTORY_ITEMS = 20;
    const STRIKE_ZONE_CSV_PATH = 'Apprasial%20Rules/SoCal-Buy-_-strike-zone-2024-UPDATE.csv';
    const DASHBOARD_NOTIFICATION_SOUND_PATH = 'Sound FX/Notification sound effect.wav';
    const SOUND_SETTINGS_KEY = 'dashboardSoundSettings';
    const USER_SETTINGS_KEY = 'dashboardSettingsByUser';
    const USER_THEME_KEY = 'dashboardThemeByUser';
    const SIDEBAR_STATE_KEY = 'dashboardSidebarStateByUser';
    const ANALYTICS_NAV_BADGE_STATE_KEY = 'analyticsNavBadgeStateByUser';
    const ANALYTICS_PROFIT_GOAL_KEY = 'analyticsProfitGoalByUser';
    const ANALYTICS_PROFIT_WINDOW_KEY = 'analyticsProfitWindowByUser';
    const ANALYTICS_CLOSED_DEAL_DRAFT_KEY = 'analyticsClosedDealDraftByUser';
    const PLANNER_DRAFT_KEY = 'plannerDraftByUser';
    const DASHBOARD_NOTES_KEY = 'dashboardNotesByUser';
    const SUBSCRIPTION_PLAN_KEY = 'subscriptionPlanByUser';
    const CLOSED_DEAL_INLINE_DOCUMENT_MAX_BYTES = 1024 * 1024;
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
    const ALLOWED_THEMES = ['dark', 'light', 'beach', 'swamp', 'sunset', 'space', 'japan', 'holloween', 'christmas'];
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

        if (config.persist !== false) {
            rememberDashboardNotification(type, title, message, config);
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

    function normalizeNotificationHistoryEntries(entries) {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => ({
                id: String(entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
                type: String(entry.type || 'info').trim() || 'info',
                title: String(entry.title || 'Notice').trim() || 'Notice',
                message: String(entry.message || '').trim(),
                eyebrow: String(entry.eyebrow || '').trim(),
                meta: String(entry.meta || '').trim(),
                pageTitle: String(entry.pageTitle || '').trim(),
                createdAt: Number(entry.createdAt) || Date.now(),
                items: Array.isArray(entry.items)
                    ? entry.items.slice(0, 4).map((item) => ({
                        label: String(item && typeof item === 'object' ? item.label || '' : item || '').trim(),
                        meta: String(item && typeof item === 'object' ? item.meta || '' : '').trim()
                    })).filter((item) => item.label)
                    : []
            }))
            .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))
            .slice(0, MAX_NOTIFICATION_HISTORY_ITEMS);
    }

    function getNotificationHistory(workspaceUserLike) {
        const workspaceUser = workspaceUserLike && typeof workspaceUserLike === 'object'
            ? workspaceUserLike
            : getWorkspaceUserContext();
        const stored = getUserScopedObject(NOTIFICATION_HISTORY_KEY, workspaceUser.key);
        return normalizeNotificationHistoryEntries(Array.isArray(stored.entries) ? stored.entries : []);
    }

    function setNotificationHistory(entries, workspaceUserLike) {
        const workspaceUser = workspaceUserLike && typeof workspaceUserLike === 'object'
            ? workspaceUserLike
            : getWorkspaceUserContext();
        const normalizedEntries = normalizeNotificationHistoryEntries(entries);
        setUserScopedObject(NOTIFICATION_HISTORY_KEY, workspaceUser.key, {
            entries: normalizedEntries,
            updatedAt: Date.now()
        });
        window.dispatchEvent(new CustomEvent('dashboard-notifications-updated', {
            detail: {
                userKey: workspaceUser.key,
                entries: normalizedEntries
            }
        }));
    }

    function rememberDashboardNotification(type, title, message, config) {
        const workspaceUser = getWorkspaceUserContext();
        const nextEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: String(type || 'info').trim() || 'info',
            title: String(title || 'Notice').trim() || 'Notice',
            message: String(message || '').trim(),
            eyebrow: String(config.eyebrow || '').trim(),
            meta: String(config.meta || '').trim(),
            pageTitle: String(document.title || '').trim(),
            createdAt: Date.now(),
            items: Array.isArray(config.items)
                ? config.items.slice(0, 4).map((item) => ({
                    label: String(item && typeof item === 'object' ? item.label || '' : item || '').trim(),
                    meta: String(item && typeof item === 'object' ? item.meta || '' : '').trim()
                })).filter((item) => item.label)
                : []
        };
        const entries = [nextEntry, ...getNotificationHistory(workspaceUser)].slice(0, MAX_NOTIFICATION_HISTORY_ITEMS);
        setNotificationHistory(entries, workspaceUser);
    }

    function initNotificationCenter() {
        const triggerButtons = Array.from(document.querySelectorAll('.nav-btn')).filter((button) => button.querySelector('.notification-dot'));
        if (!triggerButtons.length) {
            return;
        }

        function initFloatingNotificationTriggers(buttons) {
            const uniqueButtons = buttons.filter((button, index, allButtons) => button && allButtons.indexOf(button) === index);
            if (!uniqueButtons.length) {
                return;
            }

            let releaseThreshold = 0;

            function measureThreshold() {
                const primaryButton = uniqueButtons[0];
                const anchor = primaryButton.closest('.navbar') || primaryButton;
                const anchorRect = anchor.getBoundingClientRect();
                releaseThreshold = Math.max(0, window.scrollY + anchorRect.bottom);
            }

            function syncFloatingState() {
                const shouldFloat = window.scrollY > releaseThreshold;
                uniqueButtons.forEach((button) => {
                    button.classList.toggle('notification-following', shouldFloat);
                });
            }

            let resizeTimer = null;
            const handleResize = () => {
                window.clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                    measureThreshold();
                    syncFloatingState();
                }, 60);
            };

            measureThreshold();
            syncFloatingState();
            window.addEventListener('scroll', syncFloatingState, { passive: true });
            window.addEventListener('resize', handleResize);
            window.addEventListener('load', handleResize, { once: true });
        }

        initFloatingNotificationTriggers(triggerButtons);

        const workspaceUser = getWorkspaceUserContext();
        let historyEntries = getNotificationHistory(workspaceUser);
        let drawer = document.getElementById('notification-center-drawer');
        let overlay = document.getElementById('notification-center-overlay');

        if (!drawer || !overlay) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="notification-center-overlay" class="notification-center-overlay" hidden></div>
                <aside id="notification-center-drawer" class="notification-center-drawer" aria-hidden="true">
                    <div class="notification-center-header">
                        <div>
                            <p class="notification-center-kicker">Recent Notification Popups</p>
                            <h2 class="notification-center-title">Notification Center</h2>
                            <p class="notification-center-subtitle">Last 20 notifications saved for this user.</p>
                        </div>
                        <button type="button" class="notification-center-close" id="notification-center-close" aria-label="Close notification center">×</button>
                    </div>
                    <div class="notification-center-toolbar">
                        <span class="notification-center-count" id="notification-center-count">0 saved</span>
                        <button type="button" class="card-btn" id="notification-center-clear-btn">Clear All</button>
                    </div>
                    <div class="notification-center-list" id="notification-center-list"></div>
                </aside>
            `);
            drawer = document.getElementById('notification-center-drawer');
            overlay = document.getElementById('notification-center-overlay');
        }

        const list = document.getElementById('notification-center-list');
        const countLabel = document.getElementById('notification-center-count');
        const clearButton = document.getElementById('notification-center-clear-btn');
        const closeButton = document.getElementById('notification-center-close');

        if (!drawer || !overlay || !list || !countLabel || !clearButton || !closeButton) {
            return;
        }

        function formatNotificationTimestamp(timestamp) {
            const date = new Date(Number(timestamp) || Date.now());
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }

        function renderNotificationHistory() {
            historyEntries = getNotificationHistory(workspaceUser);
            countLabel.textContent = `${historyEntries.length} saved`;
            list.innerHTML = '';

            if (!historyEntries.length) {
                list.innerHTML = `
                    <div class="notification-center-empty">
                        <strong>No recent notifications yet.</strong>
                        <p>When a popup appears in the app, it will also be saved here for quick review.</p>
                    </div>
                `;
                return;
            }

            historyEntries.forEach((entry) => {
                const article = document.createElement('article');
                article.className = `notification-center-item notification-center-item-${entry.type}`;

                const head = document.createElement('div');
                head.className = 'notification-center-item-head';

                const chipRow = document.createElement('div');
                chipRow.className = 'notification-center-chip-row';
                if (entry.eyebrow) {
                    const eyebrowChip = document.createElement('span');
                    eyebrowChip.className = 'notification-center-chip';
                    eyebrowChip.textContent = entry.eyebrow;
                    chipRow.appendChild(eyebrowChip);
                }

                const typeChip = document.createElement('span');
                typeChip.className = 'notification-center-chip notification-center-chip-type';
                typeChip.textContent = entry.type;
                chipRow.appendChild(typeChip);

                const time = document.createElement('time');
                time.className = 'notification-center-time';
                time.textContent = formatNotificationTimestamp(entry.createdAt);

                head.appendChild(chipRow);
                head.appendChild(time);
                article.appendChild(head);

                const title = document.createElement('strong');
                title.className = 'notification-center-item-title';
                title.textContent = entry.title;
                article.appendChild(title);

                if (entry.message) {
                    const message = document.createElement('p');
                    message.className = 'notification-center-item-message';
                    message.textContent = entry.message;
                    article.appendChild(message);
                }

                if (entry.meta) {
                    const meta = document.createElement('p');
                    meta.className = 'notification-center-item-meta';
                    meta.textContent = entry.meta;
                    article.appendChild(meta);
                }

                if (entry.pageTitle) {
                    const page = document.createElement('p');
                    page.className = 'notification-center-item-page';
                    page.textContent = entry.pageTitle;
                    article.appendChild(page);
                }

                if (Array.isArray(entry.items) && entry.items.length > 0) {
                    const details = document.createElement('ul');
                    details.className = 'notification-center-item-list';
                    entry.items.forEach((item) => {
                        const li = document.createElement('li');
                        li.className = 'notification-center-item-list-entry';
                        const label = document.createElement('span');
                        label.textContent = item.label;
                        li.appendChild(label);

                        if (item.meta) {
                            const small = document.createElement('small');
                            small.textContent = item.meta;
                            li.appendChild(small);
                        }
                        details.appendChild(li);
                    });
                    article.appendChild(details);
                }

                list.appendChild(article);
            });
        }

        function setDrawerState(isOpen) {
            drawer.classList.toggle('open', Boolean(isOpen));
            drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            overlay.hidden = !isOpen;
            overlay.classList.toggle('open', Boolean(isOpen));
            document.body.classList.toggle('notification-center-open', Boolean(isOpen));
            triggerButtons.forEach((button) => {
                button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        triggerButtons.forEach((button) => {
            button.setAttribute('aria-haspopup', 'dialog');
            button.setAttribute('aria-controls', 'notification-center-drawer');
            button.addEventListener('click', () => {
                const isOpen = drawer.classList.contains('open');
                renderNotificationHistory();
                setDrawerState(!isOpen);
            });
        });

        overlay.addEventListener('click', () => {
            setDrawerState(false);
        });

        closeButton.addEventListener('click', () => {
            setDrawerState(false);
        });

        clearButton.addEventListener('click', () => {
            setNotificationHistory([], workspaceUser);
            renderNotificationHistory();
            showDashboardToast('success', 'Notifications Cleared', 'Saved notification history was cleared for this user.', {
                persist: false,
                playSound: false
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && drawer.classList.contains('open')) {
                setDrawerState(false);
            }
        });

        window.addEventListener('dashboard-notifications-updated', () => {
            renderNotificationHistory();
        });

        window.addEventListener('storage', (event) => {
            if (event.key === NOTIFICATION_HISTORY_KEY) {
                renderNotificationHistory();
            }
        });

        renderNotificationHistory();
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
                versionLabel.textContent = 'v1.2.8';
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
        const authToken = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
        const userEmail = normalizeUserIdentityValue(user.email || '');
        const profileEmail = normalizeUserIdentityValue(profile.email || '');
        const canUseProfileIdentity = !authToken || !userEmail || !profileEmail || profileEmail === userEmail;
        const email = userEmail || (canUseProfileIdentity ? profileEmail : '');
        const name = String(user.name || (canUseProfileIdentity ? profile.name : '') || 'User').trim();
        const role = ADMIN_CANONICAL_EMAILS.has(email)
            ? 'admin'
            : normalizeUserIdentityValue(user.role || (canUseProfileIdentity ? profile.role : '') || '');
        const key = email || normalizeUserNameKey(name) || 'default-user';
        return {
            key,
            name,
            email,
            role,
            aliases: getUserIdentityAliases({ key, name, email })
        };
    }

    function initLegalPageAccessLinks() {
        const legalHeaderLinks = document.querySelectorAll('.legal-page-header .legal-login-link');
        if (!legalHeaderLinks.length) {
            return;
        }

        const authToken = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
        const workspaceUser = getWorkspaceUserContext();
        const hasAuthenticatedUser = !!(authToken && (workspaceUser.email || (workspaceUser.name && workspaceUser.name !== 'User')));

        if (!hasAuthenticatedUser) {
            return;
        }

        legalHeaderLinks.forEach((link) => {
            link.href = 'dashboard.html';
            link.textContent = 'Back to Dashboard';
            link.setAttribute('title', 'Return to your dashboard');
        });
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

        const candidateKeys = getScopedStorageCandidateKeys(userKey);
        const merged = {};

        [...candidateKeys].reverse().forEach((candidateKey) => {
            const scoped = store[candidateKey];
            if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
                Object.assign(merged, scoped);
            }
        });

        if (Object.keys(merged).length > 0) {
            return merged;
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

    function getScopedSmtpSettings(workspaceUserLike) {
        const workspaceUser = workspaceUserLike && typeof workspaceUserLike === 'object'
            ? workspaceUserLike
            : getWorkspaceUserContext();
        const candidateKeys = new Set([
            String(workspaceUser.key || '').trim(),
            ...((Array.isArray(workspaceUser.aliases) ? workspaceUser.aliases : []).map((alias) => String(alias || '').trim())),
            normalizeUserNameKey(workspaceUser.name || '')
        ]);

        try {
            const parsed = JSON.parse(localStorage.getItem('smtpSettingsByUser') || '{}');
            const store = parsed && typeof parsed === 'object' ? parsed : {};
            for (const key of candidateKeys) {
                if (!key) {
                    continue;
                }
                const value = store[key];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return value;
                }
            }
        } catch (error) {
            // Fall through to legacy cache.
        }

        try {
            const legacy = JSON.parse(localStorage.getItem('smtpSettings') || '{}');
            return legacy && typeof legacy === 'object' ? legacy : {};
        } catch (error) {
            return {};
        }
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

    function isPopulatedObject(value) {
        return !!(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0);
    }

    function mergePropertyAssignmentStores(primaryStore, fallbackStore) {
        const merged = {};

        if (isPopulatedObject(fallbackStore)) {
            Object.entries(fallbackStore).forEach(([propertyKey, record]) => {
                if (record && typeof record === 'object' && !Array.isArray(record)) {
                    merged[propertyKey] = record;
                }
            });
        }

        if (isPopulatedObject(primaryStore)) {
            Object.entries(primaryStore).forEach(([propertyKey, record]) => {
                if (record && typeof record === 'object' && !Array.isArray(record)) {
                    merged[propertyKey] = record;
                }
            });
        }

        return merged;
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
        const token = String((window.getAuthToken && window.getAuthToken()) || localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
        const localAssignments = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
        if (!token) {
            return localAssignments;
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
        const hydratedAssignments = isPopulatedObject(assignments)
            ? mergePropertyAssignmentStores(assignments, localAssignments)
            : localAssignments;

        applyPropertyAssignmentStore(hydratedAssignments);
        return hydratedAssignments;
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

    function buildPropertyAssignmentMeta(assignmentLike) {
        if (!assignmentLike || typeof assignmentLike !== 'object') {
            return null;
        }

        return {
            assignedTo: assignmentLike.assignedTo && typeof assignmentLike.assignedTo === 'object'
                ? { ...assignmentLike.assignedTo }
                : {},
            assignedBy: assignmentLike.assignedBy && typeof assignmentLike.assignedBy === 'object'
                ? { ...assignmentLike.assignedBy }
                : {},
            assignedAt: String(assignmentLike.assignedAt || '').trim()
        };
    }

    function syncAssignmentIntoLocalDealCache(propertyKey, assignmentRecord, workspaceUserLike) {
        const normalizedPropertyKey = makePropertyStorageKey(propertyKey);
        if (!normalizedPropertyKey) {
            return;
        }

        const workspaceUser = workspaceUserLike && typeof workspaceUserLike === 'object'
            ? workspaceUserLike
            : getWorkspaceUserContext();
        const assignmentMeta = buildPropertyAssignmentMeta(assignmentRecord);
        const clickedItems = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key);
        let clickedItemsChanged = false;

        const nextClickedItems = clickedItems.map((item) => {
            const itemSnapshot = item && item.propertySnapshot && typeof item.propertySnapshot === 'object'
                ? item.propertySnapshot
                : null;
            const itemPropertyKey = makePropertyStorageKey(
                itemSnapshot?.address
                || item?.address
                || item?.propertyAddress
            );

            if (itemPropertyKey !== normalizedPropertyKey || !itemSnapshot) {
                return item;
            }

            const nextSnapshot = { ...itemSnapshot };
            if (assignmentMeta) {
                nextSnapshot.propertyAssignment = assignmentMeta;
            } else {
                delete nextSnapshot.propertyAssignment;
            }

            clickedItemsChanged = true;
            return {
                ...item,
                propertySnapshot: nextSnapshot
            };
        });

        if (clickedItemsChanged) {
            setUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key, nextClickedItems);
        }

        const persistedDetail = getPersistedSelectedPropertyDetail();
        if (!persistedDetail || typeof persistedDetail !== 'object') {
            return;
        }

        const persistedDetailKey = makePropertyStorageKey(persistedDetail.address || persistedDetail.propertyAddress);
        if (persistedDetailKey !== normalizedPropertyKey) {
            return;
        }

        const nextDetail = { ...persistedDetail };
        if (assignmentMeta) {
            nextDetail.propertyAssignment = assignmentMeta;
        } else {
            delete nextDetail.propertyAssignment;
        }
        persistSelectedPropertyDetail(nextDetail);
    }

    function syncPropertyDetailIntoLocalDealCache(propertyKeys, detailLike, workspaceUserLike) {
        const detail = detailLike && typeof detailLike === 'object' ? detailLike : null;
        if (!detail) {
            return;
        }

        const detailPropertyKey = makePropertyStorageKey(detail.address || detail.propertyAddress);
        const normalizedKeys = Array.from(new Set(
            [...(Array.isArray(propertyKeys) ? propertyKeys : [propertyKeys]), detailPropertyKey]
                .map(key => makePropertyStorageKey(key))
                .filter(Boolean)
        ));

        if (normalizedKeys.length === 0) {
            return;
        }

        const workspaceUser = workspaceUserLike && typeof workspaceUserLike === 'object'
            ? workspaceUserLike
            : getWorkspaceUserContext();
        const clickedItems = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key);
        if (!Array.isArray(clickedItems) || clickedItems.length === 0) {
            return;
        }

        const summaryParts = String(detail.propertyDetails || '')
            .split('/')
            .map(part => String(part || '').trim())
            .filter(Boolean);
        const normalizeSummaryMetric = (value, fallback) => {
            const raw = String(value || '').trim();
            return raw || fallback;
        };
        const compactBeds = normalizeSummaryMetric(summaryParts[1], '').replace(/\bbr\b/i, 'Beds') || '0 Beds';
        const compactBaths = normalizeSummaryMetric(summaryParts[2], '').replace(/\bba\b/i, 'Baths') || '0 Baths';
        const compactArea = normalizeSummaryMetric(summaryParts[5], '').replace(/ft²/gi, 'sqft') || '0 sqft';
        const compactStatus = String(detail.statusLabel || 'Active').trim().toLowerCase().replace(/\s+/g, '-');
        const compactLocation = String(detail.areaLabel || detail.city || detail.county || detail.marketInfo || '').trim() || '-';
        const compactImageUrl = String((Array.isArray(detail.propertyImages) ? detail.propertyImages[0] : '') || detail.imageUrl || '').trim();
        const compactSnapshot = { ...detail };
        const matchingItems = [];
        const unmatchedItems = [];

        clickedItems.forEach((item) => {
            const itemSnapshot = item && item.propertySnapshot && typeof item.propertySnapshot === 'object'
                ? item.propertySnapshot
                : null;
            const itemPropertyKey = makePropertyStorageKey(
                itemSnapshot?.address
                || item?.address
                || item?.propertyAddress
            );

            if (!normalizedKeys.includes(itemPropertyKey)) {
                unmatchedItems.push(item);
                return;
            }

            matchingItems.push(item);
        });

        if (matchingItems.length === 0) {
            return;
        }

        const preferredMatch = matchingItems.find((item) => {
            const snapshot = item && item.propertySnapshot && typeof item.propertySnapshot === 'object'
                ? item.propertySnapshot
                : null;
            const itemPropertyKey = makePropertyStorageKey(
                snapshot?.address
                || item?.address
                || item?.propertyAddress
            );
            return itemPropertyKey === detailPropertyKey;
        }) || matchingItems[0];

        const mergedClickedAt = matchingItems.reduce((latest, item) => {
            const nextValue = Number(item?.clickedAt) || 0;
            return Math.max(latest, nextValue);
        }, 0);

        const mergedItem = {
            ...preferredMatch,
            id: String(preferredMatch?.id || `manual:${detailPropertyKey || Date.now()}`),
            address: String(detail.address || preferredMatch?.address || preferredMatch?.propertySnapshot?.address || 'Property').trim() || 'Property',
            location: compactLocation,
            price: String(detail.listPrice || preferredMatch?.price || '$0').trim() || '$0',
            beds: compactBeds,
            baths: compactBaths,
            area: compactArea,
            status: compactStatus || preferredMatch?.status || 'active',
            imageUrl: compactImageUrl || preferredMatch?.imageUrl || '',
            clickedAt: mergedClickedAt || Date.now(),
            propertySnapshot: compactSnapshot
        };

        const nextClickedItems = [mergedItem, ...unmatchedItems]
            .sort((a, b) => (Number(b?.clickedAt) || 0) - (Number(a?.clickedAt) || 0))
            .slice(0, 120);

        setUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key, nextClickedItems);
        window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
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

    function persistStoredCurrentUserIdentity(userLike) {
        if (!userLike || typeof userLike !== 'object') {
            return buildUserIdentity({});
        }

        if (typeof window.writeStoredUserIdentity === 'function') {
            const stored = window.writeStoredUserIdentity(userLike);
            return buildUserIdentity(stored || userLike);
        }

        const normalizedUser = buildUserIdentity(userLike);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        return normalizedUser;
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

    const COUNTY_FILTER_VALUE_ALIASES = {
        'los angeles': 'los-angeles',
        'los angeles county': 'los-angeles',
        'la': 'los-angeles',
        'la county': 'los-angeles',
        'orange': 'orange',
        'orange county': 'orange',
        'san bernardino': 'san-bernardino',
        'san bernardino county': 'san-bernardino',
        'riverside': 'riverside',
        'riverside county': 'riverside',
        'san diego': 'san-diego',
        'san diego county': 'san-diego',
        'santa clara': 'santa-clara',
        'santa clara county': 'santa-clara',
        'ventura': 'ventura',
        'ventura county': 'ventura',
        'central county': 'central-county',
        'fresno': 'central-county',
        'fresno county': 'central-county',
        'kern': 'central-county',
        'kern county': 'central-county',
        'sacramento': 'central-county',
        'sacramento county': 'central-county',
        'imperial': 'central-county',
        'imperial county': 'central-county'
    };

    const COUNTY_FILTER_CITY_SUPPLEMENTS = {
        'los-angeles': [
            'los angeles', 'pasadena', 'long beach', 'glendale', 'burbank', 'inglewood', 'downey', 'culver city',
            'north hollywood', 'pomona', 'whittier', 'torrance', 'hawthorne', 'gardena', 'norwalk', 'lakewood'
        ],
        orange: [
            'anaheim', 'irvine', 'newport beach', 'costa mesa', 'huntington beach', 'santa ana', 'tustin', 'mission viejo',
            'yorba linda', 'fullerton', 'orange', 'garden grove', 'laguna beach', 'san clemente'
        ],
        'san-bernardino': [
            'san bernardino', 'ontario', 'upland', 'montclair', 'fontana', 'rialto', 'redlands', 'highland', 'victorville',
            'hesperia', 'apple valley', 'adelanto', 'barstow', 'big bear lake', 'yucaipa', 'joshua tree', 'yucca valley'
        ],
        riverside: [
            'riverside', 'moreno valley', 'perris', 'corona', 'eastvale', 'temecula', 'murrieta', 'menifee', 'lake elsinore',
            'wildomar', 'palm springs', 'indio', 'coachella', 'hemet', 'san jacinto', 'beaumont', 'banning'
        ],
        'san-diego': [
            'san diego', 'chula vista', 'oceanside', 'carlsbad', 'encinitas', 'la mesa', 'escondido', 'san marcos', 'vista',
            'poway', 'national city', 'el cajon', 'spring valley', 'fallbrook', 'la jolla', 'lemon grove', 'pacific beach'
        ],
        'santa-clara': [
            'san jose', 'santa clara', 'sunnyvale', 'mountain view', 'palo alto', 'cupertino', 'milpitas', 'campbell',
            'los altos', 'los gatos', 'saratoga'
        ],
        'central-county': [
            'bakersfield', 'fresno', 'sacramento', 'elk grove', 'galt', 'rancho cordova', 'citrus heights', 'folsom',
            'orangevale', 'imperial', 'el centro'
        ]
    };

    let countyCityLookupCache = null;

    function tokenizeStrikeZoneArea(area) {
        const genericTokens = new Set(['city', 'county', 'area', 'inland', 'coastal', 'rural']);
        return String(area || '')
            .split(/[\/,&]/)
            .map(part => normalizeStrikeZoneText(part))
            .filter(part => part && !genericTokens.has(part));
    }

    function normalizeCountyFilterValue(value) {
        const normalized = normalizeStrikeZoneText(value).replace(/\bcounty\b/g, '').replace(/\s+/g, ' ').trim();
        if (!normalized || normalized === 'all') {
            return normalized;
        }

        return COUNTY_FILTER_VALUE_ALIASES[normalized]
            || String(value || '').trim().toLowerCase();
    }

    function addCountyCityLookupEntry(lookup, cityLike, countyValue) {
        const normalizedCity = normalizeStrikeZoneText(cityLike);
        if (!normalizedCity) {
            return;
        }

        lookup.set(normalizedCity, countyValue);

        const withoutDirection = normalizedCity.replace(/\b(west|east|north|south)\b/g, ' ').replace(/\s+/g, ' ').trim();
        if (withoutDirection && withoutDirection !== normalizedCity) {
            lookup.set(withoutDirection, countyValue);
        }
    }

    function getCountyCityLookup() {
        if (countyCityLookupCache) {
            return countyCityLookupCache;
        }

        const lookup = new Map();

        STRIKE_ZONE_RULES.forEach((rule) => {
            const countyValue = normalizeCountyFilterValue(rule && rule.county);
            if (!countyValue) {
                return;
            }

            tokenizeStrikeZoneArea(rule.area).forEach((token) => {
                addCountyCityLookupEntry(lookup, token, countyValue);
            });
        });

        Object.entries(COUNTY_FILTER_CITY_SUPPLEMENTS).forEach(([countyValue, cities]) => {
            cities.forEach((city) => addCountyCityLookupEntry(lookup, city, countyValue));
        });

        countyCityLookupCache = lookup;
        return countyCityLookupCache;
    }

    function resolveCountyFilterValueFromLocation(text) {
        const normalized = normalizeStrikeZoneText(text);
        if (!normalized) {
            return '';
        }

        const aliasEntries = Object.entries(COUNTY_FILTER_VALUE_ALIASES)
            .sort((left, right) => right[0].length - left[0].length);
        const explicitCounty = aliasEntries.find(([alias]) => (` ${normalized} `).includes(` ${alias} `));
        if (explicitCounty) {
            return explicitCounty[1];
        }

        const cityEntries = Array.from(getCountyCityLookup().entries())
            .sort((left, right) => right[0].length - left[0].length);
        const cityMatch = cityEntries.find(([city]) => (` ${normalized} `).includes(` ${city} `));
        return cityMatch ? cityMatch[1] : '';
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

    function formatUserRoleLabel(roleValue) {
        const normalizedRole = String(roleValue || '').trim().toLowerCase();
        if (normalizedRole === 'admin') {
            return 'Administrator';
        }
        if (normalizedRole === 'broker') {
            return 'Broker';
        }
        if (normalizedRole === 'premium user') {
            return 'Premium User';
        }
        if (normalizedRole === 'user') {
            return 'User';
        }
        return normalizedRole.replace(/\b\w/g, (char) => char.toUpperCase()) || 'User';
    }

    function isRegularUserRole(roleValue) {
        return String(roleValue || '').trim().toLowerCase() === 'user';
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

    function getScopedStorageCandidateKeys(userKey) {
        const rawKey = String(userKey || '').trim();
        const normalizedKey = normalizeUserIdentityValue(rawKey);
        const normalizedNameKey = normalizeUserNameKey(rawKey);
        const candidates = new Set();

        if (rawKey) {
            candidates.add(rawKey);
        }
        if (normalizedKey) {
            candidates.add(normalizedKey);
        }
        if (normalizedNameKey) {
            candidates.add(normalizedNameKey);
        }

        const workspaceUser = getWorkspaceUserContext();
        const workspaceAliases = Array.isArray(workspaceUser.aliases) ? workspaceUser.aliases : [];
        const workspaceKeys = [
            String(workspaceUser.key || '').trim(),
            normalizeUserIdentityValue(workspaceUser.email || ''),
            normalizeUserNameKey(workspaceUser.name || ''),
            ...workspaceAliases.map((alias) => normalizeUserIdentityValue(alias))
        ].filter(Boolean);
        const workspaceKeySet = new Set(workspaceKeys);

        if (workspaceKeySet.has(rawKey) || workspaceKeySet.has(normalizedKey) || workspaceKeySet.has(normalizedNameKey)) {
            workspaceKeys.forEach((candidate) => candidates.add(candidate));
        }

        return Array.from(candidates).filter(Boolean);
    }

    function getScopedItemSignature(item) {
        if (!item || typeof item !== 'object') {
            return String(item);
        }

        if (item.id != null && String(item.id).trim()) {
            return `id:${String(item.id).trim()}`;
        }
        if (item.propertyKey != null && String(item.propertyKey).trim()) {
            return `property-key:${String(item.propertyKey).trim().toLowerCase()}`;
        }
        if (item.propertyAddress != null && String(item.propertyAddress).trim()) {
            return `property-address:${String(item.propertyAddress).trim().toLowerCase()}`;
        }
        if (item.address != null && String(item.address).trim()) {
            return `address:${String(item.address).trim().toLowerCase()}`;
        }

        try {
            return `json:${JSON.stringify(item)}`;
        } catch (error) {
            return `fallback:${String(item)}`;
        }
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

        const candidateKeys = getScopedStorageCandidateKeys(userKey);
        const mergedItems = [];
        const seenSignatures = new Set();

        candidateKeys.forEach((candidateKey) => {
            const items = store[candidateKey] || [];
            if (!Array.isArray(items)) {
                return;
            }

            items.forEach((item) => {
                const signature = getScopedItemSignature(item);
                if (seenSignatures.has(signature)) {
                    return;
                }

                seenSignatures.add(signature);
                mergedItems.push(item);
            });
        });

        return mergedItems;
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

        const candidateKeys = getScopedStorageCandidateKeys(userKey);
        for (const candidateKey of candidateKeys) {
            if (Object.prototype.hasOwnProperty.call(store, candidateKey)) {
                return store[candidateKey];
            }
        }

        return fallbackValue;
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

    function setUserScopedValueSilently(storageKey, userKey, value) {
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
    }

    function parseMoneyValue(value) {
        const numeric = Number(String(value || '').replace(/[^0-9.-]/g, ''));
        return Number.isFinite(numeric) ? numeric : 0;
    }

    function initAnalyticsNavBadge() {
        const analyticsLinks = Array.from(document.querySelectorAll('.nav-link[href="analytics.html"]'));
        if (!analyticsLinks.length) {
            return;
        }

        const watchedKeys = new Set([
            AGENT_NOTES_KEY,
            TODO_GOALS_KEY,
            IA_CALCULATOR_STATE_KEY,
            PIQ_AGENT_STATUS_KEY,
            CLOSED_DEALS_KEY
        ]);
        const offerRegex = /\boffer\b|submitted|sent/i;

        function ensureBadge(link) {
            let badge = link.querySelector('[data-analytics-nav-badge="true"]') || link.querySelector('.nav-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                badge.textContent = 'New';
                link.appendChild(badge);
            }

            badge.dataset.analyticsNavBadge = 'true';
            return badge;
        }

        function getLatestTimestamp(items, keys) {
            return (Array.isArray(items) ? items : []).reduce((latest, item) => {
                if (!item || typeof item !== 'object') {
                    return latest;
                }

                const nextValue = keys.reduce((maxValue, key) => {
                    const rawValue = item[key];
                    const numericValue = Number(rawValue);
                    const parsedValue = Number.isFinite(numericValue)
                        ? numericValue
                        : Date.parse(String(rawValue || ''));
                    return Number.isFinite(parsedValue) ? Math.max(maxValue, parsedValue) : maxValue;
                }, 0);

                return Math.max(latest, nextValue);
            }, 0);
        }

        function buildAnalyticsSnapshot() {
            const workspaceUser = getWorkspaceUserContext();
            const notes = getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            const plannerItems = getUserScopedItems(TODO_GOALS_KEY, workspaceUser.key);
            const iaStates = getUserScopedItems(IA_CALCULATOR_STATE_KEY, workspaceUser.key);
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            const manualClosedDeals = getUserScopedItems(CLOSED_DEALS_KEY, workspaceUser.key);
            const offerTermsSentSet = collectOfferTermsSentPropertyKeys(scopedStatuses, notes);
            const offerLeadSet = new Set();
            const relevantOfferNotes = [];
            const relevantPlannerItems = [];

            notes.forEach((note) => {
                const propertyAddress = String(note.propertyAddress || '').trim();
                const propertyKey = makePropertyStorageKey(note.propertyKey || propertyAddress);
                const noteStatus = String(
                    scopedStatuses[propertyKey]
                    || note.piqAgentStatus
                    || note.propertySnapshot?.piqAgentStatus
                    || 'none'
                ).trim().toLowerCase();
                const noteText = String(note.note || '');

                if (noteStatus === 'offer-terms-sent' && propertyKey) {
                    offerTermsSentSet.add(propertyKey);
                    relevantOfferNotes.push(note);
                }

                if (propertyAddress && offerRegex.test(noteText)) {
                    offerLeadSet.add(propertyAddress);
                    relevantOfferNotes.push(note);
                }
            });

            plannerItems.forEach((item) => {
                const title = String(item.title || item.text || '').trim();
                if (item.completed && title && offerRegex.test(title)) {
                    offerLeadSet.add(`planner-${String(item.id || title).trim().toLowerCase()}`);
                    relevantPlannerItems.push(item);
                }
            });

            const normalizedStatuses = Object.entries(scopedStatuses)
                .map(([propertyKey, statusValue]) => {
                    const normalizedKey = String(propertyKey || '').trim().toLowerCase();
                    const normalizedStatus = String(statusValue || 'none').trim().toLowerCase();
                    return normalizedKey ? `${normalizedKey}:${normalizedStatus}` : '';
                })
                .filter(Boolean)
                .filter((entry) => entry.endsWith(':offer-terms-sent') || entry.endsWith(':acquired'))
                .sort();

            const autoClosedKeys = normalizedStatuses
                .filter((entry) => entry.endsWith(':acquired'));

            const snapshot = {
                iaCount: iaStates.length,
                iaLatest: getLatestTimestamp(iaStates, ['updatedAt', 'createdAt']),
                offerTermsSentCount: offerTermsSentSet.size,
                offersSubmittedCount: offerLeadSet.size,
                offerNotesLatest: getLatestTimestamp(relevantOfferNotes, ['updatedAt', 'createdAt']),
                offerPlannerLatest: getLatestTimestamp(relevantPlannerItems, ['updatedAt', 'completedAt', 'createdAt']),
                manualClosedCount: manualClosedDeals.length,
                manualClosedLatest: getLatestTimestamp(manualClosedDeals, ['closeDate', 'createdAt']),
                autoClosedCount: autoClosedKeys.length,
                statusSignature: normalizedStatuses.join('|')
            };

            snapshot.hasActivity = snapshot.iaCount > 0
                || snapshot.offerTermsSentCount > 0
                || snapshot.offersSubmittedCount > 0
                || snapshot.manualClosedCount > 0
                || snapshot.autoClosedCount > 0;

            return snapshot;
        }

        function renderBadge() {
            const workspaceUser = getWorkspaceUserContext();
            const snapshot = buildAnalyticsSnapshot();
            const snapshotKey = JSON.stringify(snapshot);
            const isAnalyticsPage = /(^|\/)analytics\.html$/i.test(window.location.pathname || '');

            if (isAnalyticsPage) {
                setUserScopedValueSilently(ANALYTICS_NAV_BADGE_STATE_KEY, workspaceUser.key, snapshotKey);
            }

            const seenSnapshot = isAnalyticsPage
                ? snapshotKey
                : String(getUserScopedValue(ANALYTICS_NAV_BADGE_STATE_KEY, workspaceUser.key, '') || '');
            const shouldShow = snapshot.hasActivity && snapshotKey !== seenSnapshot;

            analyticsLinks.forEach((link) => {
                const badge = ensureBadge(link);
                badge.textContent = 'New';
                badge.hidden = !shouldShow;
            });
        }

        renderBadge();
        window.addEventListener('dashboard-data-updated', renderBadge);
        window.addEventListener('storage', (event) => {
            if (!event.key || watchedKeys.has(event.key) || event.key === ANALYTICS_NAV_BADGE_STATE_KEY) {
                renderBadge();
            }
        });
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

    function readBlobAsBase64(blob) {
        return new Promise((resolve, reject) => {
            if (!(blob instanceof Blob)) {
                reject(new Error('A valid file is required.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                const base64 = result.includes(',') ? result.split(',').pop() : result;
                resolve(String(base64 || '').trim());
            };
            reader.onerror = () => reject(reader.error || new Error('Unable to read the selected file.'));
            reader.readAsDataURL(blob);
        });
    }

    function createBlobFromBase64(base64, mimeType) {
        const normalizedBase64 = String(base64 || '').trim();
        if (!normalizedBase64) {
            return null;
        }

        try {
            const binary = window.atob(normalizedBase64);
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
            }
            return new Blob([bytes], { type: String(mimeType || 'application/octet-stream') || 'application/octet-stream' });
        } catch (error) {
            return null;
        }
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

    function buildDashboardPropertyDetailFallback(propertyAddress, statusValue, snapshotLike) {
        const snapshot = snapshotLike && typeof snapshotLike === 'object' ? snapshotLike : {};
        const normalizedStatus = String(statusValue || snapshot.piqAgentStatus || 'none').trim().toLowerCase() || 'none';
        const address = String(snapshot.address || propertyAddress || 'Property').trim() || 'Property';
        const propertyImages = Array.isArray(snapshot.propertyImages)
            ? snapshot.propertyImages.filter(Boolean)
            : [];

        return {
            address,
            propertyImages,
            propertyDetails: String(snapshot.propertyDetails || '').trim(),
            listPrice: String(snapshot.listPrice || '$0').trim() || '$0',
            propensity: Number.isFinite(Number(snapshot.propensity)) ? Number(snapshot.propensity) : 0,
            moderatePain: String(snapshot.moderatePain || '-').trim() || '-',
            taxDelinquency: String(snapshot.taxDelinquency || '-').trim() || '-',
            highDebt: String(snapshot.highDebt || '-').trim() || '-',
            marketInfo: String(snapshot.marketInfo || snapshot.location || '-').trim() || '-',
            dom: Number(snapshot.dom) || 0,
            cdom: Number(snapshot.cdom) || 0,
            askingVsArv: String(snapshot.askingVsArv || 'N/A').trim() || 'N/A',
            arv: String(snapshot.arv || '$0').trim() || '$0',
            compData: String(snapshot.compData || '-').trim() || '-',
            piqAgentStatus: normalizedStatus,
            piq: String(snapshot.piq || 'About property notes will appear here.').trim() || 'About property notes will appear here.',
            comps: String(snapshot.comps || '').trim(),
            ia: String(snapshot.ia || 'IA tab content placeholder.').trim() || 'IA tab content placeholder.',
            agentRecord: {
                ...(snapshot.agentRecord && typeof snapshot.agentRecord === 'object' ? snapshot.agentRecord : {}),
                agentStatus: formatAgentStatusLabel(normalizedStatus)
            },
            offer: String(snapshot.offer || 'Offer tab content placeholder.').trim() || 'Offer tab content placeholder.'
        };
    }

    function getPropertySnapshotForWorkspace(propertyKey, workspaceUserLike) {
        const normalizedPropertyKey = makePropertyStorageKey(propertyKey);
        if (!normalizedPropertyKey) {
            return null;
        }

        const workspaceUser = workspaceUserLike && typeof workspaceUserLike === 'object'
            ? workspaceUserLike
            : getWorkspaceUserContext();
        const candidates = [];
        const assignmentRecord = getPropertyAssignmentRecord(normalizedPropertyKey);

        if (assignmentRecord && assignmentRecord.propertySnapshot && typeof assignmentRecord.propertySnapshot === 'object') {
            candidates.push(assignmentRecord.propertySnapshot);
        }

        getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key).forEach((item) => {
            const snapshot = item && item.propertySnapshot && typeof item.propertySnapshot === 'object'
                ? item.propertySnapshot
                : null;
            const itemPropertyKey = makePropertyStorageKey(
                snapshot?.address
                || item?.address
                || item?.propertyAddress
            );

            if (snapshot && itemPropertyKey === normalizedPropertyKey) {
                candidates.push(snapshot);
            }
        });

        getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key).forEach((item) => {
            const snapshot = item && item.propertySnapshot && typeof item.propertySnapshot === 'object'
                ? item.propertySnapshot
                : null;
            const itemPropertyKey = makePropertyStorageKey(
                item?.propertyKey
                || item?.propertyAddress
                || snapshot?.address
            );

            if (snapshot && itemPropertyKey === normalizedPropertyKey) {
                candidates.push(snapshot);
            }
        });

        const persistedDetail = getPersistedSelectedPropertyDetail();
        if (persistedDetail && typeof persistedDetail === 'object') {
            const persistedKey = makePropertyStorageKey(persistedDetail.address || persistedDetail.propertyAddress);
            if (persistedKey === normalizedPropertyKey) {
                candidates.push(persistedDetail);
            }
        }

        return candidates.find((candidate) => candidate && typeof candidate === 'object') || null;
    }

    function initOffersAcceptedWidget() {
        const offersAcceptedList = document.getElementById('dashboard-offers-accepted-list');
        if (!offersAcceptedList) {
            return;
        }

        const emailPrepRecipientNameInput = document.getElementById('agent-workspace-recipient-name');
        const emailPrepRecipientEmailInput = document.getElementById('agent-workspace-recipient-email');
        const emailPrepCard = document.querySelector('[data-widget-id="agent-email-prep"]');
        const canShareToEmailPrep = Boolean(emailPrepRecipientNameInput && emailPrepRecipientEmailInput && emailPrepCard);

        function openAcceptedProperty(snapshot, propertyAddress, statusValue) {
            const payload = buildDashboardPropertyDetailFallback(propertyAddress, statusValue, snapshot);
            persistSelectedPropertyDetail(payload);
            window.location.href = 'property-details.html';
        }

        function render() {
            const workspaceUser = getWorkspaceUserContext();
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            const acceptedItems = Object.entries(scopedStatuses || {})
                .map(([propertyKey, statusValue]) => ({
                    propertyKey: makePropertyStorageKey(propertyKey),
                    statusValue: String(statusValue || 'none').trim().toLowerCase()
                }))
                .filter((item) => item.propertyKey && item.statusValue === 'offer-accepted')
                .map((item) => {
                    const assignmentRecord = getPropertyAssignmentRecord(item.propertyKey);
                    const snapshot = getPropertySnapshotForWorkspace(item.propertyKey, workspaceUser);
                    const propertyAddress = String(
                        snapshot?.address
                        || assignmentRecord?.propertyAddress
                        || item.propertyKey
                    ).trim() || 'Property';
                    const acceptedAt = new Date(
                        assignmentRecord?.assignedAt
                        || snapshot?.updatedAt
                        || snapshot?.createdAt
                        || Date.now()
                    );
                    return {
                        ...item,
                        propertyAddress,
                        snapshot,
                        assignmentRecord,
                        acceptedAt: Number.isNaN(acceptedAt.getTime()) ? 0 : acceptedAt.getTime()
                    };
                })
                .sort((left, right) => right.acceptedAt - left.acceptedAt || left.propertyAddress.localeCompare(right.propertyAddress));

            offersAcceptedList.innerHTML = '';

            if (!acceptedItems.length) {
                offersAcceptedList.innerHTML = '<p class="outreach-empty">No accepted offers yet.</p>';
                return;
            }

            acceptedItems.forEach((item) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'agent-note-link';

                const snapshot = item.snapshot && typeof item.snapshot === 'object' ? item.snapshot : {};
                const acceptedTime = item.acceptedAt > 0
                    ? new Date(item.acceptedAt).toLocaleDateString()
                    : 'Recently updated';
                const statusLabel = formatAgentStatusLabel(item.statusValue);
                const locationLabel = String(snapshot.marketInfo || snapshot.location || snapshot.areaLabel || '-').trim() || '-';
                const priceLabel = String(snapshot.listPrice || '$0').trim() || '$0';
                const assignedLabel = item.assignmentRecord
                    ? buildAssignedByLabel(item.assignmentRecord)
                    : 'Click to open property details';

                const head = document.createElement('div');
                head.className = 'agent-note-link-head';

                const acceptedLabel = document.createElement('span');
                acceptedLabel.className = 'agent-note-link-agent';
                acceptedLabel.textContent = 'Accepted Offer';

                const timeText = document.createElement('span');
                timeText.className = 'agent-note-link-time';
                timeText.textContent = acceptedTime;

                const addressText = document.createElement('p');
                addressText.className = 'agent-note-link-address';
                addressText.textContent = item.propertyAddress;

                const statusText = document.createElement('p');
                statusText.className = 'agent-note-link-status';
                statusText.textContent = `Agent Status: ${statusLabel}`;

                const bodyText = document.createElement('p');
                bodyText.className = 'agent-note-link-body';
                bodyText.textContent = `${locationLabel} • ${priceLabel} • ${assignedLabel}`;

                head.appendChild(acceptedLabel);
                head.appendChild(timeText);

                if (canShareToEmailPrep) {
                    const shareButton = document.createElement('button');
                    shareButton.type = 'button';
                    shareButton.className = 'agent-note-share-btn';
                    shareButton.setAttribute('aria-label', `Share ${item.propertyAddress} agent to Email Prep`);
                    shareButton.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <path d="M8.59 13.51 15.42 17.49"></path>
                            <path d="M15.41 6.51 8.59 10.49"></path>
                        </svg>
                    `;

                    shareButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        const agentRecord = snapshot.agentRecord && typeof snapshot.agentRecord === 'object'
                            ? snapshot.agentRecord
                            : {};
                        const recipientName = String(agentRecord.name || '').trim();
                        const recipientEmail = String(agentRecord.email || '').trim();

                        if (!recipientName && !recipientEmail) {
                            showDashboardToast('error', 'Agent Missing', 'This accepted property does not have an agent name or email to send into Email Prep.');
                            return;
                        }

                        window.dispatchEvent(new CustomEvent('agent-workspace-email-prefill', {
                            detail: {
                                recipientName,
                                recipientEmail,
                                propertyAddress: item.propertyAddress
                            }
                        }));
                    });

                    head.appendChild(shareButton);
                }

                button.appendChild(head);
                button.appendChild(addressText);
                button.appendChild(statusText);
                button.appendChild(bodyText);

                button.addEventListener('click', () => {
                    openAcceptedProperty(snapshot, item.propertyAddress, item.statusValue);
                });

                offersAcceptedList.appendChild(button);
            });
        }

        render();
        window.addEventListener('storage', render);
        window.addEventListener('dashboard-data-updated', render);
        window.addEventListener('property-assignment-updated', render);
    }

    function collectOfferTermsSentPropertyKeys(scopedStatuses, notes) {
        const offerTermsSentSet = new Set();
        const safeStatuses = scopedStatuses && typeof scopedStatuses === 'object' && !Array.isArray(scopedStatuses)
            ? scopedStatuses
            : {};
        const safeNotes = Array.isArray(notes) ? notes : [];

        Object.entries(safeStatuses).forEach(([propertyKey, statusValue]) => {
            const normalizedKey = makePropertyStorageKey(propertyKey);
            const normalizedStatus = String(statusValue || 'none').trim().toLowerCase();
            if (normalizedKey && normalizedStatus === 'offer-terms-sent') {
                offerTermsSentSet.add(normalizedKey);
            }
        });

        safeNotes.forEach((note) => {
            const propertyKey = makePropertyStorageKey(
                note && (note.propertyKey || note.propertyAddress || note.propertySnapshot?.address)
            );
            if (!propertyKey) {
                return;
            }

            const noteStatus = String(
                safeStatuses[propertyKey]
                || (note && note.piqAgentStatus)
                || (note && note.propertySnapshot?.piqAgentStatus)
                || 'none'
            ).trim().toLowerCase();

            if (noteStatus === 'offer-terms-sent') {
                offerTermsSentSet.add(propertyKey);
            }
        });

        return offerTermsSentSet;
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
        const profitWindowTrackEl = document.getElementById('kpi-profit-window-track');
        const PROFIT_WINDOW_CONFIG = {
            week: { label: 'last 7 days', days: 7 },
            month: { label: 'last 30 days', days: 30 },
            quarter: { label: 'last 90 days', days: 90 },
            'six-month': { label: 'last 6 months', days: 183 },
            year: { label: 'last 12 months', days: 365 }
        };
        let activeProfitWindowState = getSelectedProfitWindow();

        function getSelectedProfitWindow() {
            const workspaceUser = getWorkspaceUserContext();
            const storedWindow = String(getUserScopedValue(ANALYTICS_PROFIT_WINDOW_KEY, workspaceUser.key, 'year') || 'year').trim().toLowerCase();
            return PROFIT_WINDOW_CONFIG[storedWindow] ? storedWindow : 'year';
        }

        function setSelectedProfitWindow(windowKey) {
            const workspaceUser = getWorkspaceUserContext();
            const normalizedWindow = String(windowKey || 'year').trim().toLowerCase();
            const nextWindow = PROFIT_WINDOW_CONFIG[normalizedWindow] ? normalizedWindow : 'year';
            activeProfitWindowState = nextWindow;
            setUserScopedValue(ANALYTICS_PROFIT_WINDOW_KEY, workspaceUser.key, nextWindow);
        }

        function getStateTimestamp(state) {
            return Number(state && (state.updatedAt || state.createdAt)) || 0;
        }

        function getProfitWindowRange(windowKey, now) {
            const config = PROFIT_WINDOW_CONFIG[windowKey] || PROFIT_WINDOW_CONFIG.year;
            return now - (config.days * 24 * 60 * 60 * 1000);
        }

        function getClosedDealTimestamp(item) {
            const rawTimestamp = Number(item && (item.closeDate || item.updatedAt || item.createdAt));
            if (Number.isFinite(rawTimestamp) && rawTimestamp > 0) {
                return rawTimestamp;
            }

            const parsedTimestamp = Date.parse(String(item && (item.closeDate || item.updatedAt || item.createdAt) || ''));
            return Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
        }

        function getClosedDealEarnedAmount(item) {
            return Math.max(parseMoneyValue(item && (item.earnedAmount ?? item.amountEarned ?? item.earned)), 0);
        }

        function syncProfitWindowUi(activeWindow) {
            profitWindowButtons.forEach((button) => {
                const isActive = button.dataset.profitWindow === activeWindow;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                button.setAttribute('role', 'tab');
                button.tabIndex = isActive ? 0 : -1;
            });

            if (profitWindowTrackEl) {
                profitWindowTrackEl.setAttribute('aria-activedescendant', `kpi-profit-window-${activeWindow}`);
            }
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
            const financingMode = String(state.financingMode || '100-95-13-excel-ia').trim().toLowerCase();
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
            const manualClosedDeals = getUserScopedItems(CLOSED_DEALS_KEY, workspaceUser.key);
            const scopedStatuses = getUserScopedObject(PIQ_AGENT_STATUS_KEY, workspaceUser.key);
            const rawProfitGoal = getUserScopedValue(ANALYTICS_PROFIT_GOAL_KEY, workspaceUser.key, '');
            const profitGoal = Math.max(parseMoneyValue(rawProfitGoal), 0);
            activeProfitWindowState = getSelectedProfitWindow();
            const activeProfitWindow = activeProfitWindowState;
            const now = Date.now();
            const profitWindowStart = getProfitWindowRange(activeProfitWindow, now);
            const windowedIaStates = iaStates.filter((state) => getStateTimestamp(state) >= profitWindowStart);
            const windowedClosedDeals = manualClosedDeals.filter((deal) => getClosedDealTimestamp(deal) >= profitWindowStart);
            const yearlyProfitStart = getProfitWindowRange('year', now);
            const yearlyIaStates = iaStates.filter((state) => getStateTimestamp(state) >= yearlyProfitStart);
            const yearlyClosedDeals = manualClosedDeals.filter((deal) => getClosedDealTimestamp(deal) >= yearlyProfitStart);

            const latestByProperty = new Map();
            const offerLeadSet = new Set();
            const offerTermsSentSet = collectOfferTermsSentPropertyKeys(scopedStatuses, notes);
            const offerRegex = /\boffer\b|submitted|sent/i;

            notes.forEach(note => {
                const propertyAddress = String(note.propertyAddress || '').trim();
                if (!propertyAddress) {
                    return;
                }
                const propertyKey = makePropertyStorageKey(note.propertyKey || propertyAddress);

                const createdAt = Number(note.createdAt) || 0;
                const existing = latestByProperty.get(propertyAddress);
                if (!existing || createdAt > (Number(existing.createdAt) || 0)) {
                    latestByProperty.set(propertyAddress, note);
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

            const windowedClosedDealEarnings = windowedClosedDeals.reduce((sum, deal) => sum + getClosedDealEarnedAmount(deal), 0);
            const myProfitsTotal = windowedIaStates.reduce((sum, state) => sum + calculateIaNetProfit(state), 0) + windowedClosedDealEarnings;
            const offerTermsSentCount = offerTermsSentSet.size;
            const offersSubmitted = offerLeadSet.size;
            const activeProfitWindowLabel = (PROFIT_WINDOW_CONFIG[activeProfitWindow] || PROFIT_WINDOW_CONFIG.year).label;

            myProfitsValueEl.textContent = formatMoney(myProfitsTotal);
            offerTermsSentEl.textContent = String(offerTermsSentCount);
            offersSubmittedEl.textContent = String(offersSubmitted);
            syncProfitWindowUi(activeProfitWindow);

            if (myProfitsChangeEl) {
                const iaDealText = `${windowedIaStates.length} saved IA deal${windowedIaStates.length === 1 ? '' : 's'}`;
                const closedDealText = `${windowedClosedDeals.length} closed deal earning${windowedClosedDeals.length === 1 ? '' : 's'}`;
                myProfitsChangeEl.textContent = `${iaDealText} • ${closedDealText} ${activeProfitWindowLabel}`;
            }
            if (profitGoalInputEl) {
                const formattedGoal = profitGoal > 0 ? Math.round(profitGoal).toLocaleString('en-US') : '';
                if (profitGoalInputEl !== document.activeElement || !String(profitGoalInputEl.value || '').trim()) {
                    profitGoalInputEl.value = formattedGoal;
                }
            }
            if (profitGoalMetaEl) {
                if (profitGoal > 0) {
                    const yearlyClosedDealEarnings = yearlyClosedDeals.reduce((sum, deal) => sum + getClosedDealEarnedAmount(deal), 0);
                    const yearlyProfitTotal = yearlyIaStates.reduce((sum, state) => sum + calculateIaNetProfit(state), 0) + yearlyClosedDealEarnings;
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

        function moveProfitWindowSelection(direction) {
            if (!profitWindowButtons.length) {
                return;
            }

            const orderedWindows = profitWindowButtons
                .map((button) => String(button.dataset.profitWindow || '').trim())
                .filter((windowKey) => PROFIT_WINDOW_CONFIG[windowKey]);
            const currentIndex = Math.max(0, orderedWindows.indexOf(activeProfitWindowState));
            const nextIndex = (currentIndex + direction + orderedWindows.length) % orderedWindows.length;
            const nextWindow = orderedWindows[nextIndex] || 'year';
            setSelectedProfitWindow(nextWindow);
            refreshKpis();
            const nextButton = profitWindowButtons.find((button) => button.dataset.profitWindow === nextWindow);
            if (nextButton) {
                nextButton.focus();
            }
        }

        if (profitGoalInputEl) {
            const persistProfitGoal = () => {
                const workspaceUser = getWorkspaceUserContext();
                const digitsOnly = String(profitGoalInputEl.value || '').replace(/[^0-9]/g, '');
                setUserScopedValue(ANALYTICS_PROFIT_GOAL_KEY, workspaceUser.key, digitsOnly);
                return digitsOnly;
            };

            profitGoalInputEl.addEventListener('input', () => {
                const digitsOnly = String(profitGoalInputEl.value || '').replace(/[^0-9]/g, '');
                profitGoalInputEl.value = digitsOnly ? Number(digitsOnly).toLocaleString('en-US') : '';
                persistProfitGoal();
            });

            profitGoalInputEl.addEventListener('change', () => {
                persistProfitGoal();
                refreshKpis();
            });

            profitGoalInputEl.addEventListener('blur', () => {
                persistProfitGoal();
                refreshKpis();
            });

            profitGoalInputEl.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter') {
                    return;
                }

                event.preventDefault();
                persistProfitGoal();
                refreshKpis();
                profitGoalInputEl.blur();
            });
        }

        profitWindowButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setSelectedProfitWindow(button.dataset.profitWindow);
                refreshKpis();
            });

            button.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveProfitWindowSelection(1);
                    return;
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveProfitWindowSelection(-1);
                    return;
                }
                if (event.key === 'Home') {
                    event.preventDefault();
                    setSelectedProfitWindow('week');
                    refreshKpis();
                    const firstButton = profitWindowButtons.find((entry) => entry.dataset.profitWindow === 'week');
                    if (firstButton) {
                        firstButton.focus();
                    }
                    return;
                }
                if (event.key === 'End') {
                    event.preventDefault();
                    setSelectedProfitWindow('year');
                    refreshKpis();
                    const lastButton = profitWindowButtons.find((entry) => entry.dataset.profitWindow === 'year');
                    if (lastButton) {
                        lastButton.focus();
                    }
                }
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
        const dealWholesaleFeeInput = document.getElementById('closed-deal-wholesale-fee');
        const dealEarnedInput = document.getElementById('closed-deal-earned');
        const dealNoteInput = document.getElementById('closed-deal-note');
        const dealDocumentUploadInput = document.getElementById('closed-deal-document-upload');
        const dealDocumentUploadButton = document.getElementById('closed-deal-upload-btn');
        const pendingDocsEl = document.getElementById('closed-deal-pending-docs');
        const saveButton = document.getElementById('closed-deal-save-btn');
        const feesTotalEl = document.getElementById('analytics-closed-deals-fees-total');
        const earnedTotalEl = document.getElementById('analytics-closed-deals-earned-total');
        const listEl = document.getElementById('analytics-closed-deals-list');
        const myFileListEl = document.getElementById('analytics-my-file-list');
        const myFileCountEl = document.getElementById('analytics-my-file-count');

        if (!closedDealsValueEl || !closedDealsChangeEl || !listEl) {
            return;
        }

        const workspaceUser = getWorkspaceUserContext();
        let pendingUploads = [];

        function getManualClosedDeals() {
            return getUserScopedItems(CLOSED_DEALS_KEY, workspaceUser.key);
        }

        function setManualClosedDeals(items) {
            setUserScopedItems(CLOSED_DEALS_KEY, workspaceUser.key, items);
        }

        function getClosedDealDraft() {
            const savedDraft = getUserScopedValue(ANALYTICS_CLOSED_DEAL_DRAFT_KEY, workspaceUser.key, null);
            if (!savedDraft || typeof savedDraft !== 'object' || Array.isArray(savedDraft)) {
                return null;
            }

            return {
                title: String(savedDraft.title || ''),
                closeDate: String(savedDraft.closeDate || ''),
                wholesaleFee: String(savedDraft.wholesaleFee || ''),
                earnedAmount: String(savedDraft.earnedAmount || ''),
                note: String(savedDraft.note || ''),
                documents: normalizeClosedDealDocuments(savedDraft)
            };
        }

        function saveClosedDealDraft() {
            setUserScopedValue(ANALYTICS_CLOSED_DEAL_DRAFT_KEY, workspaceUser.key, {
                title: String(dealNameInput && dealNameInput.value || ''),
                closeDate: String(dealDateInput && dealDateInput.value || ''),
                wholesaleFee: String(dealWholesaleFeeInput && dealWholesaleFeeInput.value || ''),
                earnedAmount: String(dealEarnedInput && dealEarnedInput.value || ''),
                note: String(dealNoteInput && dealNoteInput.value || ''),
                documents: normalizeClosedDealDocuments({ documents: pendingUploads })
            });
        }

        function clearClosedDealDraft() {
            setUserScopedValue(ANALYTICS_CLOSED_DEAL_DRAFT_KEY, workspaceUser.key, null);
        }

        function applyClosedDealDraft() {
            const draft = getClosedDealDraft();
            if (!draft) {
                return;
            }

            if (dealNameInput) {
                dealNameInput.value = draft.title;
            }
            if (dealDateInput) {
                dealDateInput.value = draft.closeDate;
            }
            if (dealWholesaleFeeInput) {
                dealWholesaleFeeInput.value = formatMoneyInputValue(draft.wholesaleFee);
            }
            if (dealEarnedInput) {
                dealEarnedInput.value = formatMoneyInputValue(draft.earnedAmount);
            }
            if (dealNoteInput) {
                dealNoteInput.value = draft.note;
            }

            pendingUploads = normalizeClosedDealDocuments({ documents: draft.documents });
        }

        function formatClosedDealDate(value) {
            const parsedTimestamp = typeof value === 'number' ? value : Date.parse(String(value || ''));
            if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) {
                return 'Date not set';
            }
            return new Date(parsedTimestamp).toLocaleDateString();
        }

        function parseClosedDealMoney(value) {
            return Math.max(parseMoneyValue(value), 0);
        }

        function formatMoneyInputValue(value) {
            const amount = parseClosedDealMoney(value);
            return amount > 0 ? formatMoney(amount) : '';
        }

        function attachMoneyFormatter(input) {
            if (!input) {
                return;
            }

            const syncValue = () => {
                input.value = formatMoneyInputValue(input.value);
            };

            input.addEventListener('blur', syncValue);
            input.addEventListener('change', syncValue);
        }

        function getClosedDealFinancials(item) {
            return {
                wholesaleFee: parseClosedDealMoney(item && item.wholesaleFee),
                earnedAmount: parseClosedDealMoney(item && (item.earnedAmount ?? item.amountEarned ?? item.earned))
            };
        }

        function normalizeClosedDealDocuments(item) {
            if (!Array.isArray(item && item.documents)) {
                return [];
            }

            return item.documents
                .map((documentItem) => ({
                    id: String(documentItem && documentItem.id || ''),
                    fileName: String(documentItem && (documentItem.fileName || documentItem.label) || 'Document').trim() || 'Document',
                    label: String(documentItem && (documentItem.label || documentItem.fileName) || 'Document').trim() || 'Document',
                    fileSize: Math.max(Number(documentItem && documentItem.fileSize) || 0, 0),
                    fileType: String(documentItem && documentItem.fileType || '').trim(),
                    storage: String(documentItem && documentItem.storage || 'indexeddb').trim() || 'indexeddb',
                    contentBase64: String(documentItem && documentItem.contentBase64 || '').trim(),
                    createdAt: Number(documentItem && documentItem.createdAt) || Date.now()
                }))
                .filter((documentItem) => documentItem.id && (documentItem.storage !== 'inline-base64' || documentItem.contentBase64));
        }

        async function createStoredClosedDealDocument(file) {
            const documentId = `closed-deal-doc-${Date.now()}-${Math.round(Math.random() * 10000)}`;
            const fileName = String(file && file.name || 'Document').trim() || 'Document';
            const fileSize = Math.max(Number(file && file.size) || 0, 0);
            const fileType = String(file && file.type || '').trim() || 'File';

            try {
                await putOfferDocumentBlob(documentId, file);
                return {
                    id: documentId,
                    label: fileName,
                    fileName,
                    fileSize,
                    fileType,
                    storage: 'indexeddb',
                    createdAt: Date.now()
                };
            } catch (storageError) {
                if (fileSize > CLOSED_DEAL_INLINE_DOCUMENT_MAX_BYTES) {
                    throw new Error('This file is too large for the current browser storage fallback.');
                }

                const contentBase64 = await readBlobAsBase64(file);
                return {
                    id: documentId,
                    label: fileName,
                    fileName,
                    fileSize,
                    fileType,
                    storage: 'inline-base64',
                    contentBase64,
                    createdAt: Date.now()
                };
            }
        }

        function renderPendingUploads() {
            if (!pendingDocsEl) {
                return;
            }

            pendingDocsEl.innerHTML = '';
            if (!pendingUploads.length) {
                pendingDocsEl.innerHTML = '<p class="closed-deals-docs-empty">No documents selected for this deal yet.</p>';
                return;
            }

            pendingUploads.forEach((fileItem) => {
                const card = document.createElement('div');
                card.className = 'closed-deals-doc-item';

                const head = document.createElement('div');
                head.className = 'closed-deals-doc-item-head';

                const copy = document.createElement('div');
                const name = document.createElement('strong');
                name.className = 'closed-deals-doc-name';
                name.textContent = fileItem.fileName || fileItem.label || 'Selected Document';
                const meta = document.createElement('span');
                meta.className = 'closed-deals-doc-meta';
                meta.textContent = [formatFileSize(fileItem.fileSize), fileItem.fileType || 'File'].filter(Boolean).join(' • ');
                copy.appendChild(name);
                copy.appendChild(meta);

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'closed-deals-doc-remove';
                removeButton.textContent = 'Remove';
                removeButton.addEventListener('click', async () => {
                    try {
                        await deleteClosedDealDocumentBlobs([fileItem]);
                    } catch (error) {
                        showDashboardToast('error', 'Delete Failed', 'The draft document could not be removed from browser storage.');
                        return;
                    }
                    pendingUploads = pendingUploads.filter((pendingItem) => pendingItem.id !== fileItem.id);
                    saveClosedDealDraft();
                    renderPendingUploads();
                });

                head.appendChild(copy);
                head.appendChild(removeButton);
                card.appendChild(head);
                pendingDocsEl.appendChild(card);
            });
        }

        async function openStoredClosedDealDocument(documentItem, download = false) {
            let blob = null;

            if (documentItem.storage === 'inline-base64') {
                blob = createBlobFromBase64(documentItem.contentBase64, documentItem.fileType);
            } else {
                blob = await getOfferDocumentBlob(documentItem.id);
            }

            if (!blob) {
                showDashboardToast('error', 'File Missing', 'This saved closed-deal document is no longer available in browser storage.');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            if (download) {
                link.download = documentItem.fileName || documentItem.label || 'closed-deal-document';
            } else {
                link.target = '_blank';
                link.rel = 'noopener';
            }
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        }

        async function deleteClosedDealDocumentBlobs(documents) {
            for (const documentItem of documents) {
                if (documentItem.storage === 'indexeddb' && documentItem.id) {
                    await deleteOfferDocumentBlob(documentItem.id);
                }
            }
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
                        wholesaleFee: 0,
                        earnedAmount: 0,
                        source: 'auto',
                        manual: false
                    };
                });
        }

        function buildCombinedClosedDeals() {
            const manualDeals = getManualClosedDeals().map((item) => {
                const title = String(item.title || item.propertyAddress || '').trim() || 'Closed Deal';
                const financials = getClosedDealFinancials(item);
                return {
                    id: String(item.id || `manual-${Date.now()}`),
                    key: makePropertyStorageKey(title),
                    title,
                    closeDate: item.closeDate || item.createdAt || Date.now(),
                    note: String(item.note || '').trim(),
                    wholesaleFee: financials.wholesaleFee,
                    earnedAmount: financials.earnedAmount,
                    documents: normalizeClosedDealDocuments(item),
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
                        wholesaleFee: deal.wholesaleFee || existing.wholesaleFee || 0,
                        earnedAmount: deal.earnedAmount || existing.earnedAmount || 0,
                        documents: Array.isArray(deal.documents) && deal.documents.length ? deal.documents : (existing.documents || []),
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

        function createClosedDealDocumentCard(documentItem) {
            const documentCard = document.createElement('div');
            documentCard.className = 'closed-deal-document-item';

            const documentHead = document.createElement('div');
            documentHead.className = 'closed-deal-document-head';

            const copy = document.createElement('div');
            const name = document.createElement('strong');
            name.className = 'closed-deal-document-name';
            name.textContent = documentItem.fileName || documentItem.label || 'Saved Document';
            const meta = document.createElement('span');
            meta.className = 'closed-deal-document-meta';
            meta.textContent = [formatFileSize(documentItem.fileSize), documentItem.fileType || 'File'].filter(Boolean).join(' • ');
            copy.appendChild(name);
            copy.appendChild(meta);
            documentHead.appendChild(copy);
            documentCard.appendChild(documentHead);

            const actions = document.createElement('div');
            actions.className = 'closed-deal-document-actions';

            const openButton = document.createElement('button');
            openButton.type = 'button';
            openButton.className = 'closed-deal-document-btn';
            openButton.textContent = 'Open';
            openButton.addEventListener('click', async () => {
                await openStoredClosedDealDocument(documentItem, false);
            });

            const downloadButton = document.createElement('button');
            downloadButton.type = 'button';
            downloadButton.className = 'closed-deal-document-btn';
            downloadButton.textContent = 'Download';
            downloadButton.addEventListener('click', async () => {
                await openStoredClosedDealDocument(documentItem, true);
            });

            actions.appendChild(openButton);
            actions.appendChild(downloadButton);
            documentCard.appendChild(actions);

            return documentCard;
        }

        function createClosedDealCard(deal, options = {}) {
            const { allowRemove = true } = options;

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

            if (parseClosedDealMoney(deal.wholesaleFee) > 0 || parseClosedDealMoney(deal.earnedAmount) > 0) {
                const financials = document.createElement('div');
                financials.className = 'closed-deal-item-financials';

                const feeItem = document.createElement('div');
                feeItem.className = 'closed-deal-item-financial';
                feeItem.innerHTML = `<span class="closed-deal-item-financial-label">Wholesale Fee</span><strong class="closed-deal-item-financial-value">${formatMoney(parseClosedDealMoney(deal.wholesaleFee))}</strong>`;

                const earnedItem = document.createElement('div');
                earnedItem.className = 'closed-deal-item-financial';
                earnedItem.innerHTML = `<span class="closed-deal-item-financial-label">Net Earned</span><strong class="closed-deal-item-financial-value">${formatMoney(parseClosedDealMoney(deal.earnedAmount))}</strong>`;

                financials.appendChild(feeItem);
                financials.appendChild(earnedItem);
                card.appendChild(financials);
            }

            if (deal.note) {
                const note = document.createElement('p');
                note.className = 'closed-deal-item-note';
                note.textContent = deal.note;
                card.appendChild(note);
            }

            if (Array.isArray(deal.documents) && deal.documents.length) {
                deal.documents.forEach((documentItem) => {
                    card.appendChild(createClosedDealDocumentCard(documentItem));
                });
            }

            if (allowRemove && deal.manual) {
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'closed-deal-remove-btn';
                removeButton.textContent = 'Remove manual entry';
                removeButton.addEventListener('click', async () => {
                    try {
                        await deleteClosedDealDocumentBlobs(Array.isArray(deal.documents) ? deal.documents : []);
                    } catch (error) {
                        showDashboardToast('error', 'Delete Failed', 'The closed-deal documents could not be removed from browser storage.');
                        return;
                    }

                    const nextItems = getManualClosedDeals().filter((item) => String(item.id || '') !== String(deal.id || ''));
                    setManualClosedDeals(nextItems);
                    renderClosedDeals();
                });
                card.appendChild(removeButton);
            }

            return card;
        }

        function renderClosedDealList(container, deals, options = {}) {
            const { emptyMessage, allowRemove = true } = options;

            if (!container) {
                return;
            }

            container.innerHTML = '';
            if (!deals.length) {
                container.innerHTML = `<p class="outreach-empty">${emptyMessage}</p>`;
                return;
            }

            deals.forEach((deal) => {
                container.appendChild(createClosedDealCard(deal, { allowRemove }));
            });
        }

        function hasClosedDealArchiveContent(deal) {
            if (!deal || typeof deal !== 'object') {
                return false;
            }

            if (deal.manual) {
                return true;
            }

            return Array.isArray(deal.documents) && deal.documents.length > 0;
        }

        function buildFiledClosedDeals() {
            const manualFiledDeals = getManualClosedDeals().map((item) => {
                const title = String(item.title || item.propertyAddress || '').trim() || 'Closed Deal';
                const financials = getClosedDealFinancials(item);
                return {
                    id: String(item.id || `manual-${Date.now()}`),
                    key: makePropertyStorageKey(title) || String(item.id || title),
                    title,
                    closeDate: item.closeDate || item.createdAt || Date.now(),
                    note: String(item.note || '').trim(),
                    wholesaleFee: financials.wholesaleFee,
                    earnedAmount: financials.earnedAmount,
                    documents: normalizeClosedDealDocuments(item),
                    source: 'manual',
                    manual: true,
                    createdAt: Number(item.createdAt) || Date.now()
                };
            });

            const supplementalDeals = buildCombinedClosedDeals().filter((deal) => {
                if (!deal || typeof deal !== 'object') {
                    return false;
                }
                if (deal.manual) {
                    return false;
                }
                return Array.isArray(deal.documents) && deal.documents.length > 0;
            });

            return [...manualFiledDeals, ...supplementalDeals]
                .sort((left, right) => (Number(right.closeDate) || Date.parse(right.closeDate) || 0) - (Number(left.closeDate) || Date.parse(left.closeDate) || 0));
        }

        function renderClosedDeals() {
            const manualDeals = getManualClosedDeals();
            const autoDeals = buildAutoClosedDeals();
            const combinedDeals = buildCombinedClosedDeals();
            const filedDeals = buildFiledClosedDeals().filter((deal) => hasClosedDealArchiveContent(deal));
            const filedDocumentCount = filedDeals.reduce((total, deal) => total + deal.documents.length, 0);
            const combinedTotals = combinedDeals.reduce((totals, deal) => {
                totals.wholesaleFee += parseClosedDealMoney(deal.wholesaleFee);
                totals.earnedAmount += parseClosedDealMoney(deal.earnedAmount);
                return totals;
            }, { wholesaleFee: 0, earnedAmount: 0 });

            closedDealsValueEl.textContent = String(combinedDeals.length);
            closedDealsChangeEl.textContent = `${autoDeals.length} auto closed deal${autoDeals.length === 1 ? '' : 's'} • ${manualDeals.length} manual • ${formatMoney(combinedTotals.earnedAmount)} earned`;

            if (feesTotalEl) {
                feesTotalEl.textContent = formatMoney(combinedTotals.wholesaleFee);
            }
            if (earnedTotalEl) {
                earnedTotalEl.textContent = formatMoney(combinedTotals.earnedAmount);
            }

            if (myFileCountEl) {
                myFileCountEl.textContent = `${filedDeals.length} saved deal${filedDeals.length === 1 ? '' : 's'} • ${filedDocumentCount} doc${filedDocumentCount === 1 ? '' : 's'}`;
            }

            renderClosedDealList(listEl, combinedDeals, {
                emptyMessage: 'No closed deals recorded yet.',
                allowRemove: true
            });
            renderClosedDealList(myFileListEl, filedDeals, {
                emptyMessage: 'No saved closed deals yet. Record a close here and its details and attachments will appear in My File.',
                allowRemove: false
            });
        }

        applyClosedDealDraft();

        if (dealDateInput && !dealDateInput.value) {
            dealDateInput.value = new Date().toISOString().slice(0, 10);
        }

        attachMoneyFormatter(dealWholesaleFeeInput);
        attachMoneyFormatter(dealEarnedInput);
        renderPendingUploads();

        [dealNameInput, dealDateInput, dealWholesaleFeeInput, dealEarnedInput, dealNoteInput]
            .filter(Boolean)
            .forEach((input) => {
                input.addEventListener('input', saveClosedDealDraft);
                input.addEventListener('change', saveClosedDealDraft);
                input.addEventListener('blur', saveClosedDealDraft);
            });

        function openClosedDealDocumentPicker() {
            if (!dealDocumentUploadInput) {
                return;
            }

            try {
                if (typeof dealDocumentUploadInput.showPicker === 'function') {
                    dealDocumentUploadInput.showPicker();
                    return;
                }
            } catch (error) {
            }

            dealDocumentUploadInput.click();
        }

        if (dealDocumentUploadButton && dealDocumentUploadInput) {
            dealDocumentUploadButton.addEventListener('click', () => {
                openClosedDealDocumentPicker();
            });

            dealDocumentUploadButton.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }
                event.preventDefault();
                openClosedDealDocumentPicker();
            });

            dealDocumentUploadInput.addEventListener('change', async () => {
                const files = Array.from(dealDocumentUploadInput.files || []);
                if (!files.length) {
                    dealDocumentUploadInput.value = '';
                    return;
                }

                dealDocumentUploadInput.value = '';
                const nextUploads = [];

                try {
                    for (const file of files) {
                        nextUploads.push(await createStoredClosedDealDocument(file));
                    }
                } catch (error) {
                    try {
                        await deleteClosedDealDocumentBlobs(nextUploads);
                    } catch (cleanupError) {
                    }
                    showDashboardToast('error', 'Upload Failed', error && error.message ? error.message : 'The browser could not store one or more closed-deal documents.');
                    return;
                }

                pendingUploads = [...pendingUploads, ...nextUploads];
                saveClosedDealDraft();
                renderPendingUploads();
                showDashboardToast('success', 'Documents Added', `${nextUploads.length} file${nextUploads.length === 1 ? '' : 's'} ready to save with this closed deal.`);
            });
        }

        if (saveButton && dealNameInput && dealDateInput && dealNoteInput) {
            saveButton.addEventListener('click', async () => {
                const title = String(dealNameInput.value || '').trim();
                const closeDate = String(dealDateInput.value || '').trim();
                const wholesaleFee = parseClosedDealMoney(dealWholesaleFeeInput && dealWholesaleFeeInput.value);
                const earnedAmount = parseClosedDealMoney(dealEarnedInput && dealEarnedInput.value);
                const note = String(dealNoteInput.value || '').trim();

                if (!title) {
                    showDashboardToast('error', 'Deal Name Required', 'Add the property address or deal name before saving.');
                    return;
                }

                const uploadedDocuments = normalizeClosedDealDocuments({ documents: pendingUploads });

                const items = getManualClosedDeals();
                items.push({
                    id: `closed-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                    title,
                    propertyAddress: title,
                    closeDate: closeDate || new Date().toISOString().slice(0, 10),
                    wholesaleFee,
                    earnedAmount,
                    documents: uploadedDocuments,
                    note,
                    createdAt: Date.now()
                });

                setManualClosedDeals(items);
                pendingUploads = [];
                clearClosedDealDraft();
                dealNameInput.value = '';
                if (dealWholesaleFeeInput) {
                    dealWholesaleFeeInput.value = '';
                }
                if (dealEarnedInput) {
                    dealEarnedInput.value = '';
                }
                dealNoteInput.value = '';
                dealDateInput.value = new Date().toISOString().slice(0, 10);
                renderPendingUploads();
                renderClosedDeals();
                showDashboardToast('success', 'Closed Deal Saved', 'The deal was added to Closed Deals and the My File archive.');
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
        const variableTiltSelector = '.subscription-plan-card';
        const standardTiltSelector = '.glass-card-3d, .legal-hover-card';

        document.querySelectorAll(`${standardTiltSelector}, ${variableTiltSelector}`).forEach(card => {
            if (card.dataset.tiltInitialized === 'true') {
                return;
            }

            card.dataset.tiltInitialized = 'true';

            const usesVariableTilt = card.matches(variableTiltSelector);

            const resetTilt = () => {
                if (usesVariableTilt) {
                    card.style.setProperty('--tilt-rotate-x', '0deg');
                    card.style.setProperty('--tilt-rotate-y', '0deg');
                    card.style.setProperty('--tilt-depth', '0px');
                    return;
                }

                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            };

            card.addEventListener('pointermove', (event) => {
                if (event.pointerType && event.pointerType !== 'mouse') {
                    return;
                }

                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                if (usesVariableTilt) {
                    const maxTilt = Number.parseFloat(card.dataset.tiltMax)
                        || (card.classList.contains('subscription-billing-section') ? 4 : 6);
                    const depth = Number.parseFloat(card.dataset.tiltDepth)
                        || (card.classList.contains('subscription-hero-premium') ? 16 : card.classList.contains('subscription-plan-card') ? 14 : 10);
                    const normalizedX = rect.width > 0 ? (x / rect.width) - 0.5 : 0;
                    const normalizedY = rect.height > 0 ? (y / rect.height) - 0.5 : 0;
                    const rotateX = (normalizedY * -2 * maxTilt).toFixed(2);
                    const rotateY = (normalizedX * 2 * maxTilt).toFixed(2);

                    card.style.setProperty('--tilt-rotate-x', `${rotateX}deg`);
                    card.style.setProperty('--tilt-rotate-y', `${rotateY}deg`);
                    card.style.setProperty('--tilt-depth', `${depth}px`);
                    return;
                }

                const divisor = Number.parseFloat(card.dataset.tiltDivisor) || 20;
                const depth = Number.parseFloat(card.dataset.tiltDepth) || 10;
                const maxTilt = Number.parseFloat(card.dataset.tiltMax);
                const lift = Number.parseFloat(card.dataset.tiltLift);
                const scale = Number.parseFloat(card.dataset.tiltScale);
                const inwardTiltDirection = card.classList.contains('legal-hover-card') ? -1 : 1;
                const resolvedLift = Number.isFinite(lift)
                    ? lift
                    : (card.classList.contains('legal-hover-card') ? -3 : 0);
                const resolvedScale = Number.isFinite(scale)
                    ? scale
                    : (card.classList.contains('legal-hover-card') ? 1.01 : 1);

                const clamp = (value) => {
                    if (!Number.isFinite(maxTilt) || maxTilt <= 0) {
                        return value;
                    }
                    return Math.max(-maxTilt, Math.min(maxTilt, value));
                };

                const rotateX = clamp(((y - centerY) / divisor) * inwardTiltDirection);
                const rotateY = clamp(((centerX - x) / divisor) * inwardTiltDirection);

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${depth}px) translateY(${resolvedLift}px) scale(${resolvedScale})`;
            });

            card.addEventListener('pointerleave', resetTilt);
            card.addEventListener('pointercancel', resetTilt);
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

    function initSidebarCollapse() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            return;
        }

        const sidebarFooter = sidebar.querySelector('.sidebar-footer');
        if (!sidebarFooter) {
            return;
        }

        const desktopQuery = window.matchMedia('(max-width: 992px)');
        const workspaceUser = getWorkspaceUserContext();
        const storedState = getUserScopedObject(SIDEBAR_STATE_KEY, workspaceUser.key);
        let isCollapsed = Boolean(storedState.collapsed);

        let button = sidebar.querySelector('[data-sidebar-collapse-button="true"]');
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'sidebar-collapse-button';
            button.dataset.sidebarCollapseButton = 'true';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6"></path>
                </svg>
                <span class="sidebar-collapse-button-label">Collapse Sidebar</span>
            `;
            sidebarFooter.appendChild(button);
        }

        Array.from(sidebar.querySelectorAll('.nav-link')).forEach((link) => {
            if (link.getAttribute('title')) {
                return;
            }
            const label = String(link.textContent || '').replace(/\s+/g, ' ').trim();
            if (label) {
                link.setAttribute('title', label);
            }
        });

        const label = button.querySelector('.sidebar-collapse-button-label');
        const icon = button.querySelector('svg');

        function persistState(nextCollapsed) {
            setUserScopedObject(SIDEBAR_STATE_KEY, workspaceUser.key, {
                collapsed: Boolean(nextCollapsed),
                updatedAt: Date.now()
            });
        }

        function applyCollapsedState(nextCollapsed, options) {
            const config = options && typeof options === 'object' ? options : {};
            isCollapsed = Boolean(nextCollapsed);
            const shouldCollapse = isCollapsed && !desktopQuery.matches;

            document.documentElement.setAttribute('data-sidebar-collapsed', shouldCollapse ? 'on' : 'off');
            document.body.classList.toggle('sidebar-collapsed', shouldCollapse);
            sidebar.classList.toggle('sidebar-collapsed', shouldCollapse);

            if (label) {
                label.textContent = shouldCollapse ? 'Expand Sidebar' : 'Collapse Sidebar';
            }

            if (icon) {
                icon.style.transform = shouldCollapse ? 'rotate(180deg)' : 'rotate(0deg)';
            }

            button.setAttribute('aria-pressed', shouldCollapse ? 'true' : 'false');
            button.setAttribute('aria-label', shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar');

            if (config.persist !== false) {
                persistState(isCollapsed);
            }
        }

        button.addEventListener('click', () => {
            applyCollapsedState(!isCollapsed);
        });

        const syncResponsiveState = () => {
            applyCollapsedState(isCollapsed, { persist: false });
        };

        if (desktopQuery.addEventListener) {
            desktopQuery.addEventListener('change', syncResponsiveState);
        } else if (desktopQuery.addListener) {
            desktopQuery.addListener(syncResponsiveState);
        }

        applyCollapsedState(isCollapsed, { persist: false });
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

        const storedUser = getStoredCurrentUserIdentity();
        const lockedTabs = isRegularUserRole(storedUser.role)
            ? new Set(['appearance'])
            : new Set();
        const lockedTabLabels = {
            appearance: 'Appearance settings'
        };

        function activateSettingsTab(tabId) {
            const requestedTabId = String(tabId || '').trim().toLowerCase() || 'profile';
            const normalizedTabId = lockedTabs.has(requestedTabId) ? 'subscriptions' : requestedTabId;

            document.querySelectorAll('.settings-nav-link').forEach(navLink => {
                navLink.classList.toggle('active', navLink.getAttribute('data-tab') === normalizedTabId);
            });

            document.querySelectorAll('.settings-tab-content').forEach(tab => {
                tab.classList.toggle('active', tab.id === 'tab-' + normalizedTabId);
            });
        }

        tabLinks.forEach(link => {
            const tabId = String(link.getAttribute('data-tab') || '').trim().toLowerCase();
            if (lockedTabs.has(tabId)) {
                link.classList.add('nav-link-locked');
                link.setAttribute('title', 'upgrade to premium');
                link.setAttribute('aria-disabled', 'true');
                if (typeof window.attachPremiumUpgradeTooltip === 'function') {
                    window.attachPremiumUpgradeTooltip(link);
                }
            }

            link.addEventListener('click', event => {
                event.preventDefault();
                const tabId = link.getAttribute('data-tab');
                const normalizedTabId = String(tabId || '').trim().toLowerCase();
                if (lockedTabs.has(normalizedTabId)) {
                    const tabLabel = lockedTabLabels[normalizedTabId] || 'This tab';
                    showDashboardToast('error', 'Access Locked', `${tabLabel} are locked for Basic accounts. Upgrade to Premium to unlock them.`);
                    activateSettingsTab('subscriptions');
                    return;
                }
                activateSettingsTab(tabId);
            });
        });

        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        if (requestedTab) {
            activateSettingsTab(requestedTab);
        }

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
        const tabsToPersist = ['tab-security', 'tab-notifications', 'tab-subscriptions', 'tab-appearance'];

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
                return controlType !== 'password' && controlType !== 'file' && control.dataset.settingsTransient !== 'true';
            });

            controls.forEach(control => {
                const key = getControlStateKey(control);
                if (Object.prototype.hasOwnProperty.call(settingsState, key)) {
                    if (control.type === 'checkbox') {
                        control.checked = Boolean(settingsState[key]);
                    } else if (control.type === 'radio') {
                        control.checked = String(settingsState[key]) === String(control.value);
                    } else {
                        control.value = String(settingsState[key]);
                    }
                }

                const persist = () => {
                    if (control.type === 'checkbox') {
                        settingsState[key] = Boolean(control.checked);
                    } else if (control.type === 'radio') {
                        if (!control.checked) {
                            return;
                        }
                        settingsState[key] = control.value;
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

        function initSecuritySettingsControls() {
            const token = String((window.getAuthToken && window.getAuthToken()) || localStorage.getItem('authToken') || '').trim();
            const passwordStatus = document.getElementById('security-password-status');
            const currentPassword = document.getElementById('security-current-password');
            const newPassword = document.getElementById('security-new-password');
            const confirmPassword = document.getElementById('security-confirm-password');
            const passwordSave = document.getElementById('security-password-save');
            const passwordReset = document.getElementById('security-password-reset');
            const enable2fa = document.getElementById('security-2fa-enable');
            const app2fa = document.getElementById('security-2fa-app');
            const setupKeyInput = document.getElementById('security-2fa-setup-key');
            const codeInput = document.getElementById('security-2fa-code');
            const setupButton = document.getElementById('security-2fa-setup-btn');
            const verifyButton = document.getElementById('security-2fa-verify-btn');
            const twoFactorStatus = document.getElementById('security-2fa-status');
            const sessionsStatus = document.getElementById('security-sessions-status');
            const sessionsList = document.getElementById('security-sessions-list');
            const sessionsRefresh = document.getElementById('security-sessions-refresh');

            if (!passwordSave || !passwordReset || !enable2fa || !app2fa || !setupKeyInput || !codeInput || !setupButton || !verifyButton || !twoFactorStatus || !sessionsStatus || !sessionsList || !sessionsRefresh) {
                return;
            }

            let securitySettings = {
                enabled: false,
                appEnabled: false,
                appVerified: false,
                hasSecret: false,
                setupKey: ''
            };

            const setPasswordStatus = (message, isError) => {
                if (!passwordStatus) {
                    return;
                }
                passwordStatus.textContent = String(message || '');
                passwordStatus.style.color = isError ? '#ef4444' : '';
            };

            const setTwoFactorStatus = (message, isError) => {
                twoFactorStatus.textContent = String(message || '');
                twoFactorStatus.style.color = isError ? '#ef4444' : '';
            };

            const formatSessionTime = (value) => {
                if (!value) {
                    return 'Unknown';
                }
                const parsed = new Date(value);
                if (Number.isNaN(parsed.getTime())) {
                    return String(value);
                }
                return parsed.toLocaleString();
            };

            const sync2faUi = () => {
                const enabled = Boolean(securitySettings.enabled);
                const appReady = Boolean(securitySettings.appVerified && securitySettings.hasSecret);

                enable2fa.checked = enabled;
                app2fa.checked = Boolean(securitySettings.appEnabled || appReady || securitySettings.hasSecret);
                app2fa.disabled = true;
                setupKeyInput.value = securitySettings.setupKey || '';

                if (appReady && enabled) {
                    setTwoFactorStatus('Two-factor authentication is on. Authenticator app verification is active for this account.', false);
                } else if (appReady) {
                    setTwoFactorStatus('Authenticator app is verified. Turn on 2FA to require the code at sign-in.', false);
                } else if (securitySettings.hasSecret) {
                    setTwoFactorStatus('Setup key generated. Enter a current 6-digit code from your authenticator app to finish verification.', false);
                } else {
                    setTwoFactorStatus('Two-factor authentication is currently turned off.', false);
                }

                verifyButton.disabled = !securitySettings.hasSecret;
            };

            const securityFetch = async (url, options = {}) => {
                const authToken = String((window.getAuthToken && window.getAuthToken()) || localStorage.getItem('authToken') || '').trim();
                if (!authToken) {
                    throw new Error('Sign in again to manage account security.');
                }
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`,
                        ...(options.headers || {})
                    }
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Security request failed.');
                }
                return data;
            };

            const loadTwoFactorSettings = async () => {
                try {
                    const data = await securityFetch('/api/security/2fa', { method: 'GET' });
                    securitySettings = {
                        enabled: Boolean(data.settings?.enabled),
                        appEnabled: Boolean(data.settings?.appEnabled),
                        appVerified: Boolean(data.settings?.appVerified),
                        hasSecret: Boolean(data.settings?.hasSecret),
                        setupKey: String(data.settings?.setupKey || '')
                    };
                    sync2faUi();
                } catch (error) {
                    setTwoFactorStatus(error.message || 'Unable to load two-factor settings.', true);
                }
            };

            const loadSessions = async () => {
                sessionsStatus.textContent = 'Loading active sessions for this account.';
                sessionsList.innerHTML = '';
                try {
                    const data = await securityFetch('/api/security/sessions', { method: 'GET' });
                    const sessions = Array.isArray(data.sessions) ? data.sessions : [];

                    if (!sessions.length) {
                        sessionsStatus.textContent = 'No tracked sessions found for this account yet.';
                        return;
                    }

                    sessionsStatus.textContent = 'Review the devices and browsers that currently have access to this account.';
                    sessions.forEach((session) => {
                        const row = document.createElement('div');
                        row.className = 'settings-row';

                        const label = document.createElement('div');
                        label.className = 'settings-label';

                        const title = document.createElement('span');
                        title.className = 'settings-label-title';
                        title.textContent = session.userAgent || 'Unknown device';

                        const desc = document.createElement('span');
                        desc.className = 'settings-label-desc';
                        const meta = [];
                        if (session.ipAddress) {
                            meta.push(session.ipAddress);
                        }
                        meta.push(session.current ? 'Current session' : `Last seen ${formatSessionTime(session.lastSeenAt || session.createdAt)}`);
                        if (!session.active && session.revokedAt) {
                            meta.push(`Revoked ${formatSessionTime(session.revokedAt)}`);
                        }
                        desc.textContent = meta.join(' • ');

                        label.appendChild(title);
                        label.appendChild(desc);
                        row.appendChild(label);

                        if (session.current) {
                            const badge = document.createElement('span');
                            badge.className = 'status-badge completed';
                            badge.textContent = session.active ? 'Active' : 'Revoked';
                            row.appendChild(badge);
                        } else {
                            const button = document.createElement('button');
                            button.type = 'button';
                            button.className = 'card-btn';
                            button.style.padding = '6px 12px';
                            button.textContent = session.active ? 'Revoke' : 'Revoked';
                            button.disabled = !session.active;
                            button.addEventListener('click', async () => {
                                button.disabled = true;
                                try {
                                    const revokeData = await securityFetch(`/api/security/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
                                    showDashboardToast('success', 'Session Revoked', revokeData.revokedCurrent ? 'The current session was revoked. You will need to sign in again.' : 'The selected session was revoked.', {
                                        playSound: false
                                    });
                                    if (revokeData.revokedCurrent) {
                                        if (window.logout) {
                                            window.logout();
                                            return;
                                        }
                                    }
                                    loadSessions();
                                } catch (error) {
                                    showDashboardToast('error', 'Session Revoke Failed', error.message || 'Unable to revoke the selected session.');
                                    button.disabled = false;
                                }
                            });
                            row.appendChild(button);
                        }

                        sessionsList.appendChild(row);
                    });
                } catch (error) {
                    sessionsStatus.textContent = error.message || 'Unable to load active sessions.';
                    sessionsStatus.style.color = '#ef4444';
                }
            };

            passwordSave.addEventListener('click', async () => {
                const currentValue = String(currentPassword.value || '');
                const newValue = String(newPassword.value || '');
                const confirmValue = String(confirmPassword.value || '');

                if (!currentValue || !newValue || !confirmValue) {
                    setPasswordStatus('All password fields are required.', true);
                    return;
                }

                passwordSave.disabled = true;
                try {
                    const data = await securityFetch('/api/security/change-password', {
                        method: 'POST',
                        body: JSON.stringify({
                            currentPassword: currentValue,
                            newPassword: newValue,
                            confirmPassword: confirmValue
                        })
                    });
                    currentPassword.value = '';
                    newPassword.value = '';
                    confirmPassword.value = '';
                    setPasswordStatus(data.message || 'Password updated successfully.', false);
                    showDashboardToast('success', 'Password Updated', data.message || 'Password updated successfully.', {
                        playSound: false
                    });
                } catch (error) {
                    setPasswordStatus(error.message || 'Unable to change password right now.', true);
                    showDashboardToast('error', 'Password Update Failed', error.message || 'Unable to change password right now.');
                } finally {
                    passwordSave.disabled = false;
                }
            });

            passwordReset.addEventListener('click', () => {
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                setPasswordStatus('Use at least 8 characters. Password changes apply immediately to this account.', false);
            });

            setupButton.addEventListener('click', async () => {
                setupButton.disabled = true;
                try {
                    const data = await securityFetch('/api/security/2fa/app/setup', { method: 'POST', body: JSON.stringify({}) });
                    securitySettings = {
                        enabled: false,
                        appEnabled: true,
                        appVerified: false,
                        hasSecret: Boolean(data.setupKey),
                        setupKey: String(data.setupKey || '')
                    };
                    codeInput.value = '';
                    sync2faUi();
                    showDashboardToast('success', 'Setup Key Ready', 'Open your authenticator app, add the setup key, then verify with a fresh 6-digit code.', {
                        playSound: false
                    });
                } catch (error) {
                    setTwoFactorStatus(error.message || 'Unable to create a setup key.', true);
                    showDashboardToast('error', '2FA Setup Failed', error.message || 'Unable to create a setup key.');
                } finally {
                    setupButton.disabled = false;
                }
            });

            verifyButton.addEventListener('click', async () => {
                const code = String(codeInput.value || '').trim();
                if (!code) {
                    setTwoFactorStatus('Enter the current 6-digit code from your authenticator app.', true);
                    return;
                }
                verifyButton.disabled = true;
                try {
                    const data = await securityFetch('/api/security/2fa/app/verify', {
                        method: 'POST',
                        body: JSON.stringify({ code })
                    });
                    securitySettings = {
                        enabled: Boolean(data.settings?.enabled),
                        appEnabled: Boolean(data.settings?.appEnabled),
                        appVerified: Boolean(data.settings?.appVerified),
                        hasSecret: true,
                        setupKey: setupKeyInput.value
                    };
                    codeInput.value = '';
                    sync2faUi();
                    showDashboardToast('success', 'Authenticator Verified', 'Two-factor authentication is now verified for this account.', {
                        playSound: false
                    });
                } catch (error) {
                    setTwoFactorStatus(error.message || 'Unable to verify authenticator app.', true);
                    showDashboardToast('error', '2FA Verification Failed', error.message || 'Unable to verify authenticator app.');
                } finally {
                    verifyButton.disabled = false;
                }
            });

            enable2fa.addEventListener('change', async () => {
                const requestedEnabled = Boolean(enable2fa.checked);
                if (requestedEnabled && !(securitySettings.appVerified && securitySettings.hasSecret)) {
                    enable2fa.checked = false;
                    setTwoFactorStatus('Verify your authenticator app before turning on 2FA.', true);
                    return;
                }

                enable2fa.disabled = true;
                try {
                    const data = await securityFetch('/api/security/2fa', {
                        method: 'PUT',
                        body: JSON.stringify({
                            enabled: requestedEnabled,
                            appEnabled: true
                        })
                    });
                    securitySettings.enabled = Boolean(data.settings?.enabled);
                    securitySettings.appEnabled = Boolean(data.settings?.appEnabled);
                    securitySettings.appVerified = Boolean(data.settings?.appVerified || securitySettings.appVerified);
                    sync2faUi();
                    showDashboardToast('success', requestedEnabled ? '2FA Enabled' : '2FA Disabled', requestedEnabled ? 'Sign-ins will now require an authenticator app code.' : 'Authenticator app sign-in protection has been turned off.', {
                        playSound: false
                    });
                } catch (error) {
                    enable2fa.checked = !requestedEnabled;
                    setTwoFactorStatus(error.message || 'Unable to update 2FA settings.', true);
                    showDashboardToast('error', '2FA Update Failed', error.message || 'Unable to update 2FA settings.');
                } finally {
                    enable2fa.disabled = false;
                }
            });

            sessionsRefresh.addEventListener('click', () => {
                loadSessions();
            });

            setPasswordStatus('Use at least 8 characters. Password changes apply immediately to this account.', false);
            loadTwoFactorSettings();
            loadSessions();
        }

        function initNotificationSettingsControls() {
            const mlsToggle = document.getElementById('notifications-toggle-mls-new-listings');
            const plannerToggle = document.getElementById('notifications-toggle-planner-popups');
            const desktopToggle = document.getElementById('notifications-toggle-desktop');
            const soundToggle = document.getElementById('notifications-toggle-sound');
            const desktopStatus = document.getElementById('notifications-desktop-status');

            if (!mlsToggle && !plannerToggle && !desktopToggle && !soundToggle) {
                return;
            }

            function syncDesktopStatus() {
                if (!desktopStatus) {
                    return;
                }

                if (!('Notification' in window)) {
                    desktopStatus.textContent = 'This browser does not support desktop notifications. Planner popups can still appear inside the app.';
                    if (desktopToggle) {
                        desktopToggle.checked = false;
                        desktopToggle.disabled = true;
                    }
                    return;
                }

                const permission = String(Notification.permission || 'default');
                if (permission === 'granted') {
                    desktopStatus.textContent = 'Desktop notifications are allowed for this browser.';
                    return;
                }

                if (permission === 'denied') {
                    desktopStatus.textContent = 'Desktop notifications are blocked in this browser. Re-enable them in browser site settings if needed.';
                    return;
                }

                desktopStatus.textContent = 'Desktop notifications are not granted yet. Turn this toggle on to request browser permission.';
            }

            if (desktopToggle && !desktopToggle.dataset.notificationPermissionBound) {
                desktopToggle.dataset.notificationPermissionBound = 'true';
                desktopToggle.addEventListener('change', async () => {
                    if (!desktopToggle.checked) {
                        syncDesktopStatus();
                        return;
                    }

                    if (!('Notification' in window)) {
                        desktopToggle.checked = false;
                        desktopToggle.dispatchEvent(new Event('change', { bubbles: true }));
                        showDashboardToast('error', 'Desktop Unsupported', 'This browser does not support desktop notifications.');
                        syncDesktopStatus();
                        return;
                    }

                    if (Notification.permission === 'default') {
                        try {
                            const permission = await Notification.requestPermission();
                            if (permission !== 'granted') {
                                desktopToggle.checked = false;
                                desktopToggle.dispatchEvent(new Event('change', { bubbles: true }));
                                showDashboardToast('error', 'Desktop Notifications Blocked', 'Browser permission was not granted, so desktop alerts remain off.');
                            }
                        } catch (error) {
                            desktopToggle.checked = false;
                            desktopToggle.dispatchEvent(new Event('change', { bubbles: true }));
                            showDashboardToast('error', 'Permission Request Failed', 'The browser could not request desktop notification permission.');
                        }
                    } else if (Notification.permission === 'denied') {
                        desktopToggle.checked = false;
                        desktopToggle.dispatchEvent(new Event('change', { bubbles: true }));
                        showDashboardToast('error', 'Desktop Notifications Blocked', 'Desktop notifications are blocked in your browser settings.');
                    }

                    syncDesktopStatus();
                });
            }

            window.addEventListener('dashboard-user-settings-updated', syncDesktopStatus);
            window.addEventListener('focus', syncDesktopStatus);
            syncDesktopStatus();
        }

        function initSubscriptionSettingsControls() {
            const planInputs = Array.from(document.querySelectorAll('input[name="subscription-plan"]'));
            const currentPlanLabel = document.getElementById('subscription-current-plan');
            const planSummary = document.getElementById('subscription-plan-summary');
            const saveButton = document.getElementById('subscription-save-btn');
            const ctaNote = document.getElementById('subscription-cta-note');
            const billingSection = document.getElementById('subscription-billing-section');
            const billingNote = document.getElementById('subscription-billing-note');
            const billingForm = document.getElementById('subscription-billing-form');
            const stripeCardHost = document.getElementById('subscription-stripe-card-element');
            const stripeStatus = document.getElementById('subscription-stripe-status');

            if (planInputs.length === 0 || !currentPlanLabel || !planSummary || !saveButton || !billingSection || !billingNote || !billingForm || !stripeCardHost || !stripeStatus) {
                return;
            }

            const premiumRole = 'premium user';
            const adminRole = 'admin';
            const premiumPriceLabel = '$99';
            const billingFields = {
                billingName: document.getElementById('subscription-billing-name'),
                billingEmail: document.getElementById('subscription-billing-email'),
                billingPhone: document.getElementById('subscription-billing-phone'),
                companyName: document.getElementById('subscription-billing-company'),
                addressLine1: document.getElementById('subscription-billing-address1'),
                addressLine2: document.getElementById('subscription-billing-address2'),
                city: document.getElementById('subscription-billing-city'),
                stateRegion: document.getElementById('subscription-billing-state'),
                postalCode: document.getElementById('subscription-billing-postal'),
                country: document.getElementById('subscription-billing-country'),
                cardholderName: document.getElementById('subscription-cardholder-name')
            };

            const planCopy = {
                admin: {
                    label: 'Admin Access',
                    summary: 'Administrator accounts already have full platform access and are not affected by user or premium subscriptions.'
                },
                basic: {
                    label: 'Basic',
                    summary: 'Basic keeps the core FAST workspace active with standard settings access and essential day-to-day dashboard tools.',
                    cta: 'Stay on Basic if you want the standard workspace for account management and core workflow use, but do not need premium analysis, ROI visibility, comps workflow, analytics, or campaign tools yet.'
                },
                premium: {
                    label: 'Premium',
                    summary: 'Premium costs $99 and unlocks analysis, calculator tools, ROI visibility, comps, analytics, campaigns, and the full Premium User workspace.',
                    cta: 'Get the full investor workspace with analysis, ROI visibility, comps, campaigns, and premium-only tools.'
                }
            };

            const storedUser = getStoredCurrentUserIdentity();
            const initialRole = String(storedUser.role || workspaceUser.role || '').trim().toLowerCase();
            const storedPlan = String(getUserScopedValue(SUBSCRIPTION_PLAN_KEY, workspaceUser.key, initialRole === premiumRole ? 'premium' : 'basic') || 'basic').trim().toLowerCase();
            let currentRole = initialRole;
            let activeSubscription = null;
            let stripeModulePromise = null;
            let stripeConfigPromise = null;
            let stripeInstance = null;
            let stripeElements = null;
            let stripeCardElement = null;
            let stripeEnabled = null;

            function setStripeStatus(message, isError) {
                stripeStatus.textContent = String(message || '');
                stripeStatus.style.color = isError ? '#ef4444' : '';
            }

            function getStripeReadyMessage() {
                const maskedCard = activeSubscription?.billingProfile?.maskedCard;
                if (maskedCard) {
                    return `Card on file: ${maskedCard}. Enter a new card in Stripe to replace it.`;
                }
                return 'Secure card entry powered by Stripe.';
            }

            function setSelectedPlan(planKey) {
                const resolvedPlan = Object.prototype.hasOwnProperty.call(planCopy, planKey) ? planKey : 'basic';
                const selectedInput = planInputs.find((input) => input.value === resolvedPlan) || planInputs[0];
                planInputs.forEach((input) => {
                    input.checked = input === selectedInput;
                });
            }

            function getSelectedPlan() {
                const activeInput = planInputs.find((input) => input.checked);
                const nextPlan = activeInput ? String(activeInput.value || 'basic').trim().toLowerCase() : 'basic';
                return Object.prototype.hasOwnProperty.call(planCopy, nextPlan) ? nextPlan : 'basic';
            }

            function getStoredAuthToken() {
                return String(localStorage.getItem('authToken') || '').trim();
            }

            async function loadStripeConfig() {
                if (stripeConfigPromise) {
                    return stripeConfigPromise;
                }

                stripeConfigPromise = (async () => {
                    const token = getStoredAuthToken();
                    if (!token) {
                        throw new Error('Sign in again before using Stripe billing.');
                    }

                    const response = await fetch('/api/subscription/stripe-config', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Unable to load Stripe billing settings.');
                    }
                    stripeEnabled = Boolean(data.enabled && data.publishableKey);
                    return data;
                })();

                return stripeConfigPromise;
            }

            async function ensureStripeLibrary() {
                if (stripeInstance) {
                    return stripeInstance;
                }

                if (!stripeModulePromise) {
                    stripeModulePromise = import('/node_modules/@stripe/stripe-js/dist/pure.mjs');
                }

                const stripeConfig = await loadStripeConfig();
                if (!stripeConfig.enabled || !stripeConfig.publishableKey) {
                    stripeEnabled = false;
                    throw new Error('Stripe is not configured yet. Add STRIPE_PUBLISHABLE_KEY to the server environment to enable billing.');
                }

                const stripeModule = await stripeModulePromise;
                stripeInstance = await stripeModule.loadStripe(stripeConfig.publishableKey);
                if (!stripeInstance) {
                    throw new Error('Stripe could not be initialized in this browser.');
                }
                return stripeInstance;
            }

            async function ensureStripeCardElement() {
                if (stripeCardElement) {
                    stripeCardHost.classList.remove('is-disabled');
                    setStripeStatus(getStripeReadyMessage(), false);
                    return stripeCardElement;
                }

                stripeCardHost.classList.add('is-disabled');
                setStripeStatus('Loading Stripe secure card entry...', false);

                const stripe = await ensureStripeLibrary();
                stripeElements = stripe.elements({
                    appearance: {
                        theme: 'night',
                        variables: {
                            colorPrimary: '#34d399',
                            colorBackground: 'rgba(0,0,0,0)',
                            colorText: '#f8fafc',
                            colorDanger: '#ef4444',
                            fontFamily: 'Outfit, system-ui, sans-serif'
                        }
                    }
                });
                stripeCardElement = stripeElements.create('card', {
                    hidePostalCode: true
                });
                stripeCardElement.mount('#subscription-stripe-card-element');
                stripeCardElement.on('change', (event) => {
                    stripeCardHost.classList.toggle('is-disabled', false);
                    if (event.error) {
                        setStripeStatus(event.error.message || 'Stripe card entry has an error.', true);
                        return;
                    }
                    setStripeStatus(getStripeReadyMessage(), false);
                });

                stripeCardHost.classList.remove('is-disabled');
                setStripeStatus(getStripeReadyMessage(), false);
                return stripeCardElement;
            }

            function fillBillingForm(profile) {
                const safeProfile = profile && typeof profile === 'object' ? profile : {};
                Object.entries(billingFields).forEach(([key, input]) => {
                    if (!input) {
                        return;
                    }
                    input.value = String(safeProfile[key] || input.value || '').trim();
                });
                setStripeStatus(getStripeReadyMessage(), false);
            }

            function buildBillingPayload() {
                const payload = {};
                Object.entries(billingFields).forEach(([key, input]) => {
                    payload[key] = input ? String(input.value || '').trim() : '';
                });
                return payload;
            }

            function seedBillingDefaults() {
                const currentUser = getStoredCurrentUserIdentity();
                if (billingFields.billingName && !billingFields.billingName.value) {
                    billingFields.billingName.value = String(currentUser.name || '').trim();
                }
                if (billingFields.billingEmail && !billingFields.billingEmail.value) {
                    billingFields.billingEmail.value = String(currentUser.email || '').trim();
                }
                if (billingFields.cardholderName && !billingFields.cardholderName.value) {
                    billingFields.cardholderName.value = String(currentUser.name || '').trim();
                }
                if (billingFields.country && !billingFields.country.value) {
                    billingFields.country.value = 'United States';
                }
            }

            function normalizeStripeCountryCode(value) {
                const normalized = String(value || '').trim().toUpperCase();
                if (/^[A-Z]{2}$/.test(normalized)) {
                    return normalized;
                }
                if (normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA' || normalized === 'USA') {
                    return 'US';
                }
                return undefined;
            }

            async function buildStripePaymentPayload() {
                const stripe = await ensureStripeLibrary();
                const cardElement = await ensureStripeCardElement();
                const billingName = String(billingFields.billingName?.value || '').trim();
                const billingEmail = String(billingFields.billingEmail?.value || '').trim();
                const billingPhone = String(billingFields.billingPhone?.value || '').trim();
                const cardholderName = String(billingFields.cardholderName?.value || billingName || '').trim();

                if (!cardholderName) {
                    throw new Error('Enter the cardholder name before continuing to Stripe.');
                }

                setStripeStatus('Tokenizing card details with Stripe...', false);
                const result = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                    billing_details: {
                        name: cardholderName,
                        email: billingEmail || undefined,
                        phone: billingPhone || undefined,
                        address: {
                            line1: String(billingFields.addressLine1?.value || '').trim() || undefined,
                            line2: String(billingFields.addressLine2?.value || '').trim() || undefined,
                            city: String(billingFields.city?.value || '').trim() || undefined,
                            state: String(billingFields.stateRegion?.value || '').trim() || undefined,
                            postal_code: String(billingFields.postalCode?.value || '').trim() || undefined,
                            country: normalizeStripeCountryCode(billingFields.country?.value)
                        }
                    }
                });

                if (result.error || !result.paymentMethod) {
                    throw new Error(result.error?.message || 'Stripe could not verify the card details.');
                }

                setStripeStatus(getStripeReadyMessage(), false);

                return {
                    paymentMethodId: String(result.paymentMethod.id || ''),
                    cardholderName,
                    cardBrand: String(result.paymentMethod.card?.brand || ''),
                    cardLast4: String(result.paymentMethod.card?.last4 || '')
                };
            }

            function syncSubscriptionUi() {
                const isAdminUser = currentRole === adminRole;
                const isPremiumUser = currentRole === premiumRole;
                const activePlan = getSelectedPlan();
                const actualPlan = isAdminUser
                    ? 'admin'
                    : ((isPremiumUser || activeSubscription?.plan === 'premium') ? 'premium' : 'basic');
                currentPlanLabel.textContent = planCopy[actualPlan].label;
                planSummary.textContent = isAdminUser
                    ? planCopy.admin.summary
                    : (isPremiumUser
                        ? 'Premium User is active. All tabs are unlocked for this account.'
                        : planCopy[activePlan].summary);
                if (ctaNote) {
                    ctaNote.textContent = isAdminUser
                        ? 'Administrator accounts already include the full platform and do not need a separate subscription checkout.'
                        : (isPremiumUser
                            ? 'Premium is already live on this account. You can update billing details here anytime.'
                            : planCopy[activePlan].cta);
                }
                billingSection.hidden = isAdminUser || !(activePlan === 'premium' || isPremiumUser);
                if (billingNote) {
                    billingNote.textContent = isAdminUser
                        ? 'Administrator accounts already include every tab and do not need billing information.'
                        : (isPremiumUser && activeSubscription?.billingProfile?.maskedCard
                            ? `Premium User is active. Billing profile on file: ${activeSubscription.billingProfile.maskedCard}.`
                            : `Enter billing details to activate Premium User access for ${premiumPriceLabel} and unlock the full investor toolkit.`);
                }
                saveButton.hidden = isAdminUser;
                saveButton.textContent = isPremiumUser
                    ? 'Keep Premium Billing Updated'
                    : (activePlan === 'premium' ? `Unlock Premium Access - ${premiumPriceLabel}` : 'Stay on Basic');

                planInputs.forEach((input) => {
                    const card = input.closest('[data-plan-card]');
                    if (!card) {
                        return;
                    }
                    input.disabled = isAdminUser || (isPremiumUser && input.value === 'basic');
                    card.classList.toggle('is-selected', input.checked);
                    card.classList.toggle('is-disabled', Boolean(input.disabled));
                });

                if (!billingSection.hidden) {
                    void ensureStripeCardElement().catch((error) => {
                        stripeCardHost.classList.add('is-disabled');
                        setStripeStatus(error.message || 'Stripe is unavailable right now.', true);
                    });
                }
            }

            async function loadSubscriptionStatus() {
                const token = getStoredAuthToken();
                if (!token) {
                    seedBillingDefaults();
                    setSelectedPlan(storedPlan);
                    syncSubscriptionUi();
                    return;
                }

                try {
                    const response = await fetch('/api/subscription/status', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Unable to load subscription details.');
                    }

                    activeSubscription = data.subscription || null;
                    currentRole = String(data.user?.role || currentRole || '').trim().toLowerCase();
                    persistStoredCurrentUserIdentity(data.user);
                    fillBillingForm(activeSubscription?.billingProfile);
                    setSelectedPlan(activeSubscription?.plan === 'premium' ? 'premium' : (currentRole === premiumRole ? 'premium' : storedPlan));
                } catch (error) {
                    seedBillingDefaults();
                    setSelectedPlan(storedPlan);
                }

                seedBillingDefaults();
                syncSubscriptionUi();
            }

            saveButton.addEventListener('click', async () => {
                if (currentRole === adminRole) {
                    syncSubscriptionUi();
                    return;
                }

                const activePlan = getSelectedPlan();
                if (currentRole !== premiumRole && activePlan !== 'premium') {
                    setUserScopedValue(SUBSCRIPTION_PLAN_KEY, workspaceUser.key, 'basic');
                    syncSubscriptionUi();
                    showDashboardToast('success', 'Basic Plan Active', 'This account will stay on the Basic plan until Premium is purchased.', {
                        playSound: false
                    });
                    return;
                }

                const token = getStoredAuthToken();
                if (!token) {
                    showDashboardToast('error', 'Sign In Required', 'Sign in again before purchasing Premium.');
                    return;
                }

                const originalLabel = saveButton.textContent;
                saveButton.disabled = true;

                try {
                    const stripePayload = await buildStripePaymentPayload();
                    const response = await fetch('/api/subscription/premium-checkout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            ...buildBillingPayload(),
                            ...stripePayload
                        })
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Unable to activate Premium.');
                    }

                    currentRole = String(data.user?.role || premiumRole).trim().toLowerCase();
                    activeSubscription = data.subscription || null;
                    localStorage.setItem('authToken', String(data.token || token));
                    persistStoredCurrentUserIdentity(data.user);
                    setUserScopedValue(SUBSCRIPTION_PLAN_KEY, workspaceUser.key, 'premium');
                    fillBillingForm(activeSubscription?.billingProfile);
                    if (stripeCardElement) {
                        stripeCardElement.clear();
                    }
                    setSelectedPlan('premium');
                    syncSubscriptionUi();
                    showDashboardToast('success', 'Premium Activated', 'Premium User access is live and all tabs are now unlocked for this account.', {
                        playSound: false
                    });
                    window.setTimeout(() => {
                        window.location.reload();
                    }, 480);
                } catch (error) {
                    showDashboardToast('error', 'Checkout Failed', error.message || 'Unable to activate Premium.');
                } finally {
                    saveButton.disabled = false;
                    saveButton.textContent = originalLabel;
                    syncSubscriptionUi();
                }
            });

            planInputs.forEach((input) => {
                input.addEventListener('change', () => {
                    syncSubscriptionUi();
                });
            });

            loadSubscriptionStatus();
        }

        initSecuritySettingsControls();
        initNotificationSettingsControls();
        initSubscriptionSettingsControls();

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

    function initNotesWidget() {
        const notesWidgetShell = document.querySelector('.notes-widget-shell');
        const notesWidgetHeaderActions = document.querySelector('.notes-widget-header-actions');
        const folderTree = document.getElementById('notes-folder-tree');
        const noteList = document.getElementById('notes-note-list');
        const addFolderButton = document.getElementById('notes-add-folder-btn');
        const addNoteButton = document.getElementById('notes-add-note-btn');
        const quickNoteButton = document.getElementById('notes-quick-note-btn');
        const searchInput = document.getElementById('notes-search-input');
        const activeFolderLabel = document.getElementById('notes-active-folder-label');
        const countSummary = document.getElementById('notes-count-summary');
        const folderSummary = document.getElementById('notes-folder-summary');
        const notesSubtitle = document.getElementById('notes-widget-subtitle');
        const viewAllButton = document.getElementById('notes-view-all-btn');
        const viewTrashButton = document.getElementById('notes-view-trash-btn');
        const editorEmpty = document.getElementById('notes-editor-empty');
        const editor = document.getElementById('notes-editor');
        const backToListButton = document.getElementById('notes-back-to-list-btn');
        const titleInput = document.getElementById('notes-title-input');
        const folderSelect = document.getElementById('notes-folder-select');
        const pinToggleButton = document.getElementById('notes-pin-toggle-btn');
        const completeToggleButton = document.getElementById('notes-complete-toggle-btn');
        const bodyInput = document.getElementById('notes-body-input');
        const fontToolButton = document.getElementById('notes-tool-font-btn');
        const checklistToolButton = document.getElementById('notes-tool-checklist-btn');
        const gridToolButton = document.getElementById('notes-tool-grid-btn');
        const attachToolButton = document.getElementById('notes-tool-attach-btn');
        const drawToolButton = document.getElementById('notes-tool-draw-btn');
        const boldToolButton = document.getElementById('notes-tool-bold-btn');
        const metaLabel = document.getElementById('notes-meta-label');
        const deleteButton = document.getElementById('notes-delete-note-btn');

        if (!notesWidgetShell || !folderTree || !noteList || !addFolderButton || !addNoteButton || !quickNoteButton || !searchInput || !activeFolderLabel || !countSummary || !folderSummary || !notesSubtitle || !viewAllButton || !viewTrashButton || !editorEmpty || !editor || !backToListButton || !titleInput || !folderSelect || !pinToggleButton || !completeToggleButton || !bodyInput || !fontToolButton || !checklistToolButton || !gridToolButton || !attachToolButton || !drawToolButton || !boldToolButton || !metaLabel || !deleteButton) {
            return;
        }

        const workspaceUser = getWorkspaceUserContext();
        const DEFAULT_FOLDER_ID = 'folder-default';
        const DEFAULT_FOLDER_NAME = 'Notes';
        const ALL_NOTES_FOLDER_ID = '__all_notes__';
        const NOTES_TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
        let selectedNoteId = '';
        let activeFolderId = ALL_NOTES_FOLDER_ID;
        let activeView = 'all';
        let searchQuery = '';
        let persistTimer = null;
        let pinnedCollapsed = false;
        let draggedItem = null;
        const expandedFolderIds = new Set([DEFAULT_FOLDER_ID]);

        function normalizeNotesData(rawValue) {
            const value = rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue) ? rawValue : {};
            const rawFolders = Array.isArray(value.folders) ? value.folders : [];
            const rawNotes = Array.isArray(value.notes) ? value.notes : [];
            const now = Date.now();
            const folders = rawFolders
                .map((folder, index) => {
                    const id = String(folder && folder.id || `folder-${index + 1}`).trim();
                    const name = String(folder && (folder.name || folder.title) || '').trim();
                    if (!id || !name) {
                        return null;
                    }
                    return {
                        id,
                        name,
                        parentId: String(folder && folder.parentId || '').trim(),
                        createdAt: Number(folder && folder.createdAt) || Date.now()
                    };
                })
                .filter(Boolean);

            if (!folders.some((folder) => folder.id === DEFAULT_FOLDER_ID)) {
                folders.unshift({
                    id: DEFAULT_FOLDER_ID,
                    name: DEFAULT_FOLDER_NAME,
                    parentId: '',
                    createdAt: Date.now()
                });
            }

            folders.forEach((folder) => {
                if (!folder.parentId || folder.id === DEFAULT_FOLDER_ID) {
                    folder.parentId = '';
                    return;
                }
                if (!folders.some((candidate) => candidate.id === folder.parentId && candidate.id !== folder.id)) {
                    folder.parentId = '';
                }
            });

            const knownFolderIds = new Set(folders.map((folder) => folder.id));
            const notes = rawNotes
                .map((note, index) => {
                    const id = String(note && note.id || `note-${index + 1}`).trim();
                    if (!id) {
                        return null;
                    }
                    const folderId = knownFolderIds.has(String(note && note.folderId || '').trim())
                        ? String(note.folderId).trim()
                        : DEFAULT_FOLDER_ID;
                    return {
                        id,
                        title: String(note && note.title || '').trim(),
                        body: String(note && note.body || '').trim(),
                        folderId,
                        pinned: Boolean(note && note.pinned),
                        completed: Boolean(note && note.completed),
                        deletedAt: Number(note && note.deletedAt) || 0,
                        createdAt: Number(note && note.createdAt) || Date.now(),
                        updatedAt: Number(note && note.updatedAt) || Date.now()
                    };
                })
                .filter((note) => !note.deletedAt || (now - note.deletedAt) < NOTES_TRASH_RETENTION_MS)
                .filter(Boolean);

            return { folders, notes };
        }

        function getNotesData() {
            return normalizeNotesData(getUserScopedObject(DASHBOARD_NOTES_KEY, workspaceUser.key));
        }

        function saveNotesData(nextData) {
            setUserScopedObject(DASHBOARD_NOTES_KEY, workspaceUser.key, normalizeNotesData(nextData));
        }

        function getFolderName(folderId, folders) {
            const matched = folders.find((folder) => folder.id === folderId);
            return matched ? matched.name : DEFAULT_FOLDER_NAME;
        }

        function isTrashView() {
            return activeView === 'trash';
        }

        function getActiveNotes(data) {
            return data.notes.filter((note) => !note.deletedAt);
        }

        function getDeletedNotes(data) {
            return data.notes.filter((note) => note.deletedAt);
        }

        function getFolderChildren(folders, parentId) {
            return folders
                .filter((folder) => String(folder.parentId || '') === String(parentId || ''))
                .sort((left, right) => left.name.localeCompare(right.name));
        }

        function getDescendantFolderIds(data, folderId) {
            const collected = new Set([folderId]);
            const queue = [folderId];
            while (queue.length) {
                const currentId = queue.shift();
                data.folders.forEach((folder) => {
                    if (folder.parentId === currentId && !collected.has(folder.id)) {
                        collected.add(folder.id);
                        queue.push(folder.id);
                    }
                });
            }
            return collected;
        }

        function isFolderAncestor(data, ancestorId, folderId) {
            let currentId = String(folderId || '');
            while (currentId) {
                const currentFolder = data.folders.find((folder) => folder.id === currentId);
                if (!currentFolder || !currentFolder.parentId) {
                    return false;
                }
                if (currentFolder.parentId === ancestorId) {
                    return true;
                }
                currentId = currentFolder.parentId;
            }
            return false;
        }

        function getNoteDisplayTitle(note) {
            const explicitTitle = String(note && note.title || '').trim();
            if (explicitTitle) {
                return explicitTitle;
            }
            const bodyTitle = String(note && note.body || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean);
            return bodyTitle || 'New Note';
        }

        function getNotePreview(note) {
            const body = String(note && note.body || '').replace(/\s+/g, ' ').trim();
            if (body) {
                return body;
            }
            return 'No additional text';
        }

        function formatNoteTimestamp(value) {
            const timestamp = Number(value) || Date.now();
            return new Date(timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }

        function formatNoteListDate(value) {
            const timestamp = Number(value) || Date.now();
            return new Date(timestamp).toLocaleDateString(undefined, {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit'
            });
        }

        function getEditablePlainText(element, mode) {
            const rawValue = String(element.innerText || '').replace(/\u00a0/g, '');
            if (mode === 'title') {
                return rawValue.replace(/\s+/g, ' ').trim();
            }
            return rawValue.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
        }

        function setEditableText(element, value) {
            const nextValue = String(value || '');
            if (document.activeElement === element) {
                return;
            }
            element.textContent = nextValue;
        }

        function focusEditableAtEnd(element) {
            if (!element) {
                return;
            }
            element.focus();
            const selection = window.getSelection();
            if (!selection) {
                return;
            }
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        function focusSelectedNoteForEditing() {
            const data = getNotesData();
            const selectedNote = data.notes.find((note) => note.id === selectedNoteId) || null;
            if (!selectedNote) {
                return;
            }

            if (!String(selectedNote.body || '').trim() && !String(selectedNote.title || '').trim()) {
                focusEditableAtEnd(bodyInput);
                return;
            }

            focusEditableAtEnd(bodyInput);
        }

        function insertBodyText(text) {
            bodyInput.focus();
            document.execCommand('insertText', false, text);
        }

        function getFilteredNotes(data) {
            const normalizedQuery = searchQuery.trim().toLowerCase();
            const sourceNotes = isTrashView() ? getDeletedNotes(data) : getActiveNotes(data);
            const allowedFolderIds = activeFolderId === ALL_NOTES_FOLDER_ID
                ? null
                : getDescendantFolderIds(data, activeFolderId);
            return sourceNotes
                .filter((note) => isTrashView() || !allowedFolderIds || allowedFolderIds.has(note.folderId))
                .filter((note) => {
                    if (!normalizedQuery) {
                        return true;
                    }
                    const haystack = `${note.title}\n${note.body}\n${getFolderName(note.folderId, data.folders)}`.toLowerCase();
                    return haystack.includes(normalizedQuery);
                })
                .sort((left, right) => {
                    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
                        return Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
                    }
                    if (Boolean(left.completed) !== Boolean(right.completed)) {
                        return Number(Boolean(left.completed)) - Number(Boolean(right.completed));
                    }
                    if (isTrashView()) {
                        return (Number(right.deletedAt) || 0) - (Number(left.deletedAt) || 0);
                    }
                    return (Number(right.updatedAt) || 0) - (Number(left.updatedAt) || 0);
                });
        }

        function ensureSelection(data) {
            const availableNotes = getFilteredNotes(data);
            const selectedIsVisible = availableNotes.some((note) => note.id === selectedNoteId);
            if (!selectedIsVisible) {
                selectedNoteId = '';
            }
        }

        function renderFolderSelect(data, preferredFolderId) {
            const nextFolderId = String(preferredFolderId || '').trim();
            folderSelect.innerHTML = '';
            const appendOptions = (parentId, depth) => {
                getFolderChildren(data.folders, parentId).forEach((folder) => {
                    const option = document.createElement('option');
                    option.value = folder.id;
                    option.textContent = `${depth ? `${'  '.repeat(depth)}- ` : ''}${folder.name}`;
                    folderSelect.appendChild(option);
                    appendOptions(folder.id, depth + 1);
                });
            };
            appendOptions('', 0);
            if (!folderSelect.options.length) {
                const option = document.createElement('option');
                option.value = DEFAULT_FOLDER_ID;
                option.textContent = DEFAULT_FOLDER_NAME;
                folderSelect.appendChild(option);
            }
            folderSelect.value = data.folders.some((folder) => folder.id === nextFolderId)
                ? nextFolderId
                : DEFAULT_FOLDER_ID;
        }

        function getFolderNoteCount(data, folderId) {
            const descendantIds = getDescendantFolderIds(data, folderId);
            return getActiveNotes(data).filter((note) => descendantIds.has(note.folderId)).length;
        }

        function deleteFolder(folderId) {
            if (!folderId || folderId === DEFAULT_FOLDER_ID) {
                return;
            }

            const data = getNotesData();
            const targetFolder = data.folders.find((folder) => folder.id === folderId);
            if (!targetFolder) {
                return;
            }

            const descendantIds = getDescendantFolderIds(data, folderId);
            const movedNotesCount = data.notes.filter((note) => descendantIds.has(note.folderId) && !note.deletedAt).length;
            const removedFoldersCount = descendantIds.size;

            data.notes = data.notes.map((note) => {
                if (!descendantIds.has(note.folderId)) {
                    return note;
                }

                return {
                    ...note,
                    folderId: DEFAULT_FOLDER_ID,
                    updatedAt: Date.now()
                };
            });

            data.folders = data.folders.filter((folder) => !descendantIds.has(folder.id));
            descendantIds.forEach((id) => expandedFolderIds.delete(id));

            if (descendantIds.has(activeFolderId)) {
                activeFolderId = ALL_NOTES_FOLDER_ID;
            }

            saveNotesData(data);
            render();
            showDashboardToast(
                'success',
                'Folder Deleted',
                `${targetFolder.name} was removed. ${movedNotesCount} note${movedNotesCount === 1 ? '' : 's'} moved to ${DEFAULT_FOLDER_NAME} and ${removedFoldersCount} folder${removedFoldersCount === 1 ? '' : 's'} deleted.`
            );
        }

        function moveDraggedItemToFolder(targetFolderId) {
            if (!draggedItem) {
                return;
            }
            const data = getNotesData();
            if (draggedItem.type === 'note') {
                const noteIndex = data.notes.findIndex((note) => note.id === draggedItem.id);
                if (noteIndex < 0) {
                    return;
                }
                data.notes[noteIndex] = {
                    ...data.notes[noteIndex],
                    folderId: targetFolderId || DEFAULT_FOLDER_ID,
                    updatedAt: Date.now()
                };
                saveNotesData(data);
                render();
                return;
            }

            if (draggedItem.type === 'folder') {
                const folderIndex = data.folders.findIndex((folder) => folder.id === draggedItem.id);
                if (folderIndex < 0 || draggedItem.id === DEFAULT_FOLDER_ID) {
                    return;
                }
                if (targetFolderId === draggedItem.id || isFolderAncestor(data, draggedItem.id, targetFolderId)) {
                    showDashboardToast('error', 'Invalid Move', 'Folders cannot be placed inside themselves or their own children.');
                    return;
                }
                data.folders[folderIndex] = {
                    ...data.folders[folderIndex],
                    parentId: targetFolderId || ''
                };
                saveNotesData(data);
                expandedFolderIds.add(targetFolderId || '');
                render();
            }
        }

        function attachFolderDropHandlers(element, targetFolderId) {
            element.addEventListener('dragover', (event) => {
                if (!draggedItem) {
                    return;
                }
                event.preventDefault();
                element.classList.add('is-drop-target');
            });
            element.addEventListener('dragleave', () => {
                element.classList.remove('is-drop-target');
            });
            element.addEventListener('drop', (event) => {
                event.preventDefault();
                element.classList.remove('is-drop-target');
                moveDraggedItemToFolder(targetFolderId);
                draggedItem = null;
            });
        }

        function renderFolderTree(data) {
            folderTree.hidden = isTrashView();
            if (isTrashView()) {
                folderTree.innerHTML = '';
                return;
            }

            folderTree.innerHTML = '';
            const activeNotes = getActiveNotes(data);

            const allNotesButton = document.createElement('button');
            allNotesButton.type = 'button';
            allNotesButton.className = 'notes-folder-item is-root';
            if (activeFolderId === ALL_NOTES_FOLDER_ID) {
                allNotesButton.classList.add('is-active');
            }
            allNotesButton.innerHTML = `<span class="notes-folder-main"><span class="notes-folder-name">All Notes</span><span class="notes-folder-count">${activeNotes.length} note${activeNotes.length === 1 ? '' : 's'}</span></span>`;
            allNotesButton.addEventListener('click', () => {
                activeFolderId = ALL_NOTES_FOLDER_ID;
                render();
            });
            allNotesButton.draggable = true;
            allNotesButton.addEventListener('dragstart', (event) => {
                event.preventDefault();
            });
            attachFolderDropHandlers(allNotesButton, '');
            folderTree.appendChild(allNotesButton);

            const renderNodes = (parentId, depth) => {
                const nodes = [];
                const children = getFolderChildren(data.folders, parentId);
                children.forEach((folder) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'notes-folder-node';

                    const row = document.createElement('div');
                    row.className = 'notes-folder-row';

                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'notes-folder-item';
                    if (folder.id === activeFolderId) {
                        item.classList.add('is-active');
                    }
                    item.draggable = folder.id !== DEFAULT_FOLDER_ID;

                    for (let index = 0; index < depth; index += 1) {
                        const indent = document.createElement('span');
                        indent.className = 'notes-folder-indent';
                        item.appendChild(indent);
                    }

                    const hasChildren = getFolderChildren(data.folders, folder.id).length > 0;
                    const chevron = document.createElement('span');
                    chevron.className = 'notes-folder-chevron';
                    chevron.innerHTML = hasChildren ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>' : '';
                    if (hasChildren && !expandedFolderIds.has(folder.id)) {
                        chevron.classList.add('is-collapsed');
                    }
                    item.appendChild(chevron);

                    const main = document.createElement('span');
                    main.className = 'notes-folder-main';
                    main.innerHTML = `<span class="notes-folder-name">${folder.name}</span><span class="notes-folder-count">${getFolderNoteCount(data, folder.id)} note${getFolderNoteCount(data, folder.id) === 1 ? '' : 's'}</span>`;
                    item.appendChild(main);

                    item.addEventListener('click', (event) => {
                        const clickedChevron = event.target instanceof Element && event.target.closest('.notes-folder-chevron');
                        if (clickedChevron && hasChildren) {
                            if (expandedFolderIds.has(folder.id)) {
                                expandedFolderIds.delete(folder.id);
                            } else {
                                expandedFolderIds.add(folder.id);
                            }
                            render();
                            return;
                        }

                        activeFolderId = folder.id;
                        if (hasChildren) {
                            expandedFolderIds.add(folder.id);
                        }
                        render();
                    });

                    item.addEventListener('dragstart', () => {
                        if (folder.id === DEFAULT_FOLDER_ID) {
                            return;
                        }
                        draggedItem = { type: 'folder', id: folder.id };
                    });
                    item.addEventListener('dragend', () => {
                        draggedItem = null;
                        item.classList.remove('is-drop-target');
                    });

                    attachFolderDropHandlers(item, folder.id);
                    row.appendChild(item);

                    if (folder.id !== DEFAULT_FOLDER_ID) {
                        const deleteFolderButton = document.createElement('button');
                        deleteFolderButton.type = 'button';
                        deleteFolderButton.className = 'notes-folder-delete';
                        deleteFolderButton.setAttribute('aria-label', `Delete folder ${folder.name}`);
                        deleteFolderButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>';
                        deleteFolderButton.addEventListener('click', (event) => {
                            event.stopPropagation();
                            const confirmed = window.confirm(`Delete folder "${folder.name}" and move its notes back to ${DEFAULT_FOLDER_NAME}?`);
                            if (!confirmed) {
                                return;
                            }
                            deleteFolder(folder.id);
                        });
                        row.appendChild(deleteFolderButton);
                    }

                    wrapper.appendChild(row);

                    if (hasChildren && expandedFolderIds.has(folder.id)) {
                        const childWrap = document.createElement('div');
                        childWrap.className = 'notes-folder-children';
                        renderNodes(folder.id, depth + 1).forEach((childNode) => childWrap.appendChild(childNode));
                        wrapper.appendChild(childWrap);
                    }

                    nodes.push(wrapper);
                });

                return nodes;
            };

            renderNodes('', 0).forEach((node) => folderTree.appendChild(node));

            if (folderTree.childElementCount === 1) {
                const empty = document.createElement('p');
                empty.className = 'notes-folder-tree-empty';
                empty.textContent = 'Create folders, then drag notes into them.';
                folderTree.appendChild(empty);
            }
        }

        function getRelativeGroupKey(note) {
            if (note.pinned) {
                return 'pinned';
            }

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const yesterdayStart = todayStart - (24 * 60 * 60 * 1000);
            const previousWeekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
            const updatedAt = Number(note.updatedAt) || 0;

            if (updatedAt >= todayStart) {
                return 'today';
            }
            if (updatedAt >= yesterdayStart) {
                return 'yesterday';
            }
            if (updatedAt >= previousWeekStart) {
                return 'previous7';
            }
            return 'older';
        }

        function buildNoteGroups(notes) {
            if (isTrashView()) {
                return [{ key: 'trash', title: 'Recently Deleted', notes }].filter((group) => group.notes.length);
            }

            const groups = [
                { key: 'pinned', title: 'Pinned', notes: [] },
                { key: 'today', title: 'Today', notes: [] },
                { key: 'yesterday', title: 'Yesterday', notes: [] },
                { key: 'previous7', title: 'Previous 7 Days', notes: [] },
                { key: 'older', title: 'Older', notes: [] }
            ];
            const groupLookup = new Map(groups.map((group) => [group.key, group]));
            notes.forEach((note) => {
                const group = groupLookup.get(getRelativeGroupKey(note));
                if (group) {
                    group.notes.push(note);
                }
            });
            return groups.filter((group) => group.notes.length);
        }

        function moveNoteToTrash(noteId) {
            const data = getNotesData();
            const noteIndex = data.notes.findIndex((note) => note.id === noteId);
            if (noteIndex < 0) {
                return;
            }

            data.notes[noteIndex] = {
                ...data.notes[noteIndex],
                pinned: false,
                completed: false,
                deletedAt: Date.now(),
                updatedAt: Date.now()
            };

            if (selectedNoteId === noteId) {
                selectedNoteId = '';
            }

            saveNotesData(data);
            render();
            showDashboardToast('success', 'Moved To Recently Deleted', 'The note can be restored for 30 days before it is permanently deleted.');
        }

        function restoreDeletedNote(noteId) {
            const data = getNotesData();
            const noteIndex = data.notes.findIndex((note) => note.id === noteId);
            if (noteIndex < 0) {
                return;
            }

            data.notes[noteIndex] = {
                ...data.notes[noteIndex],
                deletedAt: 0,
                updatedAt: Date.now()
            };

            saveNotesData(data);
            render();
            showDashboardToast('success', 'Note Restored', 'The note was restored to your notes list.');
        }

        function permanentlyDeleteNote(noteId) {
            const data = getNotesData();
            data.notes = data.notes.filter((note) => note.id !== noteId);
            if (selectedNoteId === noteId) {
                selectedNoteId = '';
            }
            saveNotesData(data);
            render();
            showDashboardToast('success', 'Note Permanently Deleted', 'The note was removed from Recently Deleted.');
        }

        function formatDaysUntilDeletion(note) {
            const deletedAt = Number(note && note.deletedAt) || 0;
            if (!deletedAt) {
                return '';
            }
            const remainingMs = Math.max((deletedAt + NOTES_TRASH_RETENTION_MS) - Date.now(), 0);
            const remainingDays = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
            return `Deletes in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
        }

        function createNoteCard(note, data) {
            const card = document.createElement('article');
            card.className = 'notes-note-card';
            card.tabIndex = 0;
            card.setAttribute('role', isTrashView() ? 'group' : 'button');
            if (note.id === selectedNoteId) {
                card.classList.add('is-active');
            }
            if (note.completed) {
                card.classList.add('is-completed');
            }
            card.draggable = !isTrashView();

            const head = document.createElement('div');
            head.className = 'notes-note-card-head';

            const title = document.createElement('p');
            title.className = 'notes-note-card-title';
            title.textContent = getNoteDisplayTitle(note);

            const time = document.createElement('span');
            time.className = 'notes-note-card-time';
            time.textContent = formatNoteListDate(isTrashView() ? note.deletedAt : note.updatedAt);

            const actions = document.createElement('div');
            actions.className = 'notes-note-card-actions';

            if (isTrashView()) {
                const restoreButton = document.createElement('button');
                restoreButton.type = 'button';
                restoreButton.className = 'notes-note-card-action-btn notes-note-card-restore';
                restoreButton.setAttribute('aria-label', 'Restore note');
                restoreButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7v6h6"></path><path d="M21 17A9 9 0 0 0 6 9l-3 4"></path></svg>';
                restoreButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    restoreDeletedNote(note.id);
                });

                const deleteForeverButton = document.createElement('button');
                deleteForeverButton.type = 'button';
                deleteForeverButton.className = 'notes-note-card-action-btn notes-note-card-permanent';
                deleteForeverButton.setAttribute('aria-label', 'Delete permanently');
                deleteForeverButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>';
                deleteForeverButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const confirmed = window.confirm('Permanently delete this note?');
                    if (!confirmed) {
                        return;
                    }
                    permanentlyDeleteNote(note.id);
                });

                actions.appendChild(restoreButton);
                actions.appendChild(deleteForeverButton);
            } else {
                const trashButton = document.createElement('button');
                trashButton.type = 'button';
                trashButton.className = 'notes-note-card-delete';
                trashButton.setAttribute('aria-label', 'Move note to recently deleted');
                trashButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>';
                trashButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    moveNoteToTrash(note.id);
                });
                actions.appendChild(trashButton);
            }

            head.appendChild(title);
            head.appendChild(time);
            head.appendChild(actions);
            card.appendChild(head);

            const meta = document.createElement('div');
            meta.className = 'notes-note-card-meta';

            if (note.pinned) {
                const pinned = document.createElement('span');
                pinned.className = 'notes-note-card-pin';
                pinned.textContent = 'Pinned';
                meta.appendChild(pinned);
            }

            if (note.completed) {
                const completed = document.createElement('span');
                completed.className = 'notes-note-card-completed';
                completed.textContent = 'Completed';
                meta.appendChild(completed);
            }

            if (isTrashView()) {
                const trashMeta = document.createElement('span');
                trashMeta.className = 'notes-note-card-trash-meta';
                trashMeta.textContent = formatDaysUntilDeletion(note);
                meta.appendChild(trashMeta);
            }

            const folderName = getFolderName(note.folderId, data.folders);
            if (folderName && folderName !== DEFAULT_FOLDER_NAME) {
                const folder = document.createElement('span');
                folder.className = 'notes-note-card-folder';
                folder.textContent = folderName;
                meta.appendChild(folder);
            }

            if (meta.childNodes.length) {
                card.appendChild(meta);
            }

            const preview = document.createElement('p');
            preview.className = 'notes-note-card-preview';
            preview.textContent = getNotePreview(note);
            card.appendChild(preview);

            const openNote = () => {
                if (isTrashView()) {
                    return;
                }
                selectedNoteId = note.id;
                renderEditor(getNotesData());
                renderNoteList(getNotesData());
                focusSelectedNoteForEditing();
            };

            card.addEventListener('click', openNote);

            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }
                event.preventDefault();
                openNote();
            });

            card.addEventListener('dragstart', () => {
                if (isTrashView()) {
                    return;
                }
                draggedItem = { type: 'note', id: note.id };
            });
            card.addEventListener('dragend', () => {
                draggedItem = null;
            });

            return card;
        }

        function renderSummary(data, visibleNotes) {
            const activeNotes = getActiveNotes(data);
            const deletedNotes = getDeletedNotes(data);
            const pinnedCount = activeNotes.filter((note) => note.pinned).length;
            notesSubtitle.textContent = `${activeNotes.length} note${activeNotes.length === 1 ? '' : 's'}`;
            folderSummary.textContent = `${activeNotes.length} active • ${deletedNotes.length} in trash`;
            activeFolderLabel.textContent = isTrashView()
                ? 'Recently Deleted'
                : searchQuery
                ? 'Search Results'
                : activeFolderId === ALL_NOTES_FOLDER_ID
                    ? 'All Notes'
                    : getFolderName(activeFolderId, data.folders);
            countSummary.textContent = isTrashView()
                ? `${visibleNotes.length} deleted note${visibleNotes.length === 1 ? '' : 's'}`
                : `${visibleNotes.length} result${visibleNotes.length === 1 ? '' : 's'}`;
            viewAllButton.classList.toggle('is-active', !isTrashView());
            viewTrashButton.classList.toggle('is-active', isTrashView());
            viewTrashButton.textContent = deletedNotes.length ? `Recently Deleted (${deletedNotes.length})` : 'Recently Deleted';
        }

        function shouldShowEditorPanel(data) {
            if (isTrashView()) {
                return false;
            }
            if (!selectedNoteId) {
                return false;
            }
            return data.notes.some((note) => note.id === selectedNoteId && !note.deletedAt);
        }

        function syncNotesWidgetMode(data) {
            const showEditor = shouldShowEditorPanel(data);
            notesWidgetShell.classList.toggle('is-editor-mode', showEditor);
            notesWidgetShell.classList.toggle('is-library-mode', !showEditor);
            if (notesWidgetHeaderActions) {
                notesWidgetHeaderActions.hidden = showEditor;
            }
            backToListButton.hidden = !showEditor;
        }

        function renderNoteList(data) {
            const visibleNotes = getFilteredNotes(data);
            renderSummary(data, visibleNotes);
            noteList.innerHTML = '';

            if (visibleNotes.length === 0) {
                noteList.innerHTML = `<p class="outreach-empty">${isTrashView() ? 'No deleted notes. Notes you move to the trash will stay here for 30 days.' : searchQuery ? 'No notes match this search.' : 'No notes yet. Tap quick note to start writing.'}</p>`;
                return;
            }

            buildNoteGroups(visibleNotes).forEach((group) => {
                const section = document.createElement('section');
                section.className = 'notes-note-group';

                const head = document.createElement('div');
                head.className = 'notes-note-group-head';

                const titleWrap = document.createElement('div');
                titleWrap.className = 'notes-note-group-title-wrap';

                const title = document.createElement('span');
                title.className = 'notes-note-group-title';
                title.textContent = group.title;

                const count = document.createElement('span');
                count.className = 'notes-note-group-count';
                count.textContent = `${group.notes.length} note${group.notes.length === 1 ? '' : 's'}`;

                titleWrap.appendChild(title);
                titleWrap.appendChild(count);
                head.appendChild(titleWrap);

                if (group.key === 'pinned') {
                    const collapseButton = document.createElement('button');
                    collapseButton.type = 'button';
                    collapseButton.className = 'notes-group-collapse-btn';
                    if (pinnedCollapsed) {
                        collapseButton.classList.add('is-collapsed');
                    }
                    collapseButton.setAttribute('aria-label', pinnedCollapsed ? 'Expand pinned notes' : 'Collapse pinned notes');
                    collapseButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
                    collapseButton.addEventListener('click', () => {
                        pinnedCollapsed = !pinnedCollapsed;
                        renderNoteList(getNotesData());
                    });
                    head.appendChild(collapseButton);
                }

                section.appendChild(head);

                if (!(group.key === 'pinned' && pinnedCollapsed)) {
                    const list = document.createElement('div');
                    list.className = 'notes-note-group-list';
                    group.notes.forEach((note) => {
                        list.appendChild(createNoteCard(note, data));
                    });
                    section.appendChild(list);
                }

                noteList.appendChild(section);
            });
        }

        function renderEditor(data) {
            const selectedNote = data.notes.find((note) => note.id === selectedNoteId) || null;
            if (!selectedNote || isTrashView() || selectedNote.deletedAt) {
                editor.hidden = true;
                editorEmpty.hidden = false;
                setEditableText(titleInput, '');
                setEditableText(bodyInput, '');
                metaLabel.textContent = isTrashView() ? 'Restore a note from Recently Deleted to edit it again.' : 'Last updated just now';
                editor.classList.remove('is-completed');
                pinToggleButton.textContent = 'Pin Note';
                pinToggleButton.classList.remove('is-active');
                pinToggleButton.setAttribute('aria-pressed', 'false');
                completeToggleButton.classList.remove('is-active');
                completeToggleButton.setAttribute('aria-pressed', 'false');
                renderFolderSelect(data, DEFAULT_FOLDER_ID);
                return;
            }

            editor.hidden = false;
            editorEmpty.hidden = true;
            editor.classList.toggle('is-completed', Boolean(selectedNote.completed));
            setEditableText(titleInput, selectedNote.title);
            setEditableText(bodyInput, selectedNote.body);
            metaLabel.textContent = `Last updated ${formatNoteTimestamp(selectedNote.updatedAt)}`;
            pinToggleButton.textContent = selectedNote.pinned ? 'Pinned' : 'Pin Note';
            pinToggleButton.classList.toggle('is-active', Boolean(selectedNote.pinned));
            pinToggleButton.setAttribute('aria-pressed', selectedNote.pinned ? 'true' : 'false');
            completeToggleButton.classList.toggle('is-active', Boolean(selectedNote.completed));
            completeToggleButton.setAttribute('aria-pressed', selectedNote.completed ? 'true' : 'false');
            renderFolderSelect(data, selectedNote.folderId);
        }

        function render() {
            const data = getNotesData();
            if (activeFolderId !== ALL_NOTES_FOLDER_ID && !data.folders.some((folder) => folder.id === activeFolderId)) {
                activeFolderId = ALL_NOTES_FOLDER_ID;
            }
            if (isTrashView()) {
                selectedNoteId = '';
            }
            ensureSelection(data);
            syncNotesWidgetMode(data);
            renderFolderTree(data);
            renderNoteList(data);
            renderEditor(data);
        }

        function persistSelectedNote(mutator, options = {}) {
            const shouldRender = options.render !== false;
            const data = getNotesData();
            const noteIndex = data.notes.findIndex((note) => note.id === selectedNoteId);
            if (noteIndex < 0) {
                return;
            }
            const currentNote = data.notes[noteIndex];
            const nextNote = mutator(currentNote);
            if (!nextNote) {
                return;
            }
            data.notes[noteIndex] = {
                ...currentNote,
                ...nextNote,
                updatedAt: Date.now()
            };
            saveNotesData(data);
            if (shouldRender) {
                render();
            } else {
                metaLabel.textContent = `Last updated ${formatNoteTimestamp(data.notes[noteIndex].updatedAt)}`;
            }
        }

        function schedulePersist(mutator) {
            window.clearTimeout(persistTimer);
            persistTimer = window.setTimeout(() => {
                persistSelectedNote(mutator, { render: false });
                const refreshedData = getNotesData();
                renderNoteList(refreshedData);
                renderEditor(refreshedData);
            }, 140);
        }

        function createNote(options = {}) {
            const data = getNotesData();
            const selectedNote = data.notes.find((note) => note.id === selectedNoteId) || null;
            const noteId = `note-${Date.now()}-${Math.round(Math.random() * 10000)}`;
            const targetFolderId = activeFolderId !== ALL_NOTES_FOLDER_ID
                ? activeFolderId
                : selectedNote
                    ? selectedNote.folderId
                    : DEFAULT_FOLDER_ID;
            data.notes.push({
                id: noteId,
                title: '',
                body: '',
                folderId: targetFolderId,
                pinned: false,
                completed: false,
                deletedAt: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            activeView = 'all';
            selectedNoteId = noteId;
            saveNotesData(data);
            render();
            focusEditableAtEnd(bodyInput);
            if (options.toast !== false) {
                showDashboardToast('success', 'Note Created', `New note added to ${getFolderName(targetFolderId, data.folders)}.`);
            }
        }

        addFolderButton.addEventListener('click', () => {
            const proposedName = window.prompt('Folder name');
            const name = String(proposedName || '').trim();
            if (!name) {
                return;
            }

            const data = getNotesData();
            const duplicate = data.folders.some((folder) => folder.name.toLowerCase() === name.toLowerCase());
            if (duplicate) {
                showDashboardToast('error', 'Folder Exists', 'Choose a different folder name.');
                return;
            }

            data.folders.push({
                id: `folder-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                name,
                parentId: activeFolderId !== ALL_NOTES_FOLDER_ID ? activeFolderId : '',
                createdAt: Date.now()
            });
            saveNotesData(data);
            render();
            showDashboardToast('success', 'Folder Added', `${name} is ready for notes.`);
        });

        addNoteButton.addEventListener('click', () => {
            createNote();
        });

        quickNoteButton.addEventListener('click', () => {
            createNote({ toast: false });
            focusEditableAtEnd(bodyInput);
        });

        searchInput.addEventListener('input', () => {
            searchQuery = String(searchInput.value || '').trim();
            render();
        });

        viewAllButton.addEventListener('click', () => {
            activeView = 'all';
            selectedNoteId = '';
            render();
        });

        viewTrashButton.addEventListener('click', () => {
            activeView = 'trash';
            selectedNoteId = '';
            render();
        });

        titleInput.addEventListener('input', () => {
            const nextValue = getEditablePlainText(titleInput, 'title');
            schedulePersist((note) => ({
                ...note,
                title: nextValue
            }));
        });

        bodyInput.addEventListener('input', () => {
            const nextValue = getEditablePlainText(bodyInput, 'body');
            schedulePersist((note) => ({
                ...note,
                body: nextValue
            }));
        });

        [titleInput, bodyInput].forEach((element) => {
            element.addEventListener('paste', (event) => {
                event.preventDefault();
                const pastedText = event.clipboardData ? event.clipboardData.getData('text/plain') : '';
                document.execCommand('insertText', false, pastedText);
            });
        });

        folderSelect.addEventListener('change', () => {
            const nextFolderId = String(folderSelect.value || DEFAULT_FOLDER_ID).trim();
            persistSelectedNote((note) => ({
                ...note,
                folderId: nextFolderId || DEFAULT_FOLDER_ID
            }));
        });

        pinToggleButton.addEventListener('click', () => {
            persistSelectedNote((note) => ({
                ...note,
                pinned: !note.pinned
            }));
        });

        completeToggleButton.addEventListener('click', () => {
            persistSelectedNote((note) => ({
                ...note,
                completed: !note.completed
            }));
        });

        backToListButton.addEventListener('click', () => {
            selectedNoteId = '';
            render();
        });

        fontToolButton.addEventListener('click', () => {
            titleInput.focus();
        });

        checklistToolButton.addEventListener('click', () => {
            insertBodyText('☐ ');
        });

        gridToolButton.addEventListener('click', () => {
            insertBodyText('| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n');
        });

        attachToolButton.addEventListener('click', () => {
            showDashboardToast('info', 'Attachments Coming Soon', 'Note attachments are not connected yet, but the toolbar button is ready.');
        });

        drawToolButton.addEventListener('click', () => {
            showDashboardToast('info', 'Drawing Coming Soon', 'Drawing tools are not connected yet, but the toolbar button is ready.');
        });

        boldToolButton.addEventListener('click', () => {
            const selection = window.getSelection();
            const selectedText = selection ? String(selection.toString() || '') : '';
            if (!selectedText) {
                insertBodyText('**bold**');
                return;
            }
            insertBodyText(`**${selectedText}**`);
        });

        deleteButton.addEventListener('click', () => {
            if (!selectedNoteId) {
                return;
            }
            const confirmed = window.confirm('Move this note to Recently Deleted?');
            if (!confirmed) {
                return;
            }
            moveNoteToTrash(selectedNoteId);
        });

        window.addEventListener('dashboard-data-updated', render);
        window.addEventListener('storage', (event) => {
            if (!event.key || event.key === DASHBOARD_NOTES_KEY) {
                render();
            }
        });

        render();
    }

    function initAgentWorkspaceEmailPrep() {
        const recipientNameInput = document.getElementById('agent-workspace-recipient-name');
        const recipientEmailInput = document.getElementById('agent-workspace-recipient-email');
        const senderNameInput = document.getElementById('agent-workspace-sender-name');
        const senderEmailInput = document.getElementById('agent-workspace-sender-email');
        const subjectInput = document.getElementById('agent-workspace-email-subject');
        const bodyInput = document.getElementById('agent-workspace-email-body');
        const sendButton = document.getElementById('agent-workspace-send-btn');
        const copySubjectButton = document.getElementById('agent-workspace-copy-subject-btn');
        const copyBodyButton = document.getElementById('agent-workspace-copy-body-btn');
        const copyDocListButton = document.getElementById('agent-workspace-copy-doc-list-btn');
        const categorySelect = document.getElementById('agent-workspace-doc-category');
        const uploadButton = document.getElementById('agent-workspace-upload-btn');
        const uploadInput = document.getElementById('agent-workspace-upload-input');
        const docsList = document.getElementById('agent-workspace-docs-list');
        const docsNote = document.getElementById('agent-workspace-docs-note');

        if (!recipientNameInput || !recipientEmailInput || !senderNameInput || !senderEmailInput || !subjectInput || !bodyInput || !sendButton || !copySubjectButton || !copyBodyButton || !copyDocListButton || !categorySelect || !uploadButton || !uploadInput || !docsList || !docsNote) {
            return;
        }

        const workspaceUser = getWorkspaceUserContext();
        const cachedSmtpSettings = getScopedSmtpSettings(workspaceUser);
        let documents = [];
        let isSavingDraft = false;
        let lastSuggestedRecipient = { name: '', email: '' };
        let lastSuggestedSender = { name: '', email: '' };
        let smtpConfigState = {
            smtpUser: cleanFieldValue(cachedSmtpSettings && cachedSmtpSettings.smtpUser),
            hasPassword: Boolean(cachedSmtpSettings && cachedSmtpSettings.hasPassword),
            pendingRequest: cachedSmtpSettings && cachedSmtpSettings.pendingRequest ? cachedSmtpSettings.pendingRequest : null,
            configured: false
        };
        let smtpStatusPromise = null;

        smtpConfigState.configured = Boolean(smtpConfigState.smtpUser && smtpConfigState.hasPassword && !smtpConfigState.pendingRequest);

        function cleanFieldValue(value) {
            const normalized = String(value || '').trim();
            return normalized === '-' ? '' : normalized;
        }

        function readLocalJson(key) {
            try {
                return JSON.parse(localStorage.getItem(key) || '{}');
            } catch (error) {
                return {};
            }
        }

        function getSmtpConfigState(settings) {
            const normalizedSettings = settings && typeof settings === 'object' ? settings : {};
            const smtpUser = cleanFieldValue(normalizedSettings.smtpUser);
            const pendingRequest = normalizedSettings.pendingRequest && typeof normalizedSettings.pendingRequest === 'object'
                ? normalizedSettings.pendingRequest
                : null;
            const hasPassword = Boolean(normalizedSettings.hasPassword);

            return {
                smtpUser,
                hasPassword,
                pendingRequest,
                configured: Boolean(smtpUser && hasPassword && !pendingRequest)
            };
        }

        function getGmailSettingsHref() {
            return 'settings.html?tab=profile#smtp-settings-section';
        }

        function ensureGmailSetupModal() {
            let modal = document.getElementById('agent-workspace-gmail-modal');
            if (modal) {
                return modal;
            }

            document.body.insertAdjacentHTML('beforeend', `
                <div id="agent-workspace-gmail-modal" class="profile-modal" style="display: none;">
                    <div class="profile-modal-overlay" data-agent-gmail-close="true"></div>
                    <div class="profile-modal-content" style="max-width: 560px;">
                        <div class="profile-modal-header">
                            <h2 id="agent-workspace-gmail-modal-title">Connect Gmail</h2>
                            <button type="button" class="profile-close-btn" data-agent-gmail-close="true" aria-label="Close Gmail setup prompt">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="profile-modal-body">
                            <p id="agent-workspace-gmail-modal-copy" style="margin: 0; color: var(--text-secondary); line-height: 1.7;"></p>
                            <div class="profile-modal-actions">
                                <a id="agent-workspace-gmail-modal-link" class="btn btn-primary" href="settings.html?tab=profile#smtp-settings-section">Open Gmail Settings</a>
                                <button type="button" class="btn btn-secondary" data-agent-gmail-close="true">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            modal = document.getElementById('agent-workspace-gmail-modal');
            modal.querySelectorAll('[data-agent-gmail-close="true"]').forEach((element) => {
                element.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            });

            return modal;
        }

        function showGmailSetupPrompt(mode = 'missing') {
            const modal = ensureGmailSetupModal();
            const title = modal.querySelector('#agent-workspace-gmail-modal-title');
            const copy = modal.querySelector('#agent-workspace-gmail-modal-copy');
            const link = modal.querySelector('#agent-workspace-gmail-modal-link');

            if (title) {
                title.textContent = mode === 'pending' ? 'Gmail Approval Pending' : 'Connect Your Gmail';
            }

            if (copy) {
                copy.textContent = mode === 'pending'
                    ? 'Your Gmail outbox request is still waiting for admin approval. Open Settings to review or resubmit your Gmail account before sending email from Agent Workspace.'
                    : 'This account cannot send email from Agent Workspace until you are logged in and your Gmail outbox is configured in Settings.';
            }

            if (link) {
                link.href = getGmailSettingsHref();
            }

            modal.style.display = 'flex';
        }

        async function loadApprovedGmailConfig(force = false) {
            const token = getAuthToken();
            if (!token) {
                smtpConfigState = getSmtpConfigState({});
                return smtpConfigState;
            }

            if (!force && smtpStatusPromise) {
                return smtpStatusPromise;
            }

            smtpStatusPromise = (async () => {
                try {
                    const response = await fetch('/api/smtp-settings', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Unable to load Gmail settings.');
                    }

                    const payload = await response.json().catch(() => ({}));
                    smtpConfigState = getSmtpConfigState(payload);
                    return smtpConfigState;
                } catch (error) {
                    smtpConfigState = getSmtpConfigState(getScopedSmtpSettings(workspaceUser));
                    return smtpConfigState;
                } finally {
                    smtpStatusPromise = null;
                }
            })();

            return smtpStatusPromise;
        }

        function getSenderProfile() {
            const profile = readLocalJson('userProfile');
            const user = readLocalJson('user');
            return {
                name: cleanFieldValue(senderNameInput.value) || cleanFieldValue(profile.name || user.name || workspaceUser.name || ''),
                email: smtpConfigState.configured ? cleanFieldValue(smtpConfigState.smtpUser) : ''
            };
        }

        function getSafeDraftSender(savedDraft) {
            const rawSenderName = cleanFieldValue(savedDraft && savedDraft.senderName);
            const rawSenderEmail = cleanFieldValue(savedDraft && savedDraft.senderEmail);
            const normalizedDraftEmail = normalizeUserIdentityValue(rawSenderEmail);
            const normalizedWorkspaceEmail = normalizeUserIdentityValue(workspaceUser.email || '');
            const emailMatchesWorkspace = Boolean(normalizedDraftEmail && normalizedWorkspaceEmail && normalizedDraftEmail === normalizedWorkspaceEmail);
            const nameMatchesWorkspace = rawSenderName && String(rawSenderName).trim() === String(workspaceUser.name || '').trim();

            if (!emailMatchesWorkspace && !nameMatchesWorkspace) {
                return {
                    senderName: '',
                    senderEmail: ''
                };
            }

            return {
                senderName: rawSenderName,
                senderEmail: emailMatchesWorkspace ? rawSenderEmail : ''
            };
        }

        function getAvailableSenderEmails() {
            return smtpConfigState.configured && smtpConfigState.smtpUser
                ? [cleanFieldValue(smtpConfigState.smtpUser)]
                : [];
        }

        function renderSenderEmailOptions(preferredEmail = '') {
            const currentValue = cleanFieldValue(preferredEmail || senderEmailInput.value);
            const options = getAvailableSenderEmails();
            senderEmailInput.innerHTML = '<option value="">Select sender email</option>';
            options.forEach((email) => {
                const option = document.createElement('option');
                option.value = email;
                option.textContent = email;
                senderEmailInput.appendChild(option);
            });
            senderEmailInput.disabled = options.length === 0;
            senderEmailInput.title = options.length === 0
                ? (smtpConfigState.pendingRequest ? 'Your Gmail request is pending admin approval.' : 'Connect Gmail in Settings first.')
                : '';
            if (currentValue && options.includes(currentValue)) {
                senderEmailInput.value = currentValue;
            }
        }

        function getAgentWorkspaceRecipientDefaults() {
            const currentAgentRecord = typeof getCurrentAgentRecordState === 'function'
                ? getCurrentAgentRecordState()
                : {};
            return {
                name: cleanFieldValue(currentAgentRecord && currentAgentRecord.name),
                email: cleanFieldValue(currentAgentRecord && currentAgentRecord.email)
            };
        }

        async function syncSenderDefaults(force = false, refreshSmtp = false) {
            if (refreshSmtp) {
                await loadApprovedGmailConfig(true);
            }
            const senderProfile = getSenderProfile();
            const currentName = cleanFieldValue(senderNameInput.value);
            const currentEmail = cleanFieldValue(senderEmailInput.value);
            const suggestedEmail = cleanFieldValue(senderProfile.email);

            renderSenderEmailOptions(currentEmail || suggestedEmail);

            if (force || !currentName || currentName === lastSuggestedSender.name) {
                senderNameInput.value = cleanFieldValue(senderProfile.name);
            }

            if (force || !currentEmail || currentEmail === lastSuggestedSender.email) {
                senderEmailInput.value = suggestedEmail;
            }

            lastSuggestedSender = {
                name: cleanFieldValue(senderProfile.name),
                email: suggestedEmail
            };
        }

        function syncRecipientDefaults(force = false) {
            const nextRecipient = getAgentWorkspaceRecipientDefaults();
            const currentName = cleanFieldValue(recipientNameInput.value);
            const currentEmail = cleanFieldValue(recipientEmailInput.value);

            if (force || !currentName || currentName === lastSuggestedRecipient.name) {
                recipientNameInput.value = nextRecipient.name;
            }

            if (force || !currentEmail || currentEmail === lastSuggestedRecipient.email) {
                recipientEmailInput.value = nextRecipient.email;
            }

            lastSuggestedRecipient = nextRecipient;
        }

        function getAuthToken() {
            return String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
        }

        async function requestAgentWorkspace(url, options = {}) {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Sign in again to use Agent Workspace uploads.');
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            };

            const response = await fetch(url, {
                ...options,
                headers
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(String(payload && payload.error || 'Request failed.'));
            }

            return payload;
        }

        function saveDraft() {
            if (isSavingDraft) {
                return;
            }

            const nextDraft = {
                recipientName: cleanFieldValue(recipientNameInput.value),
                recipientEmail: cleanFieldValue(recipientEmailInput.value),
                senderName: cleanFieldValue(senderNameInput.value),
                senderEmail: cleanFieldValue(senderEmailInput.value),
                subject: String(subjectInput.value || '').trim(),
                bodyHtml: String(bodyInput.innerHTML || '').trim()
            };
            setUserScopedObject(AGENT_WORKSPACE_EMAIL_PREP_KEY, workspaceUser.key, nextDraft);
        }

        function prefillRecipientForEmailPrep(detail) {
            const payload = detail && typeof detail === 'object' ? detail : {};
            const recipientName = cleanFieldValue(payload.recipientName || '');
            const recipientEmail = cleanFieldValue(payload.recipientEmail || '');
            const propertyAddress = cleanFieldValue(payload.propertyAddress || '');

            if (!recipientName && !recipientEmail) {
                showDashboardToast('error', 'Agent Missing', 'Add an agent name or email before sending it to Email Prep.');
                return;
            }

            isSavingDraft = true;
            recipientNameInput.value = recipientName;
            recipientEmailInput.value = recipientEmail;
            isSavingDraft = false;
            lastSuggestedRecipient = {
                name: recipientName,
                email: recipientEmail
            };
            saveDraft();

            const prepCard = document.querySelector('[data-widget-id="agent-email-prep"]');
            if (prepCard) {
                prepCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            const focusTarget = recipientEmail ? recipientEmailInput : recipientNameInput;
            window.setTimeout(() => {
                focusTarget.focus();
                if (typeof focusTarget.select === 'function') {
                    focusTarget.select();
                }
            }, prepCard ? 180 : 0);

            showDashboardToast('success', 'Email Prep Updated', `${recipientName || recipientEmail}${propertyAddress ? ` for ${propertyAddress}` : ''} was loaded into Email Prep.`);
        }

        function loadDraft() {
            const savedDraft = getUserScopedObject(AGENT_WORKSPACE_EMAIL_PREP_KEY, workspaceUser.key);
            const safeDraftSender = getSafeDraftSender(savedDraft);
            isSavingDraft = true;
            recipientNameInput.value = cleanFieldValue(savedDraft.recipientName || '');
            recipientEmailInput.value = cleanFieldValue(savedDraft.recipientEmail || '');
            senderNameInput.value = safeDraftSender.senderName;
            renderSenderEmailOptions(safeDraftSender.senderEmail);
            senderEmailInput.value = safeDraftSender.senderEmail;
            subjectInput.value = String(savedDraft.subject || '').trim();
            bodyInput.innerHTML = String(savedDraft.bodyHtml || '').trim();
            isSavingDraft = false;
            void syncSenderDefaults(true);
            syncRecipientDefaults();
        }

        function renderEmptyState() {
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
                        <strong>No saved email documents yet.</strong>
                        <p>Upload a file once and it will stay in this user's Agent Workspace library for reuse.</p>
                    </div>
                </div>
            `;
        }

        async function copyTextValue(value, successTitle, emptyMessage) {
            const text = String(value || '').trim();
            if (!text) {
                showDashboardToast('error', 'Nothing To Copy', emptyMessage);
                return;
            }

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    throw new Error('Clipboard API unavailable');
                }
                showDashboardToast('success', successTitle, 'Copied to clipboard.');
            } catch (error) {
                showDashboardToast('error', 'Copy Failed', 'The clipboard could not be updated in this browser.');
            }
        }

        function buildAttachmentList() {
            if (!documents.length) {
                return '';
            }

            return documents
                .map((documentItem) => `${documentItem.categoryLabel}: ${documentItem.fileName}`)
                .join('\n');
        }

        async function buildServerEmailAttachments() {
            if (!documents.length) {
                return [];
            }

            const token = getAuthToken();
            if (!token) {
                throw new Error('Sign in again to send email attachments from the Agent Workspace.');
            }

            const attachments = [];
            for (const documentItem of documents) {
                const response = await fetch(`/api/agent-workspace-documents/${encodeURIComponent(documentItem.id)}/content?download=0`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => ({}));
                    throw new Error(String(payload && payload.error || `Unable to attach ${documentItem.fileName || 'a saved document'}.`));
                }

                const blob = await response.blob();
                attachments.push({
                    filename: cleanFieldValue(documentItem.fileName) || 'agent-workspace-document',
                    contentType: String(response.headers.get('content-type') || blob.type || 'application/octet-stream').trim() || 'application/octet-stream',
                    contentBase64: await readBlobAsBase64(blob)
                });
            }

            return attachments;
        }

        async function openDocument(documentItem, download = false) {
            try {
                const token = getAuthToken();
                if (!token) {
                    throw new Error('Sign in again to open saved files.');
                }

                const response = await fetch(`/api/agent-workspace-documents/${encodeURIComponent(documentItem.id)}/content?download=${download ? '1' : '0'}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => ({}));
                    throw new Error(String(payload && payload.error || 'Unable to open the file.'));
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                if (download) {
                    link.download = documentItem.fileName || 'agent-workspace-document';
                } else {
                    link.target = '_blank';
                    link.rel = 'noopener';
                }

                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 30000);
            } catch (error) {
                showDashboardToast('error', 'Open Failed', error.message || 'Unable to open the selected file.');
            }
        }

        async function removeDocument(documentItem) {
            const confirmed = window.confirm(`Delete "${documentItem.fileName}" from your Agent Workspace library?`);
            if (!confirmed) {
                return;
            }

            try {
                await requestAgentWorkspace(`/api/agent-workspace-documents/${encodeURIComponent(documentItem.id)}`, {
                    method: 'DELETE'
                });
                documents = documents.filter((item) => item.id !== documentItem.id);
                renderDocuments();
                showDashboardToast('success', 'Document Deleted', 'The file was removed from your saved library.');
            } catch (error) {
                showDashboardToast('error', 'Delete Failed', error.message || 'Unable to delete the selected file.');
            }
        }

        function createActionButton(label, onClick, className = '') {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `offer-doc-action-btn ${className}`.trim();
            button.textContent = label;
            button.addEventListener('click', onClick);
            return button;
        }

        function renderDocuments() {
            docsList.innerHTML = '';

            if (!documents.length) {
                docsNote.textContent = 'Files uploaded here stay in your Agent Workspace library for reuse.';
                renderEmptyState();
                return;
            }

            const listWrap = document.createElement('div');
            listWrap.className = 'offer-docs-list';

            documents.forEach((documentItem) => {
                const item = document.createElement('article');
                item.className = 'offer-doc-item';

                const head = document.createElement('div');
                head.className = 'offer-doc-item-head';

                const titleWrap = document.createElement('div');
                const title = document.createElement('strong');
                title.textContent = documentItem.fileName || 'Saved Document';
                const subtitle = document.createElement('p');
                subtitle.textContent = `Saved ${new Date(Number(documentItem.createdAt) || Date.now()).toLocaleString()}`;
                titleWrap.appendChild(title);
                titleWrap.appendChild(subtitle);

                const meta = document.createElement('div');
                meta.className = 'offer-doc-meta';
                [
                    documentItem.categoryLabel,
                    formatFileSize(documentItem.fileSize),
                    String(documentItem.fileType || '').replace(/^\./, '').toUpperCase()
                ].filter(Boolean).forEach((value) => {
                    const chip = document.createElement('span');
                    chip.className = 'offer-doc-chip';
                    chip.textContent = value;
                    meta.appendChild(chip);
                });

                head.appendChild(titleWrap);
                head.appendChild(meta);
                item.appendChild(head);

                const actions = document.createElement('div');
                actions.className = 'offer-doc-actions';
                actions.appendChild(createActionButton('Open', async () => {
                    await openDocument(documentItem, false);
                }));
                actions.appendChild(createActionButton('Download', async () => {
                    await openDocument(documentItem, true);
                }));
                actions.appendChild(createActionButton('Delete', async () => {
                    await removeDocument(documentItem);
                }, 'danger'));

                item.appendChild(actions);
                listWrap.appendChild(item);
            });

            docsList.appendChild(listWrap);
            docsNote.textContent = `${documents.length} saved document${documents.length === 1 ? '' : 's'} ready to reuse.`;
        }

        async function loadDocuments() {
            docsNote.textContent = 'Loading saved Agent Workspace documents...';
            try {
                const payload = await requestAgentWorkspace('/api/agent-workspace-documents');
                documents = Array.isArray(payload && payload.documents) ? payload.documents : [];
                renderDocuments();
            } catch (error) {
                documents = [];
                renderEmptyState();
                docsNote.textContent = error.message || 'Unable to load saved Agent Workspace documents.';
                showDashboardToast('error', 'Library Unavailable', error.message || 'Unable to load saved Agent Workspace documents.');
            }
        }

        copySubjectButton.addEventListener('click', async () => {
            await copyTextValue(subjectInput.value, 'Subject Copied', 'Add a subject before copying it.');
        });

        copyBodyButton.addEventListener('click', async () => {
            await copyTextValue(bodyInput.textContent, 'Body Copied', 'Add an email body before copying it.');
        });

        copyDocListButton.addEventListener('click', async () => {
            await copyTextValue(buildAttachmentList(), 'Attachment List Copied', 'Upload at least one file before copying the attachment list.');
        });

        sendButton.addEventListener('click', async () => {
            const token = getAuthToken();
            if (!token) {
                showDashboardToast('error', 'Sign In Required', 'Sign in again before sending email through the website.');
                return;
            }

            const smtpConfig = await loadApprovedGmailConfig(true);
            await syncSenderDefaults(true);

            if (!smtpConfig.configured) {
                showDashboardToast('error', smtpConfig.pendingRequest ? 'Gmail Approval Pending' : 'Gmail Setup Required', smtpConfig.pendingRequest
                    ? 'Your Gmail request is still pending admin approval.'
                    : 'Connect your Gmail in Settings before sending email from Agent Workspace.');
                showGmailSetupPrompt(smtpConfig.pendingRequest ? 'pending' : 'missing');
                return;
            }

            const recipientName = cleanFieldValue(recipientNameInput.value);
            const recipientEmail = cleanFieldValue(recipientEmailInput.value);
            const senderName = cleanFieldValue(senderNameInput.value);
            const senderEmail = cleanFieldValue(smtpConfig.smtpUser || senderEmailInput.value);
            const subject = String(subjectInput.value || '').trim();
            const body = cleanFieldValue(bodyInput.innerText || bodyInput.textContent || '');
            const htmlBody = String(bodyInput.innerHTML || '').trim();

            if (!recipientEmail) {
                showDashboardToast('error', 'Recipient Email Required', 'Pick or enter the agent email before sending.');
                return;
            }

            if (!senderEmail) {
                showDashboardToast('error', 'Sender Email Required', 'Select the sender email that should send this message.');
                return;
            }

            if (!subject && !body) {
                showDashboardToast('error', 'Email Content Required', 'Add a subject or email body before sending.');
                return;
            }

            saveDraft();
            sendButton.disabled = true;
            sendButton.querySelector('span:last-child').textContent = 'Sending...';

            try {
                const attachments = await buildServerEmailAttachments();
                const response = await fetch('/api/send-agent-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fromName: senderName,
                        fromEmail: senderEmail,
                        toName: recipientName,
                        toEmail: recipientEmail,
                        subject,
                        body,
                        htmlBody,
                        attachments
                    })
                });

                const rawResponse = await response.text();
                let result = {};
                try {
                    result = rawResponse ? JSON.parse(rawResponse) : {};
                } catch (error) {
                    result = { error: rawResponse || 'Could not send email.' };
                }

                if (!response.ok) {
                    throw new Error(result.error || 'Could not send email.');
                }

                showDashboardToast('success', 'Email Sent', `Agent Workspace email sent to ${recipientName || recipientEmail}.`);
            } catch (error) {
                showDashboardToast('error', 'Send Failed', error.message || 'Could not send the Agent Workspace email.');
            } finally {
                sendButton.disabled = false;
                sendButton.querySelector('span:last-child').textContent = 'Send Through Website';
            }
        });

        [recipientNameInput, recipientEmailInput, senderNameInput, senderEmailInput].forEach((input) => {
            input.addEventListener('input', saveDraft);
            input.addEventListener('change', saveDraft);
        });

        subjectInput.addEventListener('input', saveDraft);
        bodyInput.addEventListener('input', saveDraft);

        uploadButton.addEventListener('click', () => {
            uploadInput.click();
        });

        uploadInput.addEventListener('change', async () => {
            const files = Array.from(uploadInput.files || []);
            const category = String(categorySelect.value || '').trim();
            if (!files.length || !category) {
                uploadInput.value = '';
                return;
            }

            try {
                for (const file of files) {
                    const contentBase64 = await readBlobAsBase64(file);
                    await requestAgentWorkspace('/api/agent-workspace-documents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            category,
                            fileName: file.name,
                            contentBase64,
                            contentType: file.type || ''
                        })
                    });
                }

                uploadInput.value = '';
                await loadDocuments();
                showDashboardToast('success', 'Files Saved', 'The selected files are now stored in your Agent Workspace library.');
            } catch (error) {
                uploadInput.value = '';
                showDashboardToast('error', 'Upload Failed', error.message || 'Unable to save the selected files.');
            }
        });

        window.addEventListener('dashboard-data-updated', () => {
            syncRecipientDefaults();
            void syncSenderDefaults(false, true);
        });

        window.addEventListener('agent-workspace-email-prefill', (event) => {
            prefillRecipientForEmailPrep(event && event.detail);
        });

        loadDraft();
        void syncSenderDefaults(true, true);
        loadDocuments();
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
                const normalizedRole = String(item.role || '').toLowerCase();
                const roleClass = normalizedRole === 'admin' ? 'published' : 'draft';
                const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown';
                const currentEmail = String(item.email || '').trim().toLowerCase();
                const localPart = currentEmail.includes('@') ? currentEmail.split('@')[0] : currentEmail;
                const suggestedEmail = localPart ? `${localPart}@${nextDomain}` : '';
                row.innerHTML = `
                    <div class="outreach-item-head">
                        <span class="outreach-item-title">${item.name || 'User'}</span>
                        <span class="outreach-status ${roleClass}">${formatUserRoleLabel(item.role)}</span>
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
                            currentUser = persistStoredCurrentUserIdentity(currentUser);
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

            if (!['admin', 'user', 'premium user', 'broker'].includes(role)) {
                showDashboardToast('error', 'Invalid Role', 'Role must be admin, user, premium user, or broker.');
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

                showDashboardToast('success', 'Account Created', `${data.user.email} created as ${formatUserRoleLabel(data.user.role)}.`);
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
                            currentUser = persistStoredCurrentUserIdentity(currentUser);
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

    function initAdminOnlineUsersWidget() {
        const list = document.getElementById('admin-online-users-list');
        if (!list) {
            return;
        }

        const subtitle = document.getElementById('admin-online-users-subtitle');
        const refreshButton = document.getElementById('admin-online-users-refresh');
        const token = localStorage.getItem('authToken');
        let currentUser = null;
        let refreshHandle = null;

        try {
            currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            currentUser = null;
        }

        if (!currentUser || currentUser.role !== 'admin') {
            if (subtitle) {
                subtitle.textContent = 'Only admin accounts can review currently active users.';
            }
            list.innerHTML = '<p class="outreach-empty">Admin access required.</p>';
            return;
        }

        function escapeOnlineUserText(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function formatOnlineTime(value) {
            if (!value) {
                return 'Unknown';
            }

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                return String(value);
            }

            return parsed.toLocaleString();
        }

        function renderUsers(payload) {
            const users = Array.isArray(payload?.users) ? payload.users : [];
            const windowMinutes = Number(payload?.windowMinutes) || 5;
            list.innerHTML = '';

            if (subtitle) {
                const userCount = Number(payload?.totalUsersOnline) || users.length;
                const sessionCount = Number(payload?.totalSessionsOnline) || 0;
                subtitle.textContent = `${userCount} user${userCount === 1 ? '' : 's'} online across ${sessionCount} active session${sessionCount === 1 ? '' : 's'} in the last ${windowMinutes} minutes.`;
            }

            if (!users.length) {
                list.innerHTML = '<p class="outreach-empty">No users have been active in the current online window.</p>';
                return;
            }

            users.forEach((user) => {
                const row = document.createElement('article');
                row.className = 'outreach-item';
                const sessionPreview = (Array.isArray(user.sessions) ? user.sessions : [])
                    .slice(0, 3)
                    .map((session) => {
                        const agent = escapeOnlineUserText(session.userAgent || 'Unknown device');
                        const ip = escapeOnlineUserText(session.ipAddress || 'No IP');
                        return `<p class="outreach-owner">${agent} • ${ip} • Last seen ${escapeOnlineUserText(formatOnlineTime(session.lastSeenAt))}</p>`;
                    })
                    .join('');
                const extraSessions = Math.max((Number(user.sessionCount) || 0) - 3, 0);

                row.innerHTML = `
                    <div class="outreach-item-head">
                        <span class="outreach-item-title">${escapeOnlineUserText(user.name || 'Unknown user')}</span>
                        <span class="outreach-status published">${escapeOnlineUserText(formatUserRoleLabel(user.role))}</span>
                    </div>
                    <p class="outreach-item-body">${escapeOnlineUserText(user.email || 'No email')}</p>
                    <p class="outreach-owner">${escapeOnlineUserText(String(user.sessionCount || 0))} active device${Number(user.sessionCount) === 1 ? '' : 's'} • Last seen ${escapeOnlineUserText(formatOnlineTime(user.lastSeenAt))}</p>
                    ${sessionPreview}
                    ${extraSessions > 0 ? `<p class="outreach-owner">+${extraSessions} more active session${extraSessions === 1 ? '' : 's'}</p>` : ''}
                `;
                list.appendChild(row);
            });
        }

        async function loadOnlineUsers() {
            if (!token) {
                list.innerHTML = '<p class="outreach-empty">Missing auth token. Please sign in again.</p>';
                return;
            }

            if (refreshButton) {
                refreshButton.disabled = true;
            }

            try {
                const response = await fetch('/api/admin/online-users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load online users');
                }
                renderUsers(data);
            } catch (error) {
                if (subtitle) {
                    subtitle.textContent = 'Unable to refresh online user status right now.';
                }
                list.innerHTML = `<p class="outreach-empty">${escapeOnlineUserText(String(error.message || 'Unable to load online users.'))}</p>`;
            } finally {
                if (refreshButton) {
                    refreshButton.disabled = false;
                }
            }
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', loadOnlineUsers);
        }

        loadOnlineUsers();
        refreshHandle = window.setInterval(loadOnlineUsers, 30000);
        window.addEventListener('beforeunload', () => {
            if (refreshHandle) {
                window.clearInterval(refreshHandle);
            }
        }, { once: true });
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

    function initAdminPropertySubmissions() {
        const submissionsList = document.getElementById('admin-property-submissions-list');
        if (!submissionsList) {
            return;
        }

        const subtitle = document.getElementById('property-submissions-subtitle');
        const token = localStorage.getItem('authToken');
        let currentUser = null;

        try {
            currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            currentUser = null;
        }

        if (!currentUser || currentUser.role !== 'admin') {
            if (subtitle) {
                subtitle.textContent = 'Only admin accounts can review seller submissions.';
            }
            submissionsList.innerHTML = '<p class="outreach-empty">Admin access required.</p>';
            return;
        }

        function escapeSubmissionText(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function renderSubmissions(items) {
            submissionsList.innerHTML = '';

            if (!Array.isArray(items) || items.length === 0) {
                if (subtitle) {
                    subtitle.textContent = 'Seller inquiries submitted from the public homepage form';
                }
                submissionsList.innerHTML = '<p class="outreach-empty">No property submissions yet.</p>';
                return;
            }

            if (subtitle) {
                subtitle.textContent = `${items.length} property submission${items.length === 1 ? '' : 's'} waiting for review`;
            }

            items.forEach((item) => {
                const row = document.createElement('article');
                row.className = 'outreach-item';
                const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown';
                const propertyLine = [item.propertyAddress, item.propertyCity, item.propertyState, item.propertyZip]
                    .map((entry) => String(entry || '').trim())
                    .filter(Boolean)
                    .join(', ');
                const issues = Array.isArray(item.conditionIssues) && item.conditionIssues.length > 0
                    ? item.conditionIssues.map((issue) => escapeSubmissionText(issue)).join(' • ')
                    : 'No condition issues selected';

                row.innerHTML = `
                    <div class="outreach-item-head">
                        <span class="outreach-item-title">${escapeSubmissionText(item.sellerName || 'Unknown seller')}</span>
                        <span class="outreach-status draft">${escapeSubmissionText(item.status || 'new')}</span>
                    </div>
                    <p class="outreach-item-body">${escapeSubmissionText(propertyLine || item.propertyAddress || 'No property address provided')}</p>
                    <p class="outreach-owner">Email: ${escapeSubmissionText(item.sellerEmail || 'No email provided')}</p>
                    <p class="outreach-owner">Phone: ${escapeSubmissionText(item.sellerPhone || 'No phone submitted')}</p>
                    <p class="outreach-owner">Property Type: ${escapeSubmissionText(item.propertyType || 'Not provided')}</p>
                    <p class="outreach-owner">Beds / Baths / Sq Ft: ${escapeSubmissionText(item.bedrooms || '-') } / ${escapeSubmissionText(item.bathrooms || '-') } / ${escapeSubmissionText(item.squareFeet || '-')}</p>
                    <p class="outreach-owner">Target Price: ${escapeSubmissionText(item.askingPrice || 'Not provided')}</p>
                    <p class="outreach-owner">Timeline: ${escapeSubmissionText(item.timeline || 'Not provided')}</p>
                    <p class="outreach-owner">Submitted: ${escapeSubmissionText(createdAt)}</p>
                    <p class="outreach-item-body"><strong>Condition:</strong> ${issues}</p>
                    <p class="outreach-item-body">${escapeSubmissionText(item.issueNotes || 'No extra property notes submitted.')}</p>
                `;
                submissionsList.appendChild(row);
            });
        }

        async function loadSubmissions() {
            if (!token) {
                submissionsList.innerHTML = '<p class="outreach-empty">Missing auth token. Please sign in again.</p>';
                return;
            }

            try {
                const response = await fetch('/api/property-submissions', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load property submissions');
                }
                renderSubmissions(data.submissions || []);
            } catch (error) {
                submissionsList.innerHTML = `<p class="outreach-empty">${String(error.message || 'Unable to load property submissions.')}</p>`;
            }
        }

        loadSubmissions();
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

        function getEffectiveCountyForCard(card) {
            const inferredCounty = resolveCountyFilterValueFromLocation([
                String(card.dataset.city || '').trim(),
                String(card.dataset.county || '').trim(),
                card.querySelector('.mls-location')?.textContent || '',
                String(card.dataset.search || '').trim()
            ].join(' '));

            return inferredCounty || normalizeCountyFilterValue(card.dataset.county || '');
        }

        function buildAgentRecordFromCard(card) {
            const address = parseAddress(card);
            const county = getEffectiveCountyForCard(card);
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
            const resolvedCounty = getEffectiveCountyForCard(card);
            if (resolvedCounty) {
                card.dataset.countyResolved = resolvedCounty;
                card.dataset.county = resolvedCounty;
            }
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
                const matchesCounty = selectedCounty === 'all' || getEffectiveCountyForCard(card) === selectedCounty;
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
        let agreementLogoDataUrlPromise = null;
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
            const currentUserEmail = normalizeEmail(workspaceUser.email || '');

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

            const currentName = normalizeName(workspaceUser.name || '');
            const currentEmail = normalizeEmail(workspaceUser.email || '');
            const fallbackContacts = [];

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

        function loadAgreementLogoDataUrl() {
            if (agreementLogoDataUrlPromise) {
                return agreementLogoDataUrlPromise;
            }

            agreementLogoDataUrlPromise = fetch('png photos/Fast Logo - 111.png')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Logo file could not be loaded.');
                    }
                    return response.blob();
                })
                .then((blob) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.onerror = () => reject(new Error('Logo file could not be read.'));
                    reader.readAsDataURL(blob);
                }))
                .catch(() => '');

            return agreementLogoDataUrlPromise;
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
        const introPreview = document.getElementById('contract-preview-intro');
        const limitedPurposePreview = document.getElementById('contract-preview-limited-purpose');
        const fastbridgeResponsibilityPreview = document.getElementById('contract-preview-fastbridge-responsibility');
        const intentPreview = document.getElementById('contract-preview-intent');

        if (!downloadPdfBtn) {
            return;
        }

        let jsPdfLoaderPromise = null;
    let agreementLogoDataUrlPromise = null;

        const fieldReaders = {
            effectiveDate: () => document.getElementById('contract-effective-date')?.value || '',
            market: () => document.getElementById('contract-mls-market')?.value || '',
            brokerageName: () => document.getElementById('contract-brokerage-name')?.value || '',
            fastbridgeBusinessAddress: () => document.getElementById('contract-fastbridge-business-address')?.value || '',
            brokerageBusinessAddress: () => document.getElementById('contract-brokerage-business-address')?.value || '',
            brokerageSignerName: () => document.getElementById('contract-brokerage-signer-name')?.value || '',
            brokerageSignerTitle: () => document.getElementById('contract-brokerage-signer-title')?.value || '',
            brokerageLicenseNumber: () => document.getElementById('contract-brokerage-license-number')?.value || '',
            brokerageSignature: () => document.getElementById('contract-brokerage-signature')?.value || '',
            brokerageSignDate: () => document.getElementById('contract-brokerage-sign-date')?.value || '',
            fastbridgeSignerName: () => document.getElementById('contract-fastbridge-signer-name')?.value || '',
            fastbridgeSignerTitle: () => document.getElementById('contract-fastbridge-signer-title')?.value || '',
            fastbridgeSignature: () => document.getElementById('contract-fastbridge-signature')?.value || '',
            fastbridgeSignDate: () => document.getElementById('contract-fastbridge-sign-date')?.value || ''
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
            const slug = normalizeValue(brokerageName, 'mls-data-license-limited-use')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            return `${slug || 'mls-data-license-limited-use'}-agreement.pdf`;
        }

        function buildAgreementData() {
            return {
                effectiveDate: formatDateValue(fieldReaders.effectiveDate()),
                market: normalizeValue(fieldReaders.market(), '________________'),
                brokerageName: normalizeValue(fieldReaders.brokerageName(), 'the licensed brokerage identified below'),
                fastbridgeBusinessAddress: normalizeValue(fieldReaders.fastbridgeBusinessAddress(), '________________'),
                brokerageBusinessAddress: normalizeValue(fieldReaders.brokerageBusinessAddress(), '________________'),
                brokerageSignerName: normalizeValue(fieldReaders.brokerageSignerName(), 'the brokerage\'s authorized signer'),
                brokerageSignerTitle: normalizeValue(fieldReaders.brokerageSignerTitle(), '________________'),
                brokerageLicenseNumber: normalizeValue(fieldReaders.brokerageLicenseNumber(), '________________'),
                brokerageSignature: normalizeValue(fieldReaders.brokerageSignature(), '________________'),
                brokerageSignDate: formatDateValue(fieldReaders.brokerageSignDate()),
                fastbridgeSignerName: normalizeValue(fieldReaders.fastbridgeSignerName(), 'FAST BRIDGE\'s authorized signer'),
                fastbridgeSignerTitle: normalizeValue(fieldReaders.fastbridgeSignerTitle(), '________________'),
                fastbridgeSignature: normalizeValue(fieldReaders.fastbridgeSignature(), '________________'),
                fastbridgeSignDate: formatDateValue(fieldReaders.fastbridgeSignDate())
            };
        }

        function buildAgreementClauses(agreementData) {
            return [
                {
                    title: 'Purpose',
                    body: `This Agreement establishes a limited relationship under which ${agreementData.brokerageName} authorizes FAST BRIDGE GROUP, LLC to operate a real estate platform that accesses and displays MLS data under brokerage supervision in a manner consistent with applicable MLS, IDX, VOW, legal, and broker risk-management requirements.`
                },
                {
                    title: 'Limited License & Authorization',
                    body: `${agreementData.brokerageName}, through ${agreementData.brokerageSignerName}, grants FAST BRIDGE GROUP, LLC, through ${agreementData.fastbridgeSignerName}, a limited, non-exclusive, revocable authorization to access MLS data feeds, including IDX and VOW as applicable, display listing data on FAST BRIDGE platforms, and operate subject to brokerage oversight required for compliance with law, MLS rules, and the brokerage's license obligations. FAST BRIDGE does not receive ownership of MLS data.`
                },
                {
                    title: 'Ownership of Platform & Intellectual Property',
                    body: 'FAST BRIDGE GROUP, LLC retains ownership of its website, platform, infrastructure, source code, software systems, databases excluding MLS data, branding, domains, marketing systems, user data excluding MLS-provided data, CRM systems, workflows, and automations. Nothing in this Agreement grants the brokerage any ownership interest in FAST BRIDGE intellectual property.'
                },
                {
                    title: 'Brokerage Compliance and Risk Management Authority',
                    body: `${agreementData.brokerageName} retains authority necessary to ensure compliance with MLS rules, applicable law, and risk-management obligations associated with its license, including requiring corrections to listing display, disclosures, marketing claims, data handling, and other platform activity that could reasonably create broker liability. The parties will work cooperatively to resolve compliance issues, and brokerage authority under this Section does not grant the brokerage ownership of FAST BRIDGE intellectual property or day-to-day control over unrelated product development decisions.`
                },
                {
                    title: 'FAST BRIDGE Responsibilities',
                    body: 'FAST BRIDGE GROUP, LLC agrees to maintain operational control of the platform, ensure MLS data is displayed in compliance with applicable rules, implement required disclaimers and attribution, maintain applicable data accuracy and refresh standards, maintain reasonable data security safeguards, and promptly correct compliance issues upon notice.'
                },
                {
                    title: 'Data Use Restrictions',
                    body: 'FAST BRIDGE GROUP, LLC shall not resell, redistribute, sublicense, unlawfully scrape, mine, repurpose, store, or use MLS, IDX, or VOW data outside permitted display purposes or beyond permitted retention limits. All MLS data remains subject to third-party ownership, MLS rules, and brokerage compliance requirements.'
                },
                {
                    title: 'Indemnification',
                    body: `FAST BRIDGE GROUP, LLC shall indemnify, defend, and hold harmless ${agreementData.brokerageName} and its agents from claims, damages, liabilities, losses, penalties, and legal actions arising from FAST BRIDGE platform operations, data misuse, technology failures, or non-compliance caused by FAST BRIDGE. ${agreementData.brokerageName} shall indemnify FAST BRIDGE GROUP, LLC only for violations directly caused by the brokerage's licensing status, misconduct, or breach of non-waivable duties.`
                },
                {
                    title: 'Term and Termination',
                    body: `Either party may terminate this Agreement upon thirty (30) days' written notice. Immediate termination may occur for MLS violations, legal non-compliance, data-security failures, or breach of this Agreement. Upon termination, FAST BRIDGE GROUP, LLC must discontinue MLS data use tied to ${agreementData.brokerageName}, and ${agreementData.brokerageName} retains no rights to FAST BRIDGE systems, software, or non-MLS data. Where permitted, ${agreementData.brokerageName} agrees to reasonably cooperate in transitioning MLS data access to a successor brokerage so FAST BRIDGE can maintain lawful operations without unnecessary interruption.`
                },
                {
                    title: 'No Partnership or Agency',
                    body: 'This Agreement does not create a partnership, joint venture, employer-employee relationship, or ownership interest. FAST BRIDGE GROUP, LLC operates as an independent entity, subject only to required legal supervision by the brokerage.'
                },
                {
                    title: 'Audit & Verification Rights',
                    body: `Upon reasonable notice, ${agreementData.brokerageName} may request verification of compliance with MLS rules. Any audit or review shall be limited to compliance matters only, shall avoid unnecessary exposure of proprietary systems or code, and shall be conducted in a commercially reasonable manner.`
                },
                {
                    title: 'Broker License Verification',
                    body: `The brokerage represents and warrants that it holds a valid, active real estate license in good standing and that ${agreementData.brokerageSignerName} holds an active broker license in good standing with authority to bind ${agreementData.brokerageName}. ${agreementData.brokerageName} shall promptly notify FAST BRIDGE GROUP, LLC of any suspension, lapse, restriction, disciplinary action, or other change in licensing status that could affect MLS access, broker supervision, or this Agreement.`
                },
                {
                    title: 'MLS Rules Control',
                    body: 'In the event of any conflict between this Agreement and applicable MLS, IDX, or VOW rules, policies, or data-license requirements, the applicable MLS rules and related governing requirements shall control.'
                },
                {
                    title: 'Governing Law',
                    body: 'This Agreement shall be governed by the laws of the State of California. Any disputes shall be resolved in the appropriate state or federal courts located within California, unless non-waivable law or an applicable MLS agreement requires another forum.'
                },
                {
                    title: 'Entire Agreement',
                    body: 'This Agreement constitutes the entire understanding between the parties regarding MLS-related authorization and supersedes prior discussions, drafts, representations, or agreements on that subject.'
                }
            ];
        }

        function buildAgreementPreviewContent(agreementData) {
            return {
                intro: `This Agreement is entered into by and between FAST BRIDGE GROUP, LLC, a California limited liability company with a business address at ${agreementData.fastbridgeBusinessAddress}, acting by and through ${agreementData.fastbridgeSignerName}, and ${agreementData.brokerageName}, a licensed real estate brokerage with a business address at ${agreementData.brokerageBusinessAddress}, acting by and through ${agreementData.brokerageSignerName} as its duly authorized licensed broker, solely for the limited purpose of enabling lawful MLS data access, display, and compliance under brokerage supervision and applicable MLS authorization.`,
                limitedPurpose: `${agreementData.brokerageName}, through ${agreementData.brokerageSignerName}, grants FAST BRIDGE GROUP, LLC, through ${agreementData.fastbridgeSignerName}, a limited, non-exclusive, revocable authorization to access MLS data feeds, including IDX and VOW as applicable, display listing data on FAST BRIDGE platforms, and operate subject to brokerage oversight required for compliance with law, MLS rules, and the brokerage's license obligations. FAST BRIDGE does not receive ownership of MLS data.`,
                fastbridgeResponsibility: 'FAST BRIDGE GROUP, LLC agrees to maintain operational control of the platform, ensure MLS data is displayed in compliance with applicable rules, implement required disclaimers and attribution, maintain applicable data accuracy and refresh standards, maintain reasonable data security safeguards, and promptly correct compliance issues upon notice.',
                intent: 'Intent of this agreement: this is a compliance-based licensing relationship only, where the brokerage provides lawful MLS access and retains authority necessary to satisfy its MLS, legal, and broker risk-management duties, while FAST BRIDGE retains ownership and operational control of its platform subject to that required oversight.'
            };
        }

        function updateContractPreview() {
            const agreementData = buildAgreementData();
            const previewContent = buildAgreementPreviewContent(agreementData);

            if (introPreview) {
                introPreview.textContent = previewContent.intro;
            }
            if (limitedPurposePreview) {
                limitedPurposePreview.textContent = previewContent.limitedPurpose;
            }
            if (fastbridgeResponsibilityPreview) {
                fastbridgeResponsibilityPreview.textContent = previewContent.fastbridgeResponsibility;
            }
            if (intentPreview) {
                intentPreview.innerHTML = `<strong>Intent of this agreement:</strong> ${previewContent.intent.replace(/^Intent of this agreement:\s*/i, '')}`;
            }
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

        function loadAgreementLogoDataUrl() {
            if (agreementLogoDataUrlPromise) {
                return agreementLogoDataUrlPromise;
            }

            agreementLogoDataUrlPromise = fetch('png photos/Fast Logo - 111.png')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to load agreement logo.');
                    }
                    return response.blob();
                })
                .then((blob) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(String(reader.result || ''));
                    reader.onerror = () => reject(new Error('Unable to read agreement logo.'));
                    reader.readAsDataURL(blob);
                }))
                .catch(() => null);

            return agreementLogoDataUrlPromise;
        }

        function downloadPdfBlob(blob, fileName) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function buildAgreementSections() {
            const agreementData = buildAgreementData();
            const clauses = buildAgreementClauses(agreementData);

            const sections = [
                {
                    heading: 'MLS DATA LICENSE & LIMITED USE AGREEMENT',
                    lines: [
                        `Effective Date: ${agreementData.effectiveDate}`,
                        'By and Between:',
                        'FAST BRIDGE GROUP, LLC, a California limited liability company',
                        `FAST BRIDGE Business Address: ${agreementData.fastbridgeBusinessAddress}`,
                        `and ${agreementData.brokerageName}, a licensed real estate brokerage acting through its duly authorized licensed broker`,
                        `Brokerage Business Address: ${agreementData.brokerageBusinessAddress}`,
                        `MLS Market / Region: ${agreementData.market}`,
                        `Brokerage Legal Name: ${agreementData.brokerageName}`,
                        '',
                        `This Agreement is entered into by and between FAST BRIDGE GROUP, LLC, acting by and through ${agreementData.fastbridgeSignerName}, and ${agreementData.brokerageName}, acting by and through ${agreementData.brokerageSignerName} as its duly authorized licensed broker, solely for the limited purpose of enabling lawful MLS data access, display, and compliance under brokerage supervision and applicable MLS authorization.`
                    ]
                },
                {
                    heading: 'Working Draft Notice',
                    lines: [
                        'This agreement is drafted to reflect a compliance-based MLS authorization structure only. FAST BRIDGE GROUP, LLC retains ownership of its platform and non-MLS intellectual property, while the brokerage retains the authority reasonably necessary to satisfy its MLS, legal, and broker risk-management obligations. Final legal review is still recommended before signing.'
                    ]
                },
                ...clauses.map((clause, index) => ({
                    heading: `${String(index + 1).padStart(2, '0')} ${clause.title}`,
                    lines: [clause.body]
                })),
                {
                    heading: 'Intent of This Agreement',
                    lines: [
                        'The intent of this Agreement is to establish a compliance-based licensing relationship only, where the brokerage provides lawful MLS access and retains authority necessary to satisfy its MLS, legal, and broker risk-management obligations, while FAST BRIDGE retains ownership and operational control of its platform subject to that required oversight. Nothing in this Agreement grants the brokerage any ownership interest in FAST BRIDGE intellectual property.'
                    ]
                },
                {
                    heading: 'Signature Blocks',
                    lines: [
                        `Brokerage Signer: ${agreementData.brokerageSignerName}`,
                        `Title: ${agreementData.brokerageSignerTitle}`,
                        `License #: ${agreementData.brokerageLicenseNumber}`,
                        `Signature: ${agreementData.brokerageSignature}`,
                        `Date: ${agreementData.brokerageSignDate}`,
                        '',
                        `FAST BRIDGE GROUP, LLC Signer: ${agreementData.fastbridgeSignerName}`,
                        `Title: ${agreementData.fastbridgeSignerTitle}`,
                        `Signature: ${agreementData.fastbridgeSignature}`,
                        `Date: ${agreementData.fastbridgeSignDate}`
                    ]
                }
            ];

            return {
                sections,
                fileName: buildAgreementFileName(agreementData.brokerageName)
            };
        }

        [
            'contract-effective-date',
            'contract-mls-market',
            'contract-brokerage-name',
            'contract-fastbridge-business-address',
            'contract-brokerage-business-address',
            'contract-brokerage-signer-name',
            'contract-brokerage-signer-title',
            'contract-brokerage-license-number',
            'contract-brokerage-signature',
            'contract-brokerage-sign-date',
            'contract-fastbridge-signer-name',
            'contract-fastbridge-signer-title',
            'contract-fastbridge-signature',
            'contract-fastbridge-sign-date'
        ].forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field) {
                return;
            }

            field.addEventListener('input', updateContractPreview);
            field.addEventListener('change', updateContractPreview);
        });

        updateContractPreview();

        async function downloadAgreementPdf() {
            downloadPdfBtn.disabled = true;

            const agreementData = buildAgreementData();
            const { sections, fileName } = buildAgreementSections();

            const buildFallbackLines = () => {
                const lines = [];
                sections.forEach((section) => {
                    lines.push(section.heading);
                    section.lines.forEach((line) => {
                        lines.push(String(line || ''));
                    });
                    lines.push('');
                });
                return lines;
            };

            try {
                const JsPdfConstructor = await loadJsPdf();
                const agreementLogoDataUrl = await loadAgreementLogoDataUrl();
                const pdf = new JsPdfConstructor({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'letter'
                });

                const marginX = 48;
                const pageHeight = pdf.internal.pageSize.getHeight();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const contentWidth = pageWidth - (marginX * 2);
                const topMargin = 88;
                const bottomMargin = 56;
                const agreementTitle = 'MLS DATA LICENSE & LIMITED USE AGREEMENT';
                const agreementSubtitle = 'Compliance-Based MLS Authorization';
                const brandColors = {
                    ink: [15, 23, 42],
                    muted: [71, 85, 105],
                    line: [203, 213, 225],
                    panel: [248, 250, 252],
                    accent: [14, 116, 144],
                    accentSoft: [236, 253, 255],
                    gold: [180, 83, 9],
                    goldSoft: [255, 247, 237],
                    white: [255, 255, 255]
                };
                const clauseEntries = buildAgreementClauses(agreementData);
                let cursorY = topMargin;

                function setFillColor(color) {
                    pdf.setFillColor(color[0], color[1], color[2]);
                }

                function setDrawColor(color) {
                    pdf.setDrawColor(color[0], color[1], color[2]);
                }

                function setTextColor(color) {
                    pdf.setTextColor(color[0], color[1], color[2]);
                }

                function drawPageHeader() {
                    setFillColor(brandColors.ink);
                    pdf.rect(0, 0, pageWidth, 50, 'F');
                    setFillColor(brandColors.accent);
                    pdf.rect(0, 50, pageWidth, 4, 'F');

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(11);
                    setTextColor(brandColors.white);
                    pdf.text('FAST BRIDGE GROUP, LLC', marginX, 31);

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.text(agreementTitle, pageWidth - marginX, 31, { align: 'right' });
                    setTextColor(brandColors.ink);
                }

                function addNewPage() {
                    pdf.addPage();
                    drawPageHeader();
                    cursorY = topMargin;
                }

                function ensurePage(requiredHeight) {
                    if (cursorY + requiredHeight <= pageHeight - bottomMargin) {
                        return;
                    }
                    addNewPage();
                }

                function renderMetaTile(x, y, width, label, value) {
                    const tileHeight = 62;
                    const valueLines = pdf.splitTextToSize(String(value || ''), width - 20);

                    setDrawColor(brandColors.line);
                    setFillColor([255, 255, 255]);
                    pdf.roundedRect(x, y, width, tileHeight, 14, 14, 'FD');

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(9);
                    setTextColor(brandColors.muted);
                    pdf.text(label, x + 10, y + 16);

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    setTextColor(brandColors.ink);
                    const renderedValue = valueLines.slice(0, 2);
                    renderedValue.forEach((line, index) => {
                        pdf.text(line, x + 10, y + 34 + (index * 12));
                    });
                }

                function renderHeroPanel() {
                    const heroX = marginX;
                    const heroY = cursorY;
                    const heroWidth = contentWidth;
                    const baseHeroHeight = 230;
                    const heroPadding = 24;
                    const logoMaxWidth = 122;
                    const logoMaxHeight = 58;
                    const logoTextGap = 64;
                    const metaGap = 10;
                    let logoRenderWidth = 0;
                    let logoRenderHeight = 0;

                    if (agreementLogoDataUrl) {
                        try {
                            const imageProps = typeof pdf.getImageProperties === 'function'
                                ? pdf.getImageProperties(agreementLogoDataUrl)
                                : null;
                            const sourceWidth = Number(imageProps?.width || 0);
                            const sourceHeight = Number(imageProps?.height || 0);

                            logoRenderWidth = logoMaxWidth;
                            logoRenderHeight = logoMaxHeight;

                            if (sourceWidth > 0 && sourceHeight > 0) {
                                const scale = Math.min(logoMaxWidth / sourceWidth, logoMaxHeight / sourceHeight);
                                logoRenderWidth = sourceWidth * scale;
                                logoRenderHeight = sourceHeight * scale;
                            }
                        } catch (imageError) {
                            logoRenderWidth = logoMaxWidth;
                            logoRenderHeight = logoMaxHeight;
                        }
                    }

                    const metaWidth = (heroWidth - (metaGap * 2) - (heroPadding * 2)) / 3;
                    const mastheadWidth = logoRenderWidth > 0
                        ? heroWidth - (heroPadding * 2) - logoRenderWidth - logoTextGap
                        : heroWidth - (heroPadding * 2);
                    const introWidth = heroWidth - (heroPadding * 2);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(20);
                    const titleLines = pdf.splitTextToSize(agreementTitle, mastheadWidth);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(11);
                    const subtitleLines = pdf.splitTextToSize(agreementSubtitle, mastheadWidth);
                    pdf.setFontSize(10.5);
                    const introLines = pdf.splitTextToSize(
                        `This Agreement is entered into by and between FAST BRIDGE GROUP, LLC and ${agreementData.brokerageName}, solely for the limited purpose of enabling lawful MLS data access, display, and compliance under brokerage supervision and applicable MLS authorization.`,
                        introWidth
                    ).slice(0, 4);
                    const titleLineHeight = 16;
                    const subtitleLineHeight = 13;
                    const titleY = heroY + 54;
                    const subtitleY = titleY + (titleLines.length * titleLineHeight) + 10;
                    const introY = subtitleY + (subtitleLines.length * subtitleLineHeight) + 16;
                    const metaY = Math.max(heroY + 156, introY + (introLines.length * 14) + 14);
                    const heroHeight = Math.max(baseHeroHeight, (metaY - heroY) + 62 + 18);

                    ensurePage(heroHeight + 16);

                    setFillColor(brandColors.ink);
                    pdf.roundedRect(heroX, heroY, heroWidth, heroHeight, 24, 24, 'F');
                    setFillColor(brandColors.accent);
                    pdf.roundedRect(heroX + heroPadding, heroY + heroPadding, 70, 6, 3, 3, 'F');

                    if (agreementLogoDataUrl) {
                        try {
                            pdf.addImage(
                                agreementLogoDataUrl,
                                'PNG',
                                heroX + heroWidth - heroPadding - logoRenderWidth,
                                heroY + heroPadding,
                                logoRenderWidth,
                                logoRenderHeight,
                                undefined,
                                'FAST'
                            );
                        } catch (imageError) {
                            // Ignore image rendering errors and continue with the text layout.
                        }
                    }

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(20);
                    setTextColor(brandColors.white);
                    titleLines.forEach((line, index) => {
                        pdf.text(line, heroX + heroPadding, titleY + (index * titleLineHeight));
                    });

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(11);
                    setTextColor([226, 232, 240]);
                    subtitleLines.forEach((line, index) => {
                        pdf.text(line, heroX + heroPadding, subtitleY + (index * subtitleLineHeight));
                    });

                    pdf.setFontSize(10.5);
                    introLines.forEach((line, index) => {
                        pdf.text(line, heroX + heroPadding, introY + (index * 14));
                    });

                    renderMetaTile(heroX + heroPadding, metaY, metaWidth, 'Effective Date', agreementData.effectiveDate);
                    renderMetaTile(heroX + heroPadding + metaWidth + metaGap, metaY, metaWidth, 'MLS Market', agreementData.market);
                    renderMetaTile(heroX + heroPadding + ((metaWidth + metaGap) * 2), metaY, metaWidth, 'Brokerage', agreementData.brokerageName);

                    cursorY += heroHeight + 14;
                }

                function renderNoticeCard() {
                    const noticeLines = pdf.splitTextToSize(
                        'This agreement is drafted to reflect a compliance-based MLS authorization structure only. FAST BRIDGE GROUP, LLC retains ownership of its platform and non-MLS intellectual property, while the brokerage retains the authority reasonably necessary to satisfy its MLS, legal, and broker risk-management obligations. Final legal review is still recommended before signing.',
                        contentWidth - 52
                    );
                    const cardHeight = 52 + (noticeLines.length * 13) + 18;

                    ensurePage(cardHeight + 12);

                    setDrawColor(brandColors.gold);
                    setFillColor(brandColors.goldSoft);
                    pdf.roundedRect(marginX, cursorY, contentWidth, cardHeight, 18, 18, 'FD');
                    setFillColor(brandColors.gold);
                    pdf.roundedRect(marginX + 16, cursorY + 16, 62, 5, 2.5, 2.5, 'F');

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(11);
                    setTextColor(brandColors.gold);
                    pdf.text('WORKING DRAFT NOTICE', marginX + 16, cursorY + 36);

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10.5);
                    setTextColor(brandColors.ink);
                    noticeLines.forEach((line, index) => {
                        pdf.text(line, marginX + 16, cursorY + 58 + (index * 13));
                    });

                    cursorY += cardHeight + 14;
                }

                function renderClauseCard(index, title, body) {
                    const cardPadding = 18;
                    const badgeSize = 30;
                    const textWidth = contentWidth - (cardPadding * 2) - badgeSize - 16;
                    const bodyLines = pdf.splitTextToSize(String(body || ''), textWidth);
                    const cardHeight = 44 + (bodyLines.length * 13) + 22;

                    ensurePage(cardHeight + 12);

                    setDrawColor(brandColors.line);
                    setFillColor(brandColors.panel);
                    pdf.roundedRect(marginX, cursorY, contentWidth, cardHeight, 18, 18, 'FD');

                    setFillColor(index === 2 ? brandColors.goldSoft : brandColors.accentSoft);
                    pdf.roundedRect(marginX, cursorY, 8, cardHeight, 8, 8, 'F');

                    setFillColor(index === 2 ? brandColors.gold : brandColors.accent);
                    pdf.roundedRect(marginX + cardPadding, cursorY + 16, badgeSize, badgeSize, 10, 10, 'F');
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    setTextColor(brandColors.white);
                    pdf.text(String(index).padStart(2, '0'), marginX + cardPadding + (badgeSize / 2), cursorY + 35, { align: 'center' });

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(12);
                    setTextColor(brandColors.ink);
                    pdf.text(title, marginX + cardPadding + badgeSize + 16, cursorY + 28);

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10.5);
                    setTextColor(brandColors.muted);
                    bodyLines.forEach((line, lineIndex) => {
                        pdf.text(line, marginX + cardPadding + badgeSize + 16, cursorY + 48 + (lineIndex * 13));
                    });

                    cursorY += cardHeight + 12;
                }

                function renderSectionIntro(title, copy) {
                    const normalizedCopy = String(copy || '').trim();
                    const copyLines = normalizedCopy ? pdf.splitTextToSize(normalizedCopy, contentWidth - 22) : [];
                    const blockHeight = 22 + (copyLines.length * 12);
                    ensurePage(blockHeight + 10);

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    setTextColor(brandColors.ink);
                    pdf.text(title, marginX, cursorY);
                    cursorY += copyLines.length > 0 ? 18 : 10;

                    if (!copyLines.length) {
                        return;
                    }

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    setTextColor(brandColors.muted);
                    copyLines.forEach((line, index) => {
                        pdf.text(line, marginX, cursorY + (index * 12));
                    });
                    cursorY += (copyLines.length * 12) + 10;
                }

                function renderSignatureBlock(title, fields) {
                    const blockX = marginX;
                    const blockWidth = contentWidth;
                    const blockPadding = 18;
                    const valueColumnOffset = 84;
                    const rowGap = 18;
                    const signatureLabelGap = 18;
                    const signatureLineGap = 46;
                    const signatureTextOffset = 22;
                    const blockHeight = 214;

                    ensurePage(blockHeight + 12);

                    setDrawColor(brandColors.line);
                    setFillColor(brandColors.panel);
                    pdf.roundedRect(blockX, cursorY, blockWidth, blockHeight, 20, 20, 'FD');
                    setFillColor(brandColors.ink);
                    pdf.roundedRect(blockX, cursorY, blockWidth, 38, 20, 20, 'F');
                    pdf.rect(blockX, cursorY + 20, blockWidth, 18, 'F');

                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(12);
                    setTextColor(brandColors.white);
                    pdf.text(title, blockX + blockPadding, cursorY + 24);

                    let blockY = cursorY + 62;
                    fields.forEach((field) => {
                        if (field.type === 'signature') {
                            const signatureValueX = blockX + blockPadding + valueColumnOffset;

                            pdf.setFont('helvetica', 'bold');
                            pdf.setFontSize(10);
                            setTextColor(brandColors.muted);
                            pdf.text(field.label, blockX + blockPadding, blockY);
                            blockY += signatureLabelGap;

                            setDrawColor(brandColors.line);
                            pdf.setLineWidth(1);
                            pdf.line(signatureValueX, blockY, blockX + blockWidth - blockPadding, blockY);

                            if (String(field.value || '').trim()) {
                                pdf.setFont('helvetica', 'normal');
                                pdf.setFontSize(10.5);
                                setTextColor(brandColors.ink);
                                pdf.text(String(field.value), signatureValueX, blockY - signatureTextOffset);
                            }

                            blockY += signatureLineGap;
                            return;
                        }

                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(10);
                        setTextColor(brandColors.muted);
                        pdf.text(`${field.label}:`, blockX + blockPadding, blockY);

                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(10.5);
                        setTextColor(brandColors.ink);
                        pdf.text(String(field.value || ''), blockX + blockPadding + valueColumnOffset, blockY);
                        blockY += rowGap;
                    });

                    cursorY += blockHeight + 14;
                }

                function renderAgreementFooters() {
                    const totalPages = typeof pdf.getNumberOfPages === 'function'
                        ? pdf.getNumberOfPages()
                        : pdf.internal.getNumberOfPages();
                    const footerY = pageHeight - 24;
                    const footerLineY = pageHeight - 40;
                    const footerTitle = 'MLS DATA LICENSE & LIMITED USE AGREEMENT';

                    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
                        pdf.setPage(pageNumber);
                        pdf.setDrawColor(203, 213, 225);
                        pdf.setLineWidth(0.75);
                        pdf.line(marginX, footerLineY, pageWidth - marginX, footerLineY);

                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(9);
                        pdf.setTextColor(71, 85, 105);
                        pdf.text(footerTitle, pageWidth / 2, footerY, { align: 'center' });
                        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
                    }

                    pdf.setTextColor(0, 0, 0);
                }

                drawPageHeader();
                renderHeroPanel();
                renderNoticeCard();
                renderSectionIntro(
                    'Core Clauses',
                    ''
                );

                clauseEntries.forEach((clause, index) => {
                    renderClauseCard(index + 1, clause.title, clause.body);
                });

                renderSectionIntro(
                    'Signature Blocks',
                    'Prepared for execution by the brokerage and FAST BRIDGE GROUP, LLC.'
                );

                renderSignatureBlock('Brokerage Signature', [
                    { label: 'Name', value: agreementData.brokerageSignerName },
                    { label: 'Title', value: agreementData.brokerageSignerTitle },
                    { label: 'License #', value: agreementData.brokerageLicenseNumber },
                    { label: 'Date', value: agreementData.brokerageSignDate },
                    { label: 'Signature', value: agreementData.brokerageSignature, type: 'signature' }
                ]);

                renderSignatureBlock('FAST BRIDGE GROUP, LLC Signature', [
                    { label: 'Name', value: agreementData.fastbridgeSignerName },
                    { label: 'Title', value: agreementData.fastbridgeSignerTitle },
                    { label: 'Date', value: agreementData.fastbridgeSignDate },
                    { label: 'Signature', value: agreementData.fastbridgeSignature, type: 'signature' }
                ]);

                renderAgreementFooters();

                pdf.save(fileName);
                showDashboardToast('success', 'Agreement Downloaded', 'MLS Data License Only was downloaded as a PDF.');
            } catch (error) {
                try {
                    const fallbackBlob = buildSimplePdfBlob(buildFallbackLines());
                    downloadPdfBlob(fallbackBlob, fileName);
                    showDashboardToast('success', 'Agreement Downloaded', 'Agreement PDF downloaded using the backup export format.');
                } catch (fallbackError) {
                    showDashboardToast('error', 'Download Failed', 'Unable to generate the agreement PDF right now.');
                }
            } finally {
                downloadPdfBtn.disabled = false;
            }
        }

        downloadPdfBtn.addEventListener('click', downloadAgreementPdf);
    }

    async function initDealsPage() {
        const list = document.getElementById('deals-compact-list');
        const count = document.getElementById('deals-compact-count');
        const listPagination = document.getElementById('deals-compact-pagination');
        const assignedList = document.getElementById('assigned-properties-list');
        const assignedCount = document.getElementById('assigned-properties-count');
        const assignedPagination = document.getElementById('assigned-properties-pagination');
        const importOverlay = document.getElementById('deals-import-overlay');
        const importOpenButton = document.getElementById('deals-import-open');
        const importForm = document.getElementById('deals-import-form');
        const importResetButton = document.getElementById('deals-import-reset');
        const importSourceUrlInput = document.getElementById('deals-import-source-url');
        const importSourceFetchButton = document.getElementById('deals-import-source-fetch');
        const importSourceButtons = Array.from(document.querySelectorAll('[data-import-source]'));
        const importCloseButton = importOverlay
            ? importOverlay.querySelector('.deals-import-close-btn[data-deals-import-close="true"]')
            : null;
        const importBackdrop = importOverlay
            ? importOverlay.querySelector('.deals-import-backdrop[data-deals-import-close="true"]')
            : null;
        const pageSize = 10;
        const paginationState = {
            assigned: 1,
            clicked: 1
        };
        let importBackdropPointerDown = false;
        let importSource = 'zillow';

        if (!list || !count || !assignedList || !assignedCount || !listPagination || !assignedPagination) {
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
                const firstInput = document.getElementById('deals-import-source-url') || document.getElementById('deals-import-address');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 40);
        }

        function setDealsImportSource(nextSource) {
            importSource = nextSource === 'redfin' ? 'redfin' : 'zillow';
            importSourceButtons.forEach((button) => {
                const isActive = button.getAttribute('data-import-source') === importSource;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            if (importSourceUrlInput) {
                importSourceUrlInput.placeholder = importSource === 'redfin'
                    ? 'Paste the Redfin property link here'
                    : 'Paste the Zillow property link here';
            }
        }

        function inferDealsImportSourceFromUrl(value) {
            const raw = String(value || '').trim().toLowerCase();
            if (raw.includes('redfin.com')) {
                return 'redfin';
            }
            if (raw.includes('zillow.com')) {
                return 'zillow';
            }
            return '';
        }

        function populateDealsImportForm(listing) {
            if (!listing || typeof listing !== 'object' || !(importForm instanceof HTMLFormElement)) {
                return;
            }

            const setFieldValue = (id, value) => {
                const field = document.getElementById(id);
                if (!field) {
                    return;
                }
                field.value = String(value || '').trim();
                if (field instanceof HTMLInputElement && field.dataset.dealsAutoCommas === 'true') {
                    applyDealsImportDigitGrouping(field);
                }
            };

            setFieldValue('deals-import-address', listing.address);
            setFieldValue('deals-import-location', listing.location);
            setFieldValue('deals-import-mls-id', listing.mlsId);
            setFieldValue('deals-import-price', listing.price);
            setFieldValue('deals-import-beds', listing.beds);
            setFieldValue('deals-import-baths', listing.baths);
            setFieldValue('deals-import-area', listing.area);
            setFieldValue('deals-import-lot-size', listing.lotSize);
            setFieldValue('deals-import-year-built', listing.yearBuilt);
            setFieldValue('deals-import-image', listing.imageUrl);
            setFieldValue('deals-import-notes', listing.notes);

            const statusField = document.getElementById('deals-import-status');
            if (statusField && listing.status) {
                statusField.value = String(listing.status).trim().toLowerCase();
            }
        }

        async function fetchListingPreviewFromSource() {
            if (!importSourceUrlInput) {
                return;
            }

            const sourceUrl = String(importSourceUrlInput.value || '').trim();
            if (!sourceUrl) {
                showDashboardToast('error', 'Link Required', 'Paste a Zillow or Redfin property link first.');
                return;
            }

            const inferredSource = inferDealsImportSourceFromUrl(sourceUrl);
            if (inferredSource) {
                setDealsImportSource(inferredSource);
            }

            if (importSourceFetchButton) {
                importSourceFetchButton.disabled = true;
                importSourceFetchButton.textContent = 'Loading...';
            }

            try {
                const response = await fetch('/api/import-listing-preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: sourceUrl,
                        source: importSource
                    })
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload && payload.error ? payload.error : 'FAST could not pull the listing details from that link.');
                }

                populateDealsImportForm(payload.listing || {});
                showDashboardToast('success', 'Property Autofilled', `${importSource === 'redfin' ? 'Redfin' : 'Zillow'} public listing details were added to the import form.`);
            } catch (error) {
                showDashboardToast('error', 'Import Failed', error && error.message ? error.message : 'FAST could not pull the listing details from that link.');
            } finally {
                if (importSourceFetchButton) {
                    importSourceFetchButton.disabled = false;
                    importSourceFetchButton.textContent = 'Autofill';
                }
            }
        }

        if (importOpenButton) {
            importOpenButton.addEventListener('click', openImportWidget);
        }

        importSourceButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setDealsImportSource(button.getAttribute('data-import-source') || 'zillow');
            });
        });

        if (importSourceUrlInput) {
            importSourceUrlInput.addEventListener('input', () => {
                const inferredSource = inferDealsImportSourceFromUrl(importSourceUrlInput.value);
                if (inferredSource) {
                    setDealsImportSource(inferredSource);
                }
            });
        }

        if (importSourceFetchButton) {
            importSourceFetchButton.addEventListener('click', fetchListingPreviewFromSource);
        }

        if (importCloseButton) {
            importCloseButton.addEventListener('click', closeImportWidget);
        }

        if (importBackdrop) {
            importBackdrop.addEventListener('pointerdown', event => {
                importBackdropPointerDown = event.target === importBackdrop;
            });

            importBackdrop.addEventListener('pointerup', event => {
                if (event.target !== importBackdrop) {
                    importBackdropPointerDown = false;
                }
            });

            importBackdrop.addEventListener('click', event => {
                const activeSelection = window.getSelection ? window.getSelection() : null;
                const hasHighlightedText = activeSelection && String(activeSelection.toString() || '').trim().length > 0;
                const isDirectBackdropClick = event.target === importBackdrop && importBackdropPointerDown;
                importBackdropPointerDown = false;

                if (!isDirectBackdropClick || hasHighlightedText) {
                    return;
                }

                closeImportWidget();
            });
        }

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

        function findDigitGroupedCaretPosition(formattedValue, digitCount) {
            if (digitCount <= 0) {
                return 0;
            }

            let seenDigits = 0;
            for (let index = 0; index < formattedValue.length; index += 1) {
                if (/\d/.test(formattedValue.charAt(index))) {
                    seenDigits += 1;
                    if (seenDigits >= digitCount) {
                        return index + 1;
                    }
                }
            }

            return formattedValue.length;
        }

        function applyDealsImportDigitGrouping(input) {
            if (!(input instanceof HTMLInputElement)) {
                return;
            }

            const rawValue = String(input.value || '');
            const digitsOnly = rawValue.replace(/\D/g, '');
            if (!digitsOnly) {
                input.value = '';
                return;
            }

            const selectionStart = typeof input.selectionStart === 'number'
                ? input.selectionStart
                : rawValue.length;
            const digitsBeforeCaret = rawValue.slice(0, selectionStart).replace(/\D/g, '').length;
            const formattedValue = Number(digitsOnly).toLocaleString();

            input.value = formattedValue;

            if (document.activeElement === input && typeof input.setSelectionRange === 'function') {
                const nextCaret = findDigitGroupedCaretPosition(formattedValue, digitsBeforeCaret);
                input.setSelectionRange(nextCaret, nextCaret);
            }
        }

        function bindDealsImportDigitGrouping(form) {
            if (!(form instanceof HTMLFormElement)) {
                return;
            }

            const groupedInputs = Array.from(form.querySelectorAll('[data-deals-auto-commas="true"]'));
            groupedInputs.forEach(input => {
                input.addEventListener('input', () => {
                    applyDealsImportDigitGrouping(input);
                });
                input.addEventListener('blur', () => {
                    applyDealsImportDigitGrouping(input);
                });
            });
        }

        bindDealsImportDigitGrouping(importForm);
        setDealsImportSource(importSource);

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

        function normalizeGarageCount(value, fallback) {
            const raw = String(value || '').trim();
            if (!raw) {
                return fallback;
            }
            const match = raw.match(/\d+(?:\.\d+)?/);
            return match ? match[0] : fallback;
        }

        function normalizeYearBuilt(value, fallback) {
            const raw = String(value || '').trim();
            if (!raw) {
                return fallback;
            }
            const year = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
            if (!Number.isInteger(year) || year < 1700 || year > 9999) {
                return fallback;
            }
            return String(year);
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
            const garageCount = normalizeGarageCount(formData.get('garage'), '0');
            const lotSize = normalizeMetric(formData.get('lotSize'), 'sqft', 'Lot Size TBD');
            const yearBuilt = normalizeYearBuilt(formData.get('yearBuilt'), '-');
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
                propertyDetails: `Single Family / ${beds.replace('Beds', 'Br').trim()} / ${baths.replace('Baths', 'Ba').trim()} / ${garageCount} Gar / ${yearBuilt} / ${area.replace('sqft', 'ft²').trim()} / ${lotSize.replace('sqft', 'ft²').trim()} / Pool: Unknown`,
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
                garageCount,
                lotSize,
                yearBuilt,
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
                garage: garageCount,
                lotSize,
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

        function deleteClickedProperty(item) {
            if (!item || typeof item !== 'object') {
                return;
            }

            const itemId = String(item.id || '').trim();
            if (!itemId) {
                return;
            }

            const propertyLabel = String(item.address || 'this property').trim() || 'this property';
            if (!window.confirm(`Delete ${propertyLabel} from My Deals?`)) {
                return;
            }

            const items = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key);
            const nextItems = items.filter(entry => String(entry.id || '') !== itemId);
            setUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key, nextItems);
            showDashboardToast('success', 'Property Removed', `${propertyLabel} was removed from your My Deals list.`);
            window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
        }

        function getAssignedItemsForWorkspaceUser() {
            const activeSessionUser = mergeUserIdentityRecords(workspaceUser, getStoredCurrentUserIdentity());
            const assignmentStore = getGlobalObject(PROPERTY_ASSIGNMENTS_KEY);
            const clickedItems = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key);
            const mergedAssignments = new Map();

            Object.entries(assignmentStore).forEach(([storedPropertyKey, item]) => {
                if (!item || typeof item !== 'object') {
                    return;
                }

                if (!usersMatch(item.assignedTo || {}, activeSessionUser)) {
                    return;
                }

                const normalizedPropertyKey = makePropertyStorageKey(item.propertyKey || storedPropertyKey || item.propertyAddress);
                if (!normalizedPropertyKey) {
                    return;
                }

                mergedAssignments.set(normalizedPropertyKey, {
                    ...item,
                    propertyKey: normalizedPropertyKey,
                    propertyAddress: String(item.propertyAddress || item.propertySnapshot?.address || 'Property').trim() || 'Property'
                });
            });

            clickedItems.forEach((item) => {
                if (!item || typeof item !== 'object') {
                    return;
                }

                const snapshot = item.propertySnapshot && typeof item.propertySnapshot === 'object'
                    ? item.propertySnapshot
                    : null;
                const snapshotAssignment = snapshot?.propertyAssignment && typeof snapshot.propertyAssignment === 'object'
                    ? snapshot.propertyAssignment
                    : null;
                if (!snapshotAssignment || !usersMatch(snapshotAssignment.assignedTo || {}, activeSessionUser)) {
                    return;
                }

                const normalizedPropertyKey = makePropertyStorageKey(snapshot?.address || item.address || item.propertyAddress);
                if (!normalizedPropertyKey) {
                    return;
                }

                const existing = mergedAssignments.get(normalizedPropertyKey);
                mergedAssignments.set(normalizedPropertyKey, {
                    propertyKey: normalizedPropertyKey,
                    propertyAddress: String(existing?.propertyAddress || snapshot?.address || item.address || item.propertyAddress || 'Property').trim() || 'Property',
                    assignedTo: existing?.assignedTo || snapshotAssignment.assignedTo || {},
                    assignedBy: existing?.assignedBy || snapshotAssignment.assignedBy || {},
                    assignedAt: existing?.assignedAt || snapshotAssignment.assignedAt || '',
                    propertySnapshot: existing?.propertySnapshot && typeof existing.propertySnapshot === 'object'
                        ? existing.propertySnapshot
                        : snapshot,
                    imageUrl: existing?.imageUrl || item.imageUrl || snapshot?.propertyImages?.[0] || '',
                    location: existing?.location || item.location || snapshot?.location || snapshot?.marketInfo || '',
                    roi: existing?.roi || item.roi || snapshot?.roi || 0
                });
            });

            return Array.from(mergedAssignments.values())
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

        function clampPage(page, totalItems) {
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const numericPage = Number(page);
            if (!Number.isFinite(numericPage)) {
                return 1;
            }

            return Math.min(Math.max(1, Math.floor(numericPage)), totalPages);
        }

        function renderPagination(target, options) {
            const { page, totalItems, onPageChange, label } = options;
            const safePage = clampPage(page, totalItems);
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

            target.innerHTML = '';

            if (totalItems <= pageSize) {
                target.hidden = true;
                return safePage;
            }

            target.hidden = false;

            const startItem = ((safePage - 1) * pageSize) + 1;
            const endItem = Math.min(totalItems, safePage * pageSize);

            const summary = document.createElement('p');
            summary.className = 'deals-compact-page-summary';
            summary.textContent = `Showing ${startItem}-${endItem} of ${totalItems} ${label}`;

            const buttons = document.createElement('div');
            buttons.className = 'deals-compact-page-buttons';

            for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `deals-compact-page-btn${pageNumber === safePage ? ' is-active' : ''}`;
                button.textContent = String(pageNumber);
                button.setAttribute('aria-label', `${label} page ${pageNumber}`);
                if (pageNumber === safePage) {
                    button.setAttribute('aria-current', 'page');
                }
                button.addEventListener('click', () => onPageChange(pageNumber));
                buttons.appendChild(button);
            }

            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.className = 'deals-compact-page-btn';
            nextButton.textContent = 'Next';
            nextButton.disabled = safePage >= totalPages;
            nextButton.setAttribute('aria-label', `Next ${label} page`);
            nextButton.addEventListener('click', () => {
                if (safePage < totalPages) {
                    onPageChange(safePage + 1);
                }
            });
            buttons.appendChild(nextButton);

            target.appendChild(summary);
            target.appendChild(buttons);
            return safePage;
        }

        function renderAssigned() {
            const items = getAssignedItemsForWorkspaceUser();
            paginationState.assigned = clampPage(paginationState.assigned, items.length);
            assignedCount.textContent = String(items.length);
            assignedList.innerHTML = '';

            if (items.length === 0) {
                assignedList.innerHTML = '<p class="deals-compact-empty">No properties have been assigned to you yet.</p>';
                assignedPagination.hidden = true;
                return;
            }

            const startIndex = (paginationState.assigned - 1) * pageSize;
            const visibleItems = items.slice(startIndex, startIndex + pageSize);

            visibleItems.forEach(item => {
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

            paginationState.assigned = renderPagination(assignedPagination, {
                page: paginationState.assigned,
                totalItems: items.length,
                label: 'assigned properties',
                onPageChange(nextPage) {
                    paginationState.assigned = nextPage;
                    renderAssigned();
                }
            });
        }

        function render() {
            const items = getUserScopedItems(DEALS_CLICKED_KEY, workspaceUser.key)
                .slice()
                .sort((a, b) => (Number(b.clickedAt) || 0) - (Number(a.clickedAt) || 0));

            paginationState.clicked = clampPage(paginationState.clicked, items.length);
            count.textContent = String(items.length);
            list.innerHTML = '';

            if (items.length === 0) {
                list.innerHTML = '<p class="deals-compact-empty">No clicked properties yet. Open properties in MLS Hot Deals and they will appear here.</p>';
                listPagination.hidden = true;
                renderAssigned();
                return;
            }

            const startIndex = (paginationState.clicked - 1) * pageSize;
            const visibleItems = items.slice(startIndex, startIndex + pageSize);

            visibleItems.forEach(item => {
                const row = document.createElement('div');
                row.className = 'deals-compact-row';
                row.tabIndex = 0;
                row.setAttribute('role', 'button');
                row.setAttribute('aria-label', `Open ${String(item.address || 'property').trim() || 'property'}`);

                const statusLabel = String(item.status || 'active').replace('-', ' ');
                const roiText = Number(item.roi || 0).toFixed(1);

                row.innerHTML = `
                    <button type="button" class="deals-compact-delete-btn" aria-label="Delete ${String(item.address || 'property').trim() || 'property'} from My Deals">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4.75A1.75 1.75 0 0 1 9.75 3h4.5A1.75 1.75 0 0 1 16 4.75V6"></path>
                            <path d="M18 6l-.8 11.2A2 2 0 0 1 15.2 19H8.8a2 2 0 0 1-1.99-1.8L6 6"></path>
                            <path d="M10 10.25v5.5"></path>
                            <path d="M14 10.25v5.5"></path>
                        </svg>
                    </button>
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

                const openClickedProperty = () => {
                    if (item.propertySnapshot && typeof item.propertySnapshot === 'object') {
                        localStorage.setItem('selectedPropertyDetail', JSON.stringify(item.propertySnapshot));
                    }
                    window.location.href = 'property-details.html';
                };

                row.addEventListener('click', () => {
                    openClickedProperty();
                });

                row.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                        return;
                    }
                    event.preventDefault();
                    openClickedProperty();
                });

                const deleteButton = row.querySelector('.deals-compact-delete-btn');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        deleteClickedProperty(item);
                    });
                }

                list.appendChild(row);
            });

            paginationState.clicked = renderPagination(listPagination, {
                page: paginationState.clicked,
                totalItems: items.length,
                label: 'clicked properties',
                onPageChange(nextPage) {
                    paginationState.clicked = nextPage;
                    render();
                }
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
                setDealsImportSource('zillow');
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
        const calculatorToggle = document.getElementById('property-calculator-toggle');
        const calculatorWidget = document.getElementById('property-calculator-widget');
        const calculatorDisplay = document.getElementById('property-calculator-display');

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
            garageCount: '3',
            lotSize: '170,320 ft²',
            yearBuilt: '1978',
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

        function getCurrentAgentRecordState() {
            return {
                ...defaultDetailData.agentRecord,
                ...(detailData.agentRecord && typeof detailData.agentRecord === 'object' ? detailData.agentRecord : {})
            };
        }

        const agentRecord = getCurrentAgentRecordState();

        const workspaceUser = getWorkspaceUserContext();
        const activeUser = getStoredCurrentUserIdentity();
        let propertyAddress = String(detailData.address || '').trim();
        let propertyKey = makePropertyStorageKey(propertyAddress);
        let linkedDealPropertyKey = propertyKey;
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
            window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
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

        const currentStatusValue = String(getPersistedPiqStatus() || detailData.piqAgentStatus || 'none');
        detailData.piqAgentStatus = currentStatusValue;
        detailData.agentRecord = {
            ...(detailData.agentRecord || {}),
            agentStatus: formatAgentStatusLabel(currentStatusValue)
        };

        function applyAgentWorkspaceRecord(agentRecordState) {
            const safeAgentRecord = {
                ...defaultDetailData.agentRecord,
                ...(agentRecordState && typeof agentRecordState === 'object' ? agentRecordState : {})
            };
            const agentFieldMap = {
                'agent-name': safeAgentRecord.name,
                'agent-record-title': safeAgentRecord.title,
                'agent-phone': safeAgentRecord.phone,
                'agent-email': safeAgentRecord.email,
                'agent-brokerage': safeAgentRecord.brokerage,
                'agent-last-communication-date': safeAgentRecord.lastCommunicationDate,
                'agent-last-address-discussed': safeAgentRecord.lastAddressDiscussed,
                'agent-last-communicated-aa': safeAgentRecord.lastCommunicatedAA,
                'agent-active-last-2-years': safeAgentRecord.activeInLast2Years,
                'agent-average-deals-per-year': safeAgentRecord.averageDealsPerYear,
                'agent-double-ended': safeAgentRecord.doubleEnded,
                'agent-investor-source': safeAgentRecord.investorSource
            };

            Object.keys(agentFieldMap).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = agentFieldMap[id];
                }
            });
        }

        function renderPropertyListingLink() {
            const sourceLinksEl = document.getElementById('property-listing-source-links');
            const sourceLinkEl = document.getElementById('property-listing-source-link');
            if (!sourceLinksEl && !sourceLinkEl) {
                return;
            }

            const savedLinks = detailData.sourceListingLinks && typeof detailData.sourceListingLinks === 'object'
                ? detailData.sourceListingLinks
                : {};
            const zillowUrl = String(savedLinks.zillow || '').trim();
            const redfinUrl = String(savedLinks.redfin || '').trim();
            const sourceUrl = String(detailData.sourceListingUrl || '').trim();
            const sourceLabel = String(detailData.sourceListingLabel || '').trim();

            if (sourceLinksEl) {
                sourceLinksEl.innerHTML = '';
                const nextLinks = [
                    zillowUrl ? { label: 'Zillow', url: zillowUrl } : null,
                    redfinUrl ? { label: 'Redfin', url: redfinUrl } : null,
                    (!zillowUrl && !redfinUrl && sourceUrl)
                        ? { label: sourceLabel || 'Listing', url: sourceUrl }
                        : null
                ].filter(Boolean);

                if (!nextLinks.length) {
                    const emptyState = document.createElement('span');
                    emptyState.className = 'property-link-import-empty';
                    emptyState.textContent = 'No links added.';
                    sourceLinksEl.appendChild(emptyState);
                    if (sourceLinkEl) {
                        sourceLinkEl.textContent = 'No link added.';
                        sourceLinkEl.removeAttribute('href');
                        sourceLinkEl.setAttribute('aria-disabled', 'true');
                    }
                    return;
                }

                nextLinks.forEach((linkItem, index) => {
                    const link = document.createElement('a');
                    link.className = 'property-link-import-link';
                    link.href = linkItem.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.textContent = linkItem.label;
                    sourceLinksEl.appendChild(link);

                    if (index < nextLinks.length - 1) {
                        const separator = document.createElement('span');
                        separator.className = 'property-link-import-empty';
                        separator.textContent = '•';
                        sourceLinksEl.appendChild(separator);
                    }
                });
            }

            if (!sourceLinkEl) {
                return;
            }

            if (!sourceUrl) {
                sourceLinkEl.textContent = 'No link added.';
                sourceLinkEl.removeAttribute('href');
                sourceLinkEl.setAttribute('aria-disabled', 'true');
                return;
            }

            sourceLinkEl.href = sourceUrl;
            sourceLinkEl.textContent = sourceLabel || sourceUrl;
            sourceLinkEl.removeAttribute('aria-disabled');
        }

        function renderPropertyDetailSnapshot() {
            const compactPropertyDetails = String(detailData.propertyDetails || '').replace(/\s*\/\s*/g, '\n');
            const currentStatusLabel = formatAgentStatusLabel(detailData.piqAgentStatus || 'none');
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
                'property-garage': detailData.garageCount,
                'property-lot-size': detailData.lotSize,
                'property-year-built': detailData.yearBuilt,
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
                'agent-current-status': currentStatusLabel,
                'tab-content-offer': detailData.offer
            };

            Object.keys(idMap).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = idMap[id];
                }
            });

            applyAgentWorkspaceRecord(getCurrentAgentRecordState());
            renderPropertyListingLink();
        }

        renderPropertyDetailSnapshot();

        const tabButtons = Array.from(document.querySelectorAll('.property-tab-btn[data-tab]'));
        const tabPanels = Array.from(document.querySelectorAll('.property-tab-panel[data-panel]'));
        const propertyAccessRole = String(getWorkspaceUserContext().role || getStoredCurrentUserIdentity().role || '').trim().toLowerCase();
        const lockedTabs = isRegularUserRole(propertyAccessRole)
            ? new Set(['comps', 'ia', 'offer'])
            : new Set();
        const lockedTabLabels = {
            comps: 'Comps',
            ia: 'IA',
            offer: 'Offer'
        };

        tabButtons.forEach((button) => {
            const tabId = String(button.dataset.tab || '').trim().toLowerCase();
            if (!lockedTabs.has(tabId)) {
                return;
            }

            button.classList.add('property-tab-btn-locked');
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('title', 'upgrade to premium');
            if (typeof window.attachPremiumUpgradeTooltip === 'function') {
                window.attachPremiumUpgradeTooltip(button);
            }

            if (!button.querySelector('.property-tab-lock-badge')) {
                const badge = document.createElement('span');
                badge.className = 'property-tab-lock-badge';
                badge.innerHTML = '<svg class="property-tab-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 11V8a4 4 0 1 1 8 0v3"/><rect x="6" y="11" width="12" height="9" rx="2"/></svg>';
                button.appendChild(badge);
            }
        });

        function activatePropertyTab(tabId) {
            const normalizedTabId = String(tabId || 'piq').trim().toLowerCase() || 'piq';
            const nextTabId = lockedTabs.has(normalizedTabId) ? 'piq' : normalizedTabId;

            tabButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.tab === nextTabId);
            });

            tabPanels.forEach(panel => {
                panel.classList.toggle('active', panel.dataset.panel === nextTabId);
            });
        }

        if (calculatorToggle && calculatorWidget && calculatorDisplay) {
            let calculatorExpression = '';
            const calculatorPrimaryKey = calculatorWidget.querySelector('[data-calculator-action="clear"]');

            function formatCalculatorScientificNotation(value) {
                const exponentialValue = value.toExponential(6).replace('e', 'E');
                const parts = exponentialValue.split('E');
                const mantissa = (parts[0] || '0').replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
                const exponent = String(Number(parts[1] || '0'));
                return `${mantissa}E${exponent}`;
            }

            function formatCalculatorNumber(rawNumber) {
                const stringValue = String(rawNumber || '0');
                const hasTrailingDecimal = stringValue.endsWith('.');
                const normalizedValue = stringValue.replace(/,/g, '');
                const numericValue = Number(normalizedValue);
                const parts = stringValue.split('.');
                const integerPart = parts[0] || '0';
                const decimalPart = parts[1] || '';
                const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

                if (
                    !hasTrailingDecimal &&
                    Number.isFinite(numericValue) &&
                    numericValue !== 0 &&
                    (Math.abs(numericValue) >= 1e10 || Math.abs(numericValue) < 1e-6)
                ) {
                    return formatCalculatorScientificNotation(numericValue);
                }

                if (hasTrailingDecimal) {
                    return `${formattedInteger}.`;
                }

                if (decimalPart) {
                    return `${formattedInteger}.${decimalPart}`;
                }

                return formattedInteger;
            }

            function formatCalculatorDisplayValue(rawValue) {
                const stringValue = String(rawValue || '0');
                if (stringValue === 'Error') {
                    return stringValue;
                }

                return stringValue
                    .replace(/\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?\.?/g, match => formatCalculatorNumber(match))
                    .replace(/\*/g, '×')
                    .replace(/\//g, '÷');
            }

            function renderCalculatorDisplay(value) {
                calculatorDisplay.textContent = formatCalculatorDisplayValue(value);
            }

            function setCalculatorOpenState(isOpen) {
                calculatorWidget.hidden = !isOpen;
                calculatorToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                calculatorToggle.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
                if (isOpen && calculatorPrimaryKey) {
                    requestAnimationFrame(() => calculatorPrimaryKey.focus());
                }
            }

            function normalizeCalculatorExpression(rawValue) {
                return String(rawValue || '')
                    .replace(/÷/g, '/')
                    .replace(/×/g, '*')
                    .replace(/\s+/g, '');
            }

            function evaluateCalculatorExpression(rawValue) {
                const normalized = normalizeCalculatorExpression(rawValue);
                if (!normalized) {
                    return '0';
                }
                if (!/^[0-9+\-*/().%]+$/.test(normalized)) {
                    throw new Error('Invalid expression');
                }

                const percentNormalized = normalized.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
                const result = Function(`"use strict"; return (${percentNormalized});`)();
                if (!Number.isFinite(result)) {
                    throw new Error('Invalid expression');
                }

                return Number(result.toFixed(6)).toString();
            }

            function appendCalculatorValue(nextValue) {
                const safeValue = String(nextValue || '');
                if (!safeValue) {
                    return;
                }

                if (safeValue === '.') {
                    const currentSegment = calculatorExpression.split(/[+\-*/]/).pop() || '';
                    if (currentSegment.includes('.')) {
                        return;
                    }
                    calculatorExpression += currentSegment ? '.' : '0.';
                    renderCalculatorDisplay(calculatorExpression);
                    return;
                }

                if (/^[+\-*/%]$/.test(safeValue)) {
                    if (!calculatorExpression && safeValue !== '-') {
                        return;
                    }
                    if (/^[+\-*/.]$/.test(calculatorExpression.slice(-1))) {
                        calculatorExpression = `${calculatorExpression.slice(0, -1)}${safeValue}`;
                    } else {
                        calculatorExpression += safeValue;
                    }
                    renderCalculatorDisplay(calculatorExpression);
                    return;
                }

                calculatorExpression += safeValue;
                renderCalculatorDisplay(calculatorExpression);
            }

            function toggleCalculatorSign() {
                if (!calculatorExpression) {
                    calculatorExpression = '-';
                    renderCalculatorDisplay(calculatorExpression);
                    return;
                }

                if (/^[+*/%]$/.test(calculatorExpression.slice(-1))) {
                    calculatorExpression += '-';
                    renderCalculatorDisplay(calculatorExpression);
                    return;
                }

                let startIndex = calculatorExpression.length;
                while (startIndex > 0) {
                    const previousCharacter = calculatorExpression.charAt(startIndex - 1);
                    if (/[0-9.]/.test(previousCharacter)) {
                        startIndex -= 1;
                        continue;
                    }
                    if (previousCharacter === '-' && (startIndex - 1 === 0 || /[+\-*/%]/.test(calculatorExpression.charAt(startIndex - 2)))) {
                        startIndex -= 1;
                    }
                    break;
                }

                const currentSegment = calculatorExpression.slice(startIndex);
                if (!currentSegment || currentSegment === '-') {
                    return;
                }

                if (currentSegment.startsWith('-')) {
                    calculatorExpression = `${calculatorExpression.slice(0, startIndex)}${currentSegment.slice(1)}`;
                } else {
                    calculatorExpression = `${calculatorExpression.slice(0, startIndex)}-${currentSegment}`;
                }

                renderCalculatorDisplay(calculatorExpression || '0');
            }

            calculatorToggle.addEventListener('click', () => {
                setCalculatorOpenState(calculatorWidget.hidden);
            });

            calculatorWidget.querySelectorAll('[data-calculator-value]').forEach(button => {
                button.addEventListener('click', () => {
                    appendCalculatorValue(button.dataset.calculatorValue || '');
                });
            });

            calculatorWidget.querySelectorAll('[data-calculator-action]').forEach(button => {
                button.addEventListener('click', () => {
                    const action = String(button.dataset.calculatorAction || '').trim().toLowerCase();
                    if (action === 'clear') {
                        calculatorExpression = '';
                        renderCalculatorDisplay('0');
                        return;
                    }
                    if (action === 'toggle-sign') {
                        toggleCalculatorSign();
                        return;
                    }
                    if (action === 'backspace') {
                        calculatorExpression = calculatorExpression.slice(0, -1);
                        renderCalculatorDisplay(calculatorExpression || '0');
                        return;
                    }
                    if (action === 'equals') {
                        try {
                            calculatorExpression = evaluateCalculatorExpression(calculatorExpression);
                            renderCalculatorDisplay(calculatorExpression);
                        } catch (error) {
                            calculatorExpression = '';
                            renderCalculatorDisplay('Error');
                        }
                    }
                });
            });

            setCalculatorOpenState(false);
            renderCalculatorDisplay('0');
        }

        tabButtons.forEach(button => {
            if (button.dataset.propertyTabBound === 'true') {
                return;
            }

            button.dataset.propertyTabBound = 'true';
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                const normalizedTabId = String(tabId || '').trim().toLowerCase();
                if (lockedTabs.has(normalizedTabId)) {
                    const tabLabel = lockedTabLabels[normalizedTabId] || 'This tab';
                    showDashboardToast('error', 'Access Locked', `${tabLabel} is locked for User accounts. Upgrade to Premium to unlock it.`);
                    activatePropertyTab('piq');
                    return;
                }
                activatePropertyTab(tabId);
            });
        });

        const initialActiveTab = tabButtons.find(button => button.classList.contains('active'))?.dataset.tab
            || tabPanels.find(panel => panel.classList.contains('active'))?.dataset.panel
            || 'piq';
        activatePropertyTab(initialActiveTab);

        const previewGallery = document.getElementById('piq-property-image-preview');
        const imageGallery = document.getElementById('piq-property-image-gallery');
        const imageEditButton = document.getElementById('piq-property-image-edit-btn');
        const propertyListingImportButton = document.getElementById('property-listing-import-btn');
        const imageTabButtons = Array.from(document.querySelectorAll('.piq-image-tab[data-piq-image-tab]'));
        const imagePanels = Array.from(document.querySelectorAll('.piq-image-panel[data-piq-image-panel]'));
        let imageEditMode = false;

        function formatImportedStatusLabel(status) {
            const normalizedStatus = String(status || '').trim().toLowerCase();
            if (!normalizedStatus) {
                return detailData.statusLabel || 'Active';
            }
            return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).replace('-', ' ');
        }

        function inferListingSourceFromPropertyUrl(value) {
            const raw = String(value || '').trim().toLowerCase();
            if (raw.includes('redfin.com')) {
                return 'redfin';
            }
            if (raw.includes('zillow.com')) {
                return 'zillow';
            }
            return '';
        }

        function persistListingSourceLink(sourceUrl, source, sourceLinks = null) {
            const normalizedSource = String(source || inferListingSourceFromPropertyUrl(sourceUrl) || '').trim().toLowerCase();
            const normalizedUrl = String(sourceUrl || '').trim();
            const normalizedSourceLinks = sourceLinks && typeof sourceLinks === 'object'
                ? {
                    ...(detailData.sourceListingLinks && typeof detailData.sourceListingLinks === 'object' ? detailData.sourceListingLinks : {}),
                    ...(String(sourceLinks.zillow || '').trim() ? { zillow: String(sourceLinks.zillow || '').trim() } : {}),
                    ...(String(sourceLinks.redfin || '').trim() ? { redfin: String(sourceLinks.redfin || '').trim() } : {})
                }
                : {
                    ...(detailData.sourceListingLinks && typeof detailData.sourceListingLinks === 'object' ? detailData.sourceListingLinks : {}),
                    ...(normalizedSource && normalizedUrl ? { [normalizedSource]: normalizedUrl } : {})
                };

            if (normalizedUrl) {
                detailData.sourceListingUrl = normalizedUrl;
                detailData.sourceListingLabel = `${normalizedSource === 'redfin' ? 'Redfin' : 'Zillow'} listing`;
            }
            detailData.sourceListingLinks = normalizedSourceLinks;
            persistCurrentPropertyDetail();
            renderPropertyDetailSnapshot();
        }

        function normalizeImportedMoney(value, fallback) {
            const raw = String(value || '').trim();
            if (!raw) {
                return fallback;
            }
            if (/^\$/.test(raw)) {
                return raw;
            }
            const amount = Number(raw.replace(/[^0-9.]/g, ''));
            if (!Number.isFinite(amount)) {
                return fallback;
            }
            return `$${Math.round(amount).toLocaleString()}`;
        }

        function normalizeImportedMetric(value, suffix, fallback) {
            const raw = String(value || '').trim();
            if (!raw) {
                return fallback;
            }
            return /[a-zA-Z]/.test(raw) ? raw : `${raw} ${suffix}`;
        }

        function normalizeImportedYear(value, fallback) {
            const raw = String(value || '').trim();
            const year = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
            if (!Number.isInteger(year) || year < 1700 || year > 9999) {
                return fallback;
            }
            return String(year);
        }

        function buildPropertyDetailsLineFromListing(listing) {
            const propertyType = String(detailData.propertyType || '').trim();
            const summaryType = propertyType && propertyType !== '-' && propertyType !== 'Residential'
                ? propertyType
                : 'Single Family';
            const beds = normalizeImportedMetric(listing.beds, 'Beds', '0 Beds').replace('Beds', 'Br').trim();
            const baths = normalizeImportedMetric(listing.baths, 'Baths', '0 Baths').replace('Baths', 'Ba').trim();
            const area = normalizeImportedMetric(listing.area, 'sqft', '0 sqft').replace('sqft', 'ft²').trim();
            const lotSize = normalizeImportedMetric(listing.lotSize, 'sqft', detailData.lotSize || 'Lot Size TBD').replace('sqft', 'ft²').trim();
            const garageCount = String(detailData.garageCount || '0').trim() || '0';
            const yearBuilt = normalizeImportedYear(listing.yearBuilt, detailData.yearBuilt || '-');
            return `${summaryType} / ${beds} / ${baths} / ${garageCount} Gar / ${yearBuilt} / ${area} / ${lotSize} / Pool: Unknown`;
        }

        function applyImportedListingToPropertyDetail(listing, sourceUrl, source, sourceLinks = null) {
            const nextAddress = String(listing.address || '').trim();
            const nextLocation = String(listing.location || '').trim();
            const nextPrice = normalizeImportedMoney(listing.price, detailData.listPrice || '$0');
            const nextStatusLabel = formatImportedStatusLabel(listing.status);
            const nextNotes = String(listing.notes || '').trim();
            const nextMlsId = String(listing.mlsId || '').trim();
            const nextImageUrl = String(listing.imageUrl || '').trim();
            const normalizedSourceLinks = sourceLinks && typeof sourceLinks === 'object'
                ? {
                    ...(detailData.sourceListingLinks && typeof detailData.sourceListingLinks === 'object' ? detailData.sourceListingLinks : {}),
                    ...(String(sourceLinks.zillow || '').trim() ? { zillow: String(sourceLinks.zillow || '').trim() } : {}),
                    ...(String(sourceLinks.redfin || '').trim() ? { redfin: String(sourceLinks.redfin || '').trim() } : {})
                }
                : (detailData.sourceListingLinks && typeof detailData.sourceListingLinks === 'object' ? detailData.sourceListingLinks : {});

            if (nextAddress) {
                detailData.address = nextAddress;
                propertyAddress = nextAddress;
                propertyKey = makePropertyStorageKey(nextAddress);
            }

            if (nextLocation) {
                detailData.areaLabel = nextLocation;
            }

            detailData.listPrice = nextPrice;
            detailData.statusLabel = nextStatusLabel;
            detailData.marketInfo = `${detailData.dom} Days / ${nextStatusLabel}`;
            detailData.propertyDetails = buildPropertyDetailsLineFromListing(listing);
            detailData.idx = `${source === 'redfin' ? 'Redfin' : 'Zillow'} Import`;
            detailData.propertyCover = detailData.address || detailData.propertyCover;

            if (nextMlsId) {
                detailData.mlsNumber = nextMlsId;
                detailData.taxDelinquency = `MLS ID ${nextMlsId}`;
            }

            if (listing.beds) {
                detailData.compData = `Imported listing • ${String(listing.beds).trim()} • ${String(listing.baths || '').trim() || 'Baths TBD'} • ${String(listing.area || '').trim() || 'Area TBD'}`;
            }

            if (listing.lotSize) {
                detailData.lotSize = normalizeImportedMetric(listing.lotSize, 'sqft', detailData.lotSize || 'Lot Size TBD');
            }

            if (listing.yearBuilt) {
                detailData.yearBuilt = normalizeImportedYear(listing.yearBuilt, detailData.yearBuilt || '-');
            }

            if (nextNotes) {
                detailData.publicComments = nextNotes;
                detailData.agentComments = `${source === 'redfin' ? 'Redfin' : 'Zillow'} public listing import. Verify disclosures, showing instructions, and seller notes.`;
                detailData.piq = nextNotes;
            }

            if (nextImageUrl) {
                const nextImages = [nextImageUrl, ...getPropertyImages().filter((url) => url !== nextImageUrl)];
                detailData.propertyImages = nextImages;
                detailData.imageUrl = nextImageUrl;
            }

            detailData.sourceListingUrl = sourceUrl;
            detailData.sourceListingLabel = `${source === 'redfin' ? 'Redfin' : 'Zillow'} listing`;
            detailData.sourceListingLinks = normalizedSourceLinks;
            persistCurrentPropertyDetail();
            renderPropertyDetailSnapshot();
            renderPropertyImages();
        }

        async function promptAndImportPropertyListing(existingUrl = '') {
            const rawLink = window.prompt('Paste the Zillow or Redfin property link.', String(existingUrl || detailData.sourceListingUrl || '').trim());
            if (rawLink === null) {
                return false;
            }

            const trimmedLink = String(rawLink || '').trim();
            if (!trimmedLink) {
                showDashboardToast('error', 'Link Required', 'Paste a Zillow or Redfin property link to import public details.');
                return false;
            }

            let normalizedUrl = '';
            try {
                normalizedUrl = new URL(trimmedLink, window.location.href).href;
            } catch (error) {
                showDashboardToast('error', 'Invalid Link', 'Enter a valid Zillow or Redfin property URL.');
                return false;
            }

            const source = inferListingSourceFromPropertyUrl(normalizedUrl);
            if (!source) {
                showDashboardToast('error', 'Unsupported Link', 'Only Zillow and Redfin property links are supported here.');
                return false;
            }

            if (propertyListingImportButton) {
                propertyListingImportButton.disabled = true;
                propertyListingImportButton.textContent = 'Importing...';
            }

            try {
                const response = await fetch('/api/import-listing-preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: normalizedUrl,
                        source
                    })
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload && payload.error ? payload.error : 'FAST could not pull the listing details from that link.');
                }

                applyImportedListingToPropertyDetail(payload.listing || {}, normalizedUrl, source, { [source]: normalizedUrl });
                showDashboardToast('success', 'Property Updated', `${source === 'redfin' ? 'Redfin' : 'Zillow'} public listing details were added to this property.`);
                return true;
            } catch (error) {
                const message = error && error.message ? error.message : 'FAST could not pull the listing details from that link.';
                if (/blocking automated access|could not be loaded/i.test(message)) {
                    persistListingSourceLink(normalizedUrl, source, { [source]: normalizedUrl });
                    showDashboardToast('success', 'Link Saved', `${source === 'redfin' ? 'Redfin' : 'Zillow'} blocked automated import right now, but the listing link was saved to this property.`);
                    return false;
                }
                showDashboardToast('error', 'Import Failed', message);
                return false;
            } finally {
                if (propertyListingImportButton) {
                    propertyListingImportButton.disabled = false;
                    propertyListingImportButton.textContent = 'Autofill';
                }
            }
        }

        async function importPropertyListingFromAddress() {
            const existingAddress = String(detailData.address || '').trim();
            const rawAddress = existingAddress || window.prompt('Enter the property address to search Zillow and Redfin.', existingAddress);
            if (rawAddress === null) {
                return;
            }

            const trimmedAddress = String(rawAddress || '').trim();
            if (!trimmedAddress) {
                showDashboardToast('error', 'Address Required', 'Add the property address before searching Zillow and Redfin.');
                return;
            }

            if (propertyListingImportButton) {
                propertyListingImportButton.disabled = true;
                propertyListingImportButton.textContent = 'Finding...';
            }

            try {
                const response = await fetch('/api/import-listing-by-address', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        address: trimmedAddress
                    })
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload && payload.error ? payload.error : 'FAST could not find matching Zillow and Redfin listings for this address.');
                }

                const primaryUrl = String(payload.primaryUrl || payload.listing?.url || '').trim();
                const primarySource = String(payload.primarySource || inferListingSourceFromPropertyUrl(primaryUrl) || payload.listing?.source || 'zillow').trim().toLowerCase() || 'zillow';
                const savedLinks = payload.links && typeof payload.links === 'object' ? payload.links : {};
                applyImportedListingToPropertyDetail(payload.listing || {}, primaryUrl, primarySource, savedLinks);

                const missingSources = Array.isArray(payload.missingSources) ? payload.missingSources : [];
                const missingLabel = missingSources.length
                    ? ` ${missingSources.map((item) => item === 'redfin' ? 'Redfin' : 'Zillow').join(' and ')} link${missingSources.length === 1 ? ' was' : 's were'} not found.`
                    : '';
                showDashboardToast('success', 'Property Updated', `Public Zillow and Redfin listing details were imported into this property.${missingLabel}`);
            } catch (error) {
                const message = error && error.message ? error.message : 'FAST could not search Zillow and Redfin for this property address.';
                if (/paste a direct listing link|blocked automated address lookup/i.test(message)) {
                    showDashboardToast('error', 'Lookup Blocked', message);
                    await promptAndImportPropertyListing();
                } else {
                    showDashboardToast('error', 'Import Failed', message);
                }
            } finally {
                if (propertyListingImportButton) {
                    propertyListingImportButton.disabled = false;
                    propertyListingImportButton.textContent = 'Autofill';
                }
            }
        }

        function getPropertyImages() {
            return Array.from(new Set(
                (Array.isArray(detailData.propertyImages) ? detailData.propertyImages : [])
                    .map(url => String(url || '').trim())
                    .filter(url => url.length > 0)
            ));
        }

        function promptForPropertyImageUrl() {
            const existingImages = getPropertyImages();
            const nextImageUrl = window.prompt('Paste the property image URL.', existingImages[0] || '');
            if (nextImageUrl === null) {
                return;
            }

            const trimmedImageUrl = String(nextImageUrl || '').trim();
            if (!trimmedImageUrl) {
                showDashboardToast('error', 'Image Link Required', 'Paste a full image URL to update the property image.');
                return;
            }

            try {
                const normalizedUrl = new URL(trimmedImageUrl, window.location.href).href;
                const remainingImages = existingImages.filter(url => url !== normalizedUrl);
                detailData.propertyImages = [normalizedUrl, ...remainingImages];
                detailData.imageUrl = normalizedUrl;
                persistCurrentPropertyDetail();
                renderPropertyImages();
                showDashboardToast('success', 'Image Updated', 'The property image link was updated for this property.');
            } catch (error) {
                showDashboardToast('error', 'Invalid Image Link', 'Paste a valid image URL before saving.');
            }
        }

        function renderPropertyImages() {
            const images = getPropertyImages();

            function createImageCard(url, index, variant) {
                const card = document.createElement('div');
                card.className = 'piq-image-thumb-card';

                const image = document.createElement('img');
                image.className = variant === 'large' ? 'piq-image-thumb-large' : 'piq-image-thumb-strip';
                image.loading = 'lazy';
                image.src = url;
                image.alt = variant === 'large'
                    ? `Property preview image ${index + 1}`
                    : `Property image ${index + 1}`;
                card.appendChild(image);

                if (imageEditMode) {
                    const actions = document.createElement('div');
                    actions.className = 'piq-image-card-actions';

                    if (index === 0) {
                        const addButton = document.createElement('button');
                        addButton.type = 'button';
                        addButton.className = 'piq-image-inline-add-btn';
                        addButton.setAttribute('aria-label', 'Add property image link');
                        addButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>';
                        addButton.addEventListener('click', () => {
                            promptForPropertyImageUrl();
                        });
                        actions.appendChild(addButton);
                    }

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.className = 'piq-image-delete-btn';
                    deleteButton.setAttribute('aria-label', `Delete property image ${index + 1}`);
                    deleteButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>';
                    deleteButton.addEventListener('click', () => {
                        const confirmed = window.confirm('Delete this property image?');
                        if (!confirmed) {
                            return;
                        }

                        const remainingImages = getPropertyImages().filter((imageUrl) => imageUrl !== url);
                        detailData.propertyImages = remainingImages;
                        detailData.imageUrl = remainingImages[0] || '';
                        persistCurrentPropertyDetail();
                        renderPropertyImages();
                        showDashboardToast('success', 'Image Deleted', 'The property image was removed.');
                    });
                    actions.appendChild(deleteButton);
                    card.appendChild(actions);
                }

                return card;
            }

            if (previewGallery) {
                previewGallery.innerHTML = '';
                if (images.length === 0) {
                    if (imageEditMode) {
                        const emptyButton = document.createElement('button');
                        emptyButton.type = 'button';
                        emptyButton.className = 'card-btn active';
                        emptyButton.textContent = 'Add property image';
                        emptyButton.addEventListener('click', () => {
                            promptForPropertyImageUrl();
                        });
                        previewGallery.appendChild(emptyButton);
                    } else {
                        previewGallery.innerHTML = '<p class="outreach-empty">No property images available.</p>';
                    }
                } else {
                    images.slice(0, 4).forEach((url, index) => {
                        previewGallery.appendChild(createImageCard(url, index, 'large'));
                    });
                }
            }

            if (imageGallery) {
                imageGallery.innerHTML = '';
                if (images.length === 0) {
                    imageGallery.innerHTML = '<p class="outreach-empty">No property images available.</p>';
                } else {
                    images.forEach((url, index) => {
                        imageGallery.appendChild(createImageCard(url, index, 'strip'));
                    });
                }
            }

            if (imageEditButton) {
                imageEditButton.classList.toggle('is-active', imageEditMode);
                imageEditButton.setAttribute('aria-pressed', imageEditMode ? 'true' : 'false');
                imageEditButton.setAttribute('title', imageEditMode ? 'Done editing property images' : 'Edit property images');
            }
        }

        function persistCurrentPropertyDetail() {
            persistSelectedPropertyDetail(detailData);
            syncPropertyDetailIntoLocalDealCache([linkedDealPropertyKey, propertyKey], detailData, workspaceUser);
            linkedDealPropertyKey = propertyKey;
            syncCurrentAssignmentSnapshot();
        }

        renderPropertyImages();
        renderPropertyListingLink();

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

        if (imageEditButton) {
            imageEditButton.addEventListener('click', () => {
                imageEditMode = !imageEditMode;
                renderPropertyImages();
            });
        }

        if (propertyListingImportButton) {
            propertyListingImportButton.addEventListener('click', () => {
                importPropertyListingFromAddress();
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

        function initAgentWorkspaceEditor() {
            const editButton = document.getElementById('agent-workspace-edit-btn');
            const editPanel = document.getElementById('agent-workspace-edit-panel');
            const saveButton = document.getElementById('agent-workspace-save-btn');
            const cancelButton = document.getElementById('agent-workspace-cancel-btn');
            const fieldMap = {
                name: document.getElementById('agent-workspace-name-input'),
                title: document.getElementById('agent-workspace-title-input'),
                phone: document.getElementById('agent-workspace-phone-input'),
                email: document.getElementById('agent-workspace-email-input'),
                brokerage: document.getElementById('agent-workspace-brokerage-input'),
                lastCommunicationDate: document.getElementById('agent-workspace-last-communication-input'),
                lastAddressDiscussed: document.getElementById('agent-workspace-last-address-input'),
                lastCommunicatedAA: document.getElementById('agent-workspace-last-aa-input'),
                activeInLast2Years: document.getElementById('agent-workspace-active-input'),
                averageDealsPerYear: document.getElementById('agent-workspace-average-deals-input'),
                doubleEnded: document.getElementById('agent-workspace-double-ended-input'),
                investorSource: document.getElementById('agent-workspace-investor-source-input')
            };

            if (!editButton || !editPanel || !saveButton || !cancelButton || Object.values(fieldMap).some(field => !field)) {
                return;
            }

            function populateForm() {
                const currentRecord = getCurrentAgentRecordState();
                Object.entries(fieldMap).forEach(([key, field]) => {
                    field.value = String(currentRecord[key] || '').trim();
                });
            }

            function setEditMode(isEditing) {
                editPanel.hidden = !isEditing;
                editButton.textContent = isEditing ? 'Editing Agent Workspace' : 'Edit Agent Workspace';
                editButton.disabled = Boolean(isEditing);
            }

            editButton.addEventListener('click', () => {
                populateForm();
                setEditMode(true);
            });

            cancelButton.addEventListener('click', () => {
                populateForm();
                setEditMode(false);
            });

            saveButton.addEventListener('click', () => {
                const nextAgentRecord = {
                    ...getCurrentAgentRecordState()
                };

                Object.entries(fieldMap).forEach(([key, field]) => {
                    const nextValue = String(field.value || '').trim();
                    nextAgentRecord[key] = nextValue || defaultDetailData.agentRecord[key] || '-';
                });

                detailData.agentRecord = {
                    ...detailData.agentRecord,
                    ...nextAgentRecord,
                    agentStatus: formatAgentStatusLabel(detailData.piqAgentStatus || 'none')
                };
                Object.assign(agentRecord, detailData.agentRecord);
                applyAgentWorkspaceRecord(detailData.agentRecord);
                localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
                syncCurrentAssignmentSnapshot();
                setEditMode(false);
                showDashboardToast('success', 'Agent Workspace Saved', 'Agent workspace details were updated for this property.');
            });
        }

        function initAgentWorkspaceControls() {
            const workspaceCard = document.getElementById('agent-workspace-card');
            const workspaceBody = document.getElementById('agent-workspace-body');
            const minimizeButton = document.getElementById('agent-workspace-minimize-btn');

            if (!workspaceCard || !workspaceBody || !minimizeButton) {
                return;
            }

            const minimizeLabel = minimizeButton.querySelector('.agent-record-control-label');
            let isMinimized = workspaceCard.classList.contains('is-minimized');

            function syncMinimizedState(nextMinimized) {
                isMinimized = Boolean(nextMinimized);
                workspaceCard.classList.toggle('is-minimized', isMinimized);
                minimizeButton.setAttribute('aria-pressed', isMinimized ? 'true' : 'false');
                minimizeButton.setAttribute('aria-label', isMinimized ? 'Open agent workspace' : 'Minimize agent workspace');
                if (minimizeLabel) {
                    minimizeLabel.textContent = isMinimized ? 'Open' : 'Minimize';
                }
            }

            minimizeButton.addEventListener('click', () => {
                syncMinimizedState(!isMinimized);
            });

            syncMinimizedState(isMinimized);
        }

        initAgentWorkspaceControls();
        initAgentWorkspaceEditor();

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
                            syncAssignmentIntoLocalDealCache(propertyKey, null, workspaceUser);
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
                        detailData.propertyAssignment = {
                            assignedTo: persistedRecord?.assignedTo || assignmentRecord.assignedTo,
                            assignedBy: persistedRecord?.assignedBy || assignmentRecord.assignedBy,
                            assignedAt: persistedRecord?.assignedAt || assignmentRecord.assignedAt
                        };
                        localStorage.setItem('selectedPropertyDetail', JSON.stringify(detailData));
                        syncAssignmentIntoLocalDealCache(propertyKey, persistedRecord || assignmentRecord, workspaceUser);
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
                        syncAssignmentIntoLocalDealCache(propertyKey, previousAssignment || null, workspaceUser);
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
            const propertyKey = propertyAddress.toLowerCase();

            function getNotes() {
                return getUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key);
            }

            function setNotes(items) {
                setUserScopedItems(AGENT_NOTES_KEY, workspaceUser.key, items);
            }

            function renderNotes() {
                const canonicalStatus = String(getPersistedPiqStatus() || detailData.piqAgentStatus || 'none');
                const currentAgentRecord = getCurrentAgentRecordState();
                const currentAgentName = String(currentAgentRecord.name || '').trim();
                const currentAgentKey = currentAgentName.toLowerCase();
                const notes = getNotes()
                    .filter(note => {
                        const noteAddress = String(note.propertyAddress || '').trim().toLowerCase();
                        const noteAgent = String(note.agentName || '').trim().toLowerCase();
                        return noteAddress === propertyKey && noteAgent === currentAgentKey;
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
                    heading.textContent = currentAgentName || 'Agent Note';

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
                const currentAgentRecord = getCurrentAgentRecordState();
                const currentAgentName = String(currentAgentRecord.name || '').trim();
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
                    agentName: currentAgentName,
                    agentPhone: currentAgentRecord.phone || '',
                    agentEmail: currentAgentRecord.email || '',
                    agentBrokerage: currentAgentRecord.brokerage || '',
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
            const fbgOfferTermsToggle = document.getElementById('offer-email-fbg-terms-toggle');
            const fbgOfferTermsNote = document.getElementById('offer-email-fbg-terms-note');
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

            if (!senderNameInput || !senderEmailInput || !recipientNameInput || !recipientEmailInput || !categorySelect || !subcategorySelect || !templateSelect || !investorAttachmentsSelect || !sendModeSelect || !includeTermsToggle || !subjectInput || !bodyInput || !copySubjectButton || !copyBodyButton || !sendAgentButton || !openButton || !docSummary || !emailNote || !entitySelect || !ecardSelect || !fbgOfferTermsToggle) {
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
            let fbgOfferTermsFiles = [];

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
                const authToken = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
                const userEmail = normalizeUserIdentityValue(user.email || '');
                const profileEmail = normalizeUserIdentityValue(profile.email || '');
                const canUseProfileIdentity = !authToken || !userEmail || !profileEmail || profileEmail === userEmail;
                const smtpSettings = getScopedSmtpSettings(workspaceUser);
                const smtpUser = String(smtpSettings && smtpSettings.smtpUser ? smtpSettings.smtpUser : '').trim();
                const normalizedWorkspaceEmail = normalizeUserIdentityValue(workspaceUser.email || userEmail || (canUseProfileIdentity ? profileEmail : ''));
                const normalizedDraftSenderEmail = normalizeUserIdentityValue(savedDraft.senderEmail || '');
                const safeDraftSenderEmail = normalizedDraftSenderEmail && normalizedDraftSenderEmail === normalizedWorkspaceEmail
                    ? String(savedDraft.senderEmail || '').trim()
                    : '';
                return {
                    name: String(savedDraft.senderName || user.name || (canUseProfileIdentity ? profile.name : '') || workspaceUser.name || '').trim(),
                    email: String(smtpUser || safeDraftSenderEmail || workspaceUser.email || userEmail || (canUseProfileIdentity ? profileEmail : '') || '').trim()
                };
            }

            function getOfferSignerName() {
                const profile = readLocalJson('userProfile');
                const user = readLocalJson('user');
                const authToken = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
                const userEmail = normalizeUserIdentityValue(user.email || '');
                const profileEmail = normalizeUserIdentityValue(profile.email || '');
                const canUseProfileIdentity = !authToken || !userEmail || !profileEmail || profileEmail === userEmail;
                return String(
                    savedDraft.senderName ||
                    user.name ||
                    (canUseProfileIdentity ? profile.name : '') ||
                    workspaceUser.name ||
                    'Steve Medina'
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
                const smtpSettings = getScopedSmtpSettings(workspaceUser);
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
                    includeFbgOfferTerms: Boolean(fbgOfferTermsToggle.checked),
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

            async function loadFbgOfferTermsFiles() {
                try {
                    const response = await fetch('/api/fbg-offer-terms');
                    if (!response.ok) {
                        throw new Error('Could not load FBG offer terms files.');
                    }

                    const result = await response.json();
                    fbgOfferTermsFiles = Array.isArray(result?.files) ? result.files : [];
                    if (fbgOfferTermsNote) {
                        fbgOfferTermsNote.textContent = fbgOfferTermsFiles.length > 0
                            ? `Attach ${fbgOfferTermsFiles.length} FAST BRIDGE offer terms PDF${fbgOfferTermsFiles.length === 1 ? '' : 's'} to Send To Agent emails.`
                            : 'No FAST BRIDGE offer terms PDFs found in Email - Offer Terms.';
                    }
                } catch (error) {
                    fbgOfferTermsFiles = [];
                    if (fbgOfferTermsNote) {
                        fbgOfferTermsNote.textContent = 'FBG offer terms PDFs could not be loaded right now.';
                    }
                }
            }

            function getSelectedInvestorAttachmentPackage() {
                const selectedFolder = String(investorAttachmentsSelect.value || '').trim();
                return investorAttachmentPackages.find((entry) => entry.folderName === selectedFolder) || null;
            }

            function getSelectedInvestorAttachmentProfile() {
                const selectedPackage = getSelectedInvestorAttachmentPackage();
                return selectedPackage && selectedPackage.offerProfile && typeof selectedPackage.offerProfile === 'object'
                    ? selectedPackage.offerProfile
                    : null;
            }

            function ensureSelectOption(selectEl, value, label) {
                if (!selectEl || !value) {
                    return;
                }

                const normalizedValue = String(value).trim();
                const existingOption = Array.from(selectEl.options).find((option) => String(option.value || '').trim() === normalizedValue);
                if (existingOption) {
                    if (label && !String(existingOption.textContent || '').trim()) {
                        existingOption.textContent = label;
                    }
                    return;
                }

                const option = document.createElement('option');
                option.value = normalizedValue;
                option.textContent = String(label || value).trim();
                selectEl.appendChild(option);
            }

            function setFieldValue(id, value) {
                const field = document.getElementById(id);
                if (!field || value === undefined || value === null || value === '') {
                    return;
                }

                field.value = String(value);
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }

            function applyInvestorAttachmentProfile(profile) {
                if (!profile || typeof profile !== 'object') {
                    return;
                }

                if (entitySelect && profile.entityValue && profile.entityLabel) {
                    ensureSelectOption(entitySelect, profile.entityValue, profile.entityLabel);
                    entitySelect.value = profile.entityValue;
                    entitySelect.dispatchEvent(new Event('change', { bubbles: true }));
                }

                setFieldValue('offer-deposit-amount-mode', profile.depositMode);
                setFieldValue('offer-deposit-flat-fee', profile.depositAmount);
                setFieldValue('offer-close-escrow-days', profile.closeEscrowDays);
                setFieldValue('offer-type', profile.offerType);
                setFieldValue('offer-appraisal', profile.appraisal);
                setFieldValue('offer-inspection-period', profile.inspectionPeriod);
                setFieldValue('offer-termite-inspection', profile.termiteInspection);
                setFieldValue('offer-escrow-fees', profile.escrowFees);
                setFieldValue('offer-title-fees', profile.titleFees);
                setFieldValue('offer-escrow', profile.escrowCompany);
                setFieldValue('offer-title-company', profile.titleCompany);
                setFieldValue('offer-other-terms', profile.otherTermsSummary);

                if (profile.recipientName) {
                    recipientNameInput.value = String(profile.recipientName).trim();
                }
                if (profile.recipientEmail) {
                    recipientEmailInput.value = String(profile.recipientEmail).trim();
                }

                renderDocumentSummary();
                if (includeTermsToggle.checked) {
                    refreshPreparedEmail({ includeTerms: true, preserveManualEdits: false });
                }
                saveDraft();
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
                const selectedFbgFiles = fbgOfferTermsToggle.checked ? fbgOfferTermsFiles : [];
                const totalPreparedDocuments = documents.length + investorFiles.length + selectedFbgFiles.length;

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
                if (selectedFbgFiles.length > 0) {
                    lines.push('FBG Offer Terms package:');
                    selectedFbgFiles.forEach(item => {
                        lines.push(`- ${item.name}`);
                    });
                }

                docSummary.textContent = lines.join('\n');
                emailNote.textContent = uploads.length > 0 || investorFiles.length > 0 || selectedFbgFiles.length > 0
                    ? 'Linked documents can be referenced in the body. Uploaded files, selected investor package files, and enabled FBG Offer Terms PDFs are sent automatically with Send To Agent. Open Email Draft still cannot auto-attach local files. Send To Agent can embed the selected E-card JPG inline.'
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
                const investorProfile = getSelectedInvestorAttachmentProfile();
                const senderName = senderNameInput.value.trim();
                const recipientName = recipientNameInput.value.trim();
                const recipientEmail = recipientEmailInput.value.trim();
                const signerName = String(investorProfile?.signerName || getOfferSignerName() || 'Steve Medina').trim();
                const entityText = String(investorProfile?.entityLabel || getOfferSelectText('offer-entity') || 'Selected Entity').trim();
                const categoryLabel = OFFER_EMAIL_LIBRARY[categorySelect.value]?.label || 'Offer Terms';
                const subcategoryLabel = OFFER_EMAIL_LIBRARY[categorySelect.value]?.subcategories[getEffectiveSubcategory()]?.label || 'General';
                const templateLabel = templateSelect.selectedOptions[0] ? templateSelect.selectedOptions[0].textContent.trim() : 'Standard Template';
                const purchasePrice = getOfferFieldValue('offer-purchase-price') || 'N/A';
                const closeEscrowDays = String(investorProfile?.closeEscrowNote || getOfferFieldValue('offer-close-escrow-days') || 'N/A').trim();
                const depositMode = getOfferFieldValue('offer-deposit-amount-mode') === 'percentage' ? 'Percentage' : 'Flat Fee';
                const depositAmountValue = getOfferFieldValue('offer-deposit-flat-fee');
                const depositAmount = depositAmountValue ? (depositMode === 'Percentage' ? `${depositAmountValue}%` : depositAmountValue) : 'N/A';
                const appraisal = getOfferSelectText('offer-appraisal') || 'N/A';
                const inspection = getOfferSelectText('offer-inspection-period') || 'N/A';
                const termite = getOfferSelectText('offer-termite-inspection') || 'N/A';
                const escrow = getOfferFieldValue('offer-escrow') || 'TBD';
                const titleCompany = getOfferFieldValue('offer-title-company') || 'TBD';
                const escrowFees = getOfferSelectText('offer-escrow-fees') || 'N/A';
                const titleFees = getOfferSelectText('offer-title-fees') || 'N/A';
                const offerType = getOfferSelectText('offer-type') || subcategoryLabel;
                const otherTerms = getOfferFieldValue('offer-other-terms') || investorProfile?.otherTermsSummary || 'None listed.';
                const sellerCompEnabled = document.getElementById('offer-seller-comp-enabled')?.checked;
                const sellerCompPercent = getOfferFieldValue('offer-seller-comp-percent');
                const sellerCompAmount = getOfferFieldValue('offer-seller-comp-amount');
                const documents = getDocumentSummaryParts();
                const investorAdditionalTerms = Array.isArray(investorProfile?.additionalTerms)
                    ? investorProfile.additionalTerms.map((line) => String(line || '').trim()).filter(Boolean)
                    : [];
                const investorCustomSections = Array.isArray(investorProfile?.customSections)
                    ? investorProfile.customSections
                    : [];
                const assignmentVerbiage = String(investorProfile?.assignmentVerbiage || '').trim()
                    || 'EMD to be fully refundable in the instance of seller/assignor non-performance including property not being delivered vacant, not having clear and marketable title, or not in similar condition as when this assignment was executed. Buyer will not assume any payoffs, liens, or assessments. Buyer to walk through on date of funding to verify occupancy status and condition. Any personal property remaining at the property at close of escrow is expressly abandoned by the seller and otherwise released to the buyer.';

                const subject = `${categoryLabel} | ${propertyAddress || 'Property'} | ${entityText}`;

                const lines = [
                    recipientName ? `Hi ${recipientName},` : 'Hello,',
                    '',
                    `Please see our ${templateLabel.toLowerCase()} for ${propertyAddress || 'the property'} submitted by ${entityText}.`,
                ];

                if (includeTerms) {
                    const offerSummaryLines = [
                        '',
                        'Offer Summary',
                        `• Sender: ${senderName || 'FAST BRIDGE GROUP'}`,
                        `• Recipient: ${recipientName || recipientEmail || 'Listing Agent'}`,
                        `• Offer type: ${offerType}`,
                        `• Purchase price: ${purchasePrice}`,
                        `• Close of escrow: ${closeEscrowDays}${/day/i.test(closeEscrowDays) ? '' : ' days'}`,
                        `• Deposit (${depositMode}): ${depositAmount}`,
                        `• Contingencies: ${investorProfile?.contingencySummary ? investorProfile.contingencySummary : `${inspection} inspection | ${appraisal} | ${termite}`}`,
                        `• Escrow fees: ${escrowFees}`,
                        `• Title fees: ${titleFees}`,
                        `• Escrow: ${escrow}`,
                        `• Title company: ${titleCompany}`,
                        investorProfile?.closingCostSummary ? `• Closing costs: ${investorProfile.closingCostSummary}` : '',
                        `• Additional terms: ${otherTerms}`,
                        `• Buyer / vesting: ${entityText}`,
                        `• Signer: ${signerName}`,
                        sellerCompEnabled
                            ? `• Seller compensation: ${sellerCompPercent ? `${sellerCompPercent}%` : ''}${sellerCompPercent && sellerCompAmount ? ' | ' : ''}${sellerCompAmount ? `$${sellerCompAmount}` : ''}`
                            : '• Seller compensation: Not included'
                    ].filter(Boolean);
                    lines.push(...offerSummaryLines);

                    if (investorAdditionalTerms.length > 0) {
                        lines.push('', 'Investor Specific Terms');
                        investorAdditionalTerms.forEach((term) => {
                            lines.push(`• ${term}`);
                        });
                    }

                    investorCustomSections.forEach((section) => {
                        const sectionHeading = String(section?.heading || '').trim();
                        const sectionLines = Array.isArray(section?.lines)
                            ? section.lines.map((line) => String(line || '').trim()).filter(Boolean)
                            : [];
                        if (!sectionHeading || sectionLines.length === 0) {
                            return;
                        }

                        lines.push('', sectionHeading);
                        sectionLines.forEach((line) => {
                            lines.push(`• ${line}`);
                        });
                    });

                    lines.push(
                        '',
                        'Assignment / Contract Verbiage',
                        `“${assignmentVerbiage.replace(/^“|”$/g, '')}”`
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
            fbgOfferTermsToggle.checked = Boolean(savedDraft.includeFbgOfferTerms);
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
            loadFbgOfferTermsFiles().finally(() => {
                renderDocumentSummary();
            });
            loadInvestorAttachmentPackages().finally(() => {
                applyInvestorAttachmentProfile(getSelectedInvestorAttachmentProfile());
                renderDocumentSummary();
            });

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
                applyInvestorAttachmentProfile(getSelectedInvestorAttachmentProfile());
                renderDocumentSummary();
                saveDraft();
            });
            fbgOfferTermsToggle.addEventListener('change', () => {
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
                const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';

                if (!recipientEmail) {
                    showDashboardToast('error', 'Recipient Email Required', 'Add the recipient email before sending.');
                    return;
                }
                if (!token) {
                    showDashboardToast('error', 'Sign In Required', 'Sign in again before sending email through the website.');
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
                            includeFbgOfferTerms: Boolean(fbgOfferTermsToggle.checked),
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
            const strikeZoneTargetButton = document.getElementById('ia-strike-zone-target-btn');
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
            let strikeZoneTargetOffer = null;

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
                financingModeInput.value = String(sanitizedState.financingMode ?? financingModeInput.value ?? '100-95-13-excel-ia');
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

            function calculateZeroGapStrikeZoneOffer(arvBasis, strikeZonePct, grossPurchaseAdjustmentTotal, extraCosts) {
                const maxAcquisitionAmount = Math.max(arvBasis, 0) * (Math.max(strikeZonePct, 0) / 100);
                const offerBeforeClosingRate = maxAcquisitionAmount - Math.max(grossPurchaseAdjustmentTotal, 0) - Math.max(extraCosts, 0);
                if (offerBeforeClosingRate <= 0) {
                    return 0;
                }

                return Math.max(offerBeforeClosingRate / (1 + buySideRate), 0);
            }

            function updateStrikeZoneTargetButton(offerAmount) {
                if (!strikeZoneTargetButton) {
                    return;
                }

                const hasTarget = Number.isFinite(offerAmount) && offerAmount >= 0;
                strikeZoneTargetOffer = hasTarget ? offerAmount : null;
                strikeZoneTargetButton.hidden = !hasTarget;
                strikeZoneTargetButton.disabled = !hasTarget;

                if (!hasTarget) {
                    strikeZoneTargetButton.textContent = 'Use 0% Gap Offer';
                    strikeZoneTargetButton.removeAttribute('title');
                    return;
                }

                const roundedOffer = Math.round(offerAmount);
                strikeZoneTargetButton.textContent = `Use 0% Gap Offer (${formatMoney(roundedOffer)})`;
                strikeZoneTargetButton.setAttribute('title', `Set offer price to ${formatMoney(roundedOffer)} for exactly 0% strike zone gap.`);
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
                const financingMode = financingModeInput.value || '100-95-13-excel-ia';

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
                        const zeroGapOffer = calculateZeroGapStrikeZoneOffer(arvBasis, strikeZonePct, grossPurchaseAdjustmentTotal, extraCosts);
                        updateStrikeZoneTargetButton(zeroGapOffer);
                        updateStrikeZoneGapState(strikeZoneGap >= 0 ? 'is-under' : 'is-over');
                        strikeZoneGapEl.textContent = strikeZoneGap >= 0
                            ? `Gap to strike zone: ${formatPercent(strikeZoneGap)} under max`
                            : `Gap to strike zone: ${formatPercent(Math.abs(strikeZoneGap))} over max`;
                    } else {
                        updateStrikeZoneTargetButton(null);
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

            if (strikeZoneTargetButton) {
                strikeZoneTargetButton.addEventListener('click', () => {
                    if (!Number.isFinite(strikeZoneTargetOffer)) {
                        return;
                    }

                    offerPriceMode = 'manual';
                    offerPriceInput.value = String(Math.round(strikeZoneTargetOffer));
                    formatNumericInputValue(offerPriceInput);
                    recalculate();
                });
            }

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
        initLegalPageAccessLinks();
        initAccentPreference();
        initMyAgentsAccessRules();
        initThemeToggle();
        initBuildVersionLabel();
        initNavbarDateTime();
        initNavbarSearch();
        initNotificationCenter();
        initTiltEffect();
        initCounters();
        initMobileMenu();
        initSidebarCollapse();
        initMenuSoundEffects();
        initSoundSettingsTab();
        initFormValidation();
        initPasswordToggle();
        initPageTransitions();
        initSettingsTabs();
        initAnalyticsNavBadge();
        initLiveKpiStats();
        initClosedDealsWidget();
        initWidgetControls();
        initInteractiveCalendar();
        initDashboardChatGptWidget();
        initDailyBibleVerseWidget();
        initPersonalOutreachWorkspace();
        initOffersAcceptedWidget();
        initNotesWidget();
        initAgentWorkspaceEmailPrep();
        initAdminOnlineUsersWidget();
        initAdminAccessRequests();
        initAdminPropertySubmissions();
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