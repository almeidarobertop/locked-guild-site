import { initNavigation } from './modules/navigation.js';
import { initGallery } from './modules/gallery.js';
import { initMembers } from './modules/members.js';
import { initParticles } from './modules/particles.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initGallery();
    initMembers();
    initParticles();
});
