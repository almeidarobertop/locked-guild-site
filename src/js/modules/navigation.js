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
        hamburger: $('hamburger'),
        menu: $('navMenu'),
        links: $$('#navMenu a'),
    };

    if (!dom.hamburger || !dom.menu) return;

    dom.hamburger.addEventListener('click', () => {
        dom.menu.classList.toggle('active');
        dom.hamburger.classList.toggle('active');
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
        });
    });
}
