import { $, create } from '../core/dom.js';

export function initGallery() {
    const dom = {
        gallery: $('gallery'),
        lightbox: $('lightbox'),
        lightboxImg: $('lightbox-img'),
    };

    if (!dom.gallery || !dom.lightbox || !dom.lightboxImg) return;

    let currentIndex = 0;
    let imagesList = [];

    let touchStartX = 0;
    let touchEndX = 0;

    let isZooming = false;
    let scale = 1;
    let initialDistance = 0;

    const updateImage = () => {
        dom.lightboxImg.style.opacity = 0;

        setTimeout(() => {
            dom.lightboxImg.src = `src/screenshots/${imagesList[currentIndex].file}`;
            dom.lightboxImg.style.opacity = 1;
        }, 120);
    };

    const showNext = () => {
        if (!imagesList.length) return;
        currentIndex = (currentIndex + 1) % imagesList.length;
        updateImage();
    };

    const showPrev = () => {
        if (!imagesList.length) return;
        currentIndex = (currentIndex - 1 + imagesList.length) % imagesList.length;
        updateImage();
    };

    const openImg = (index) => {
        currentIndex = index;
        dom.lightboxImg.src = `src/screenshots/${imagesList[index].file}`;
        dom.lightbox.style.display = 'flex';
        document.body.classList.add('no-scroll');
    };

    const closeImg = () => {
        dom.lightbox.style.display = 'none';
        document.body.classList.remove('no-scroll');
    };

    const handleSwipe = () => {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) < 50) return;

        if (diff > 0) showNext();
        else showPrev();
    };

    dom.lightbox.addEventListener('click', (e) => {
        if (e.target === dom.lightbox) closeImg();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeImg();

        if (dom.lightbox.style.display !== 'flex') return;

        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    dom.lightbox.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            isZooming = true;
            return;
        }

        isZooming = false;
        touchStartX = e.changedTouches[0].screenX;
    });

    dom.lightbox.addEventListener('touchend', (e) => {
        if (scale < 1.01) {
            scale = 1;
            initialDistance = 0;
            dom.lightboxImg.style.transform = 'scale(1)';
        }

        if (isZooming || scale !== 1) return;

        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    dom.lightbox.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            isZooming = true;

            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (!initialDistance) initialDistance = distance;

            scale = distance / initialDistance;

            dom.lightboxImg.style.transform = `scale(${scale})`;
        }
    });

    fetch('src/data/gallery.json')
        .then((res) => res.json())
        .then((images) => {
            imagesList = images;
            dom.gallery.innerHTML = '';

            const fragment = document.createDocumentFragment();

            images.forEach((imgData, index) => {
                const img = create('img');

                img.src = `src/screenshots/${imgData.file}`;
                img.alt = imgData.title;
                img.title = imgData.title;
                img.loading = 'lazy';

                img.style.transitionDelay = `${index * 25}ms`;

                img.addEventListener('click', () => openImg(index));

                fragment.appendChild(img);

                requestAnimationFrame(() => {
                    img.classList.add('show');
                });
            });

            dom.gallery.appendChild(fragment);
        })
        .catch(() => {
            dom.gallery.textContent = 'Failed to load gallery.';
        });
}
