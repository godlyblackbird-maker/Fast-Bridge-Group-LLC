const STYLE_ID = 'fast-cyberpunk-cursor-style';
const CONTAINER_ID = 'fast-cyberpunk-cursor';

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${CONTAINER_ID} {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 9998;
        }

        #${CONTAINER_ID} .fast-cyberpunk-cursor-main,
        #${CONTAINER_ID} .fast-cyberpunk-cursor-trail,
        #${CONTAINER_ID} .fast-cyberpunk-cursor-glow {
            position: fixed;
            top: 0;
            left: 0;
            border-radius: 999px;
            pointer-events: none;
            will-change: transform, opacity, border-color, box-shadow;
            transform: translate3d(-200px, -200px, 0);
        }

        #${CONTAINER_ID} .fast-cyberpunk-cursor-main {
            width: 12px;
            height: 12px;
            background:
                radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.98) 0%, rgba(158, 255, 245, 0.96) 32%, rgba(0, 240, 255, 0.92) 62%, rgba(255, 0, 153, 0.78) 100%);
            box-shadow:
                0 0 10px rgba(0, 240, 255, 0.82),
                0 0 22px rgba(255, 0, 153, 0.42);
            mix-blend-mode: screen;
        }

        #${CONTAINER_ID} .fast-cyberpunk-cursor-trail {
            width: 34px;
            height: 34px;
            border: 2px solid rgba(0, 240, 255, 0.82);
            box-shadow:
                0 0 14px rgba(0, 240, 255, 0.34),
                inset 0 0 12px rgba(255, 0, 153, 0.18);
            mix-blend-mode: screen;
        }

        #${CONTAINER_ID} .fast-cyberpunk-cursor-glow {
            width: 72px;
            height: 72px;
            background: radial-gradient(circle, rgba(0, 240, 255, 0.30) 0%, rgba(255, 0, 153, 0.18) 34%, rgba(0, 0, 0, 0) 72%);
            filter: blur(5px);
            opacity: 0.72;
            mix-blend-mode: screen;
        }

        @media (pointer: coarse) {
            #${CONTAINER_ID} {
                display: none;
            }
        }
    `;

    document.head.appendChild(style);
}

function createCursorElement(className) {
    const element = document.createElement('div');
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    return element;
}

export function mountCyberpunkCursorEffect() {
    if (!document.body) {
        return () => {};
    }

    const existing = document.getElementById(CONTAINER_ID);
    if (existing) {
        existing.remove();
    }

    ensureStyles();

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.setAttribute('aria-hidden', 'true');

    const main = createCursorElement('fast-cyberpunk-cursor-main');
    const trail = createCursorElement('fast-cyberpunk-cursor-trail');
    const glow = createCursorElement('fast-cyberpunk-cursor-glow');

    container.appendChild(glow);
    container.appendChild(trail);
    container.appendChild(main);
    document.body.appendChild(container);

    const state = {
        pointerX: window.innerWidth * 0.5,
        pointerY: window.innerHeight * 0.5,
        mainX: window.innerWidth * 0.5,
        mainY: window.innerHeight * 0.5,
        trailX: window.innerWidth * 0.5,
        trailY: window.innerHeight * 0.5,
        glowX: window.innerWidth * 0.5,
        glowY: window.innerHeight * 0.5,
        scale: 1,
        glowOpacity: 0.72,
        trailBorder: 'rgba(0, 240, 255, 0.82)',
        frame: 0
    };

    const setHoverState = (isHovering) => {
        state.scale = isHovering ? 1.3 : 1;
        state.glowOpacity = isHovering ? 0.96 : 0.72;
        state.trailBorder = isHovering ? 'rgba(255, 130, 218, 0.95)' : 'rgba(0, 240, 255, 0.82)';
    };

    const updatePointer = (clientX, clientY) => {
        state.pointerX = clientX;
        state.pointerY = clientY;
    };

    const handleMouseMove = (event) => {
        updatePointer(event.clientX, event.clientY);
    };

    const handleMouseDown = () => {
        state.scale = 0.82;
        state.glowOpacity = 1;
    };

    const handleMouseUp = () => {
        state.scale = 1;
        state.glowOpacity = 0.72;
    };

    const handleMouseOver = (event) => {
        const target = event.target instanceof Element ? event.target : null;
        setHoverState(Boolean(target && target.closest('a, button, input, textarea, select, label, summary, [role="button"], [data-hover="true"]')));
    };

    const handleMouseOut = (event) => {
        const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
        if (related && related.closest('a, button, input, textarea, select, label, summary, [role="button"], [data-hover="true"]')) {
            return;
        }
        setHoverState(false);
    };

    const render = () => {
        state.mainX += (state.pointerX - state.mainX) * 0.32;
        state.mainY += (state.pointerY - state.mainY) * 0.32;
        state.trailX += (state.pointerX - state.trailX) * 0.18;
        state.trailY += (state.pointerY - state.trailY) * 0.18;
        state.glowX += (state.pointerX - state.glowX) * 0.1;
        state.glowY += (state.pointerY - state.glowY) * 0.1;

        main.style.transform = `translate3d(${state.mainX - 6}px, ${state.mainY - 6}px, 0) scale(${state.scale})`;
        trail.style.transform = `translate3d(${state.trailX - 17}px, ${state.trailY - 17}px, 0) scale(${state.scale})`;
        glow.style.transform = `translate3d(${state.glowX - 36}px, ${state.glowY - 36}px, 0) scale(${1 + (state.scale - 1) * 0.5})`;
        trail.style.borderColor = state.trailBorder;
        glow.style.opacity = String(state.glowOpacity);

        state.frame = window.requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });

    state.frame = window.requestAnimationFrame(render);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mouseover', handleMouseOver);
        window.removeEventListener('mouseout', handleMouseOut);

        if (state.frame) {
            window.cancelAnimationFrame(state.frame);
        }

        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    };
}