import { createSectionObserver } from './core/observer.js';
import { runWhenIdle } from './core/idle.js';

import { initNavigation } from './modules/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();

    const observer = createSectionObserver(async (section) => {
        const id = section.id;

        switch (id) {
            case 'members':
                runWhenIdle(async () => {
                    const { initMembers } = await import('./modules/members.js');
                    initMembers();
                });
                break;

            case 'screenshots':
                runWhenIdle(async () => {
                    const { initGallery } = await import('./modules/gallery.js');
                    initGallery();
                });
                break;

            case 'join':
            case 'houses':
                // leve → ignora lazy
                break;

            default:
                break;
        }
    });

    document.querySelectorAll('section').forEach((section) => {
        observer.observe(section);
    });

    runWhenIdle(async () => {
        const { initParticles } = await import('./modules/particles.js');
        initParticles();
    });
});
