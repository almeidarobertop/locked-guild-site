function go(id) {
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
}

export function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('#navMenu a');

    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target');

            if (target) {
                e.preventDefault();
                go(target);
            }

            menu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}
