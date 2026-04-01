import { $, $$ } from '../core/dom.js';

const scrollToSection = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;

    requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth' });
    });
};

export function initNavigation() {
    const dom = {
        nav: document.querySelector('nav'),
        hamburger: $('hamburger'),
        menu: $('navMenu'),
        links: $$('#navMenu a'),
    };

    if (!dom.nav || !dom.hamburger || !dom.menu) return;

    const syncStickyOffsets = () => {
        document.documentElement.style.setProperty('--nav-sticky-offset', `${dom.nav.offsetHeight}px`);
    };

    syncStickyOffsets();
    window.addEventListener('resize', syncStickyOffsets);

    dom.hamburger.addEventListener('click', () => {
        dom.menu.classList.toggle('active');
        dom.hamburger.classList.toggle('active');
        syncStickyOffsets();
    });

    dom.links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = link.dataset.target;

            if (target) {
                event.preventDefault();
                scrollToSection(target);
            }

            dom.menu.classList.remove('active');
            dom.hamburger.classList.remove('active');
            syncStickyOffsets();
        });
    });
}
