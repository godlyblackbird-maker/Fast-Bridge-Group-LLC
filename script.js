/* ============================================
   TemplateMo 3D Glassmorphism Dashboard
   https://templatemo.com
   JavaScript
============================================ */

(function() {
    'use strict';

    function ensureThemeToggleIcons(themeToggle) {
        if (!themeToggle) {
            return { iconSun: null, iconMoon: null, iconPalm: null, iconSymbol: null };
        }

        const THEME_SYMBOLS = {
            dark: 'Symbols/Dark Mode.svg',
            light: 'Symbols/Ligh Mode.svg',
            beach: 'Symbols/Beach Mode.svg',
            swamp: 'Symbols/Beach Mode.svg'
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

    function updateThemeToggleIcons(themeToggle, theme) {
        const { iconSun, iconMoon, iconPalm, iconSymbol } = ensureThemeToggleIcons(themeToggle);
        if (!iconSun || !iconMoon || !iconPalm || !iconSymbol) {
            return;
        }

        const themeSymbols = {
            dark: 'Symbols/Dark Mode.svg',
            light: 'Symbols/Ligh Mode.svg',
            beach: 'Symbols/Beach Mode.svg',
            swamp: 'Symbols/Beach Mode.svg'
        };
        const resolvedTheme = themeSymbols[theme] ? theme : 'beach';

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
        if (!themeToggle) return;

        ensureThemeToggleIcons(themeToggle);
        
        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);

            updateThemeToggleIcons(themeToggle, theme);
            const modeLabel = theme === 'swamp' ? 'Swamp' : `${theme.charAt(0).toUpperCase()}${theme.slice(1)}`;
            themeToggle.title = `Theme: ${modeLabel} Mode`;
        }
        
        // Default first-time visitors to beach mode.
        let savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            savedTheme = 'beach';
            localStorage.setItem('theme', savedTheme);
        }
        setTheme(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark'
                ? 'light'
                : currentTheme === 'light'
                    ? 'beach'
                    : currentTheme === 'beach'
                        ? 'swamp'
                    : 'dark';
            setTheme(nextTheme);
        });
    }

    // ============================================
    // 3D Tilt Effect
    // ============================================
    function initTiltEffect() {
        document.querySelectorAll('.glass-card-3d').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
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
            
            // Easing function
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
            const value = parseInt(text.replace(/[^0-9]/g, ''));
            
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

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') && 
                    !sidebar.contains(e.target) && 
                    !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }

    // ============================================
    // Form Validation (for login/register)
    // ============================================
    function initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
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

                // Email validation
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailInput.value)) {
                        isValid = false;
                        emailInput.style.borderColor = '#ff6b6b';
                    }
                }

                if (isValid) {
                    // Form is valid - you can add your submission logic here
                    console.log('Form is valid');
                    // For demo purposes, redirect to dashboard
                    if (form.dataset.redirect) {
                        window.location.href = form.dataset.redirect;
                    }
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
        const links = document.querySelectorAll('a[href$=".html"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Skip external links
                if (link.hostname !== window.location.hostname) return;
                
                e.preventDefault();
                const href = link.getAttribute('href');
                
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        });

        // Fade in on page load
        window.addEventListener('load', () => {
            document.body.style.opacity = '1';
        });
    }

    // ============================================
    // Settings Tab Navigation
    // ============================================
    function initSettingsTabs() {
        const tabLinks = document.querySelectorAll('.settings-nav-link[data-tab]');
        
        if (tabLinks.length === 0) return;

        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get target tab
                const tabId = link.getAttribute('data-tab');
                
                // Remove active class from all nav links
                document.querySelectorAll('.settings-nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Hide all tab contents
                document.querySelectorAll('.settings-tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show target tab content
                const targetTab = document.getElementById('tab-' + tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });

        // Theme select sync with toggle
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            let currentTheme = localStorage.getItem('theme');
            if (!currentTheme) {
                currentTheme = 'beach';
                localStorage.setItem('theme', currentTheme);
            }
            themeSelect.value = currentTheme;
            
            themeSelect.addEventListener('change', () => {
                const theme = themeSelect.value;
                if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', theme);
                    localStorage.setItem('theme', theme);
                }
                
                const themeToggle = document.getElementById('theme-toggle');
                const effectiveTheme = document.documentElement.getAttribute('data-theme');
                updateThemeToggleIcons(themeToggle, effectiveTheme);
                if (themeToggle) {
                    themeToggle.title = `Theme: ${effectiveTheme.charAt(0).toUpperCase() + effectiveTheme.slice(1)} Mode`;
                }
            });
        }
    }

    // ============================================
    // Initialize All Functions
    // ============================================
    function init() {
        initThemeToggle();
        initTiltEffect();
        initCounters();
        initMobileMenu();
        initFormValidation();
        initPasswordToggle();
        initPageTransitions();
        initSettingsTabs();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
