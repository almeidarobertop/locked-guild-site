const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
let currentIndex = 0;
let imagesList = [];

let touchStartX = 0;
let touchEndX = 0;

function showNext() {
  currentIndex = (currentIndex + 1) % imagesList.length;
  updateImage();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + imagesList.length) % imagesList.length;
  updateImage();
}

function updateImage() {
  lightboxImg.style.opacity = 0;

  setTimeout(() => {
    lightboxImg.src = `src/screenshots/${imagesList[currentIndex].file}`;
    lightboxImg.style.opacity = 1;
  }, 150);
}

function handleSwipe() {
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) < 50) return;

  if (diff > 0) {
    showNext();
  } else {
    showPrev();
  }
}

function openImg(index) {
  currentIndex = index;

  const src = `src/screenshots/${imagesList[index].file}`;

  lightboxImg.src = src;
  lightbox.style.display = 'flex';

  document.body.classList.add('no-scroll');
}

function closeImg() {
  lightbox.style.display = 'none';

  document.body.classList.remove('no-scroll');
}

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeImg();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeImg();
  }
});

fetch('src/data/gallery.json')
  .then(res => res.json())
  .then(images => {

    imagesList = images;
    gallery.innerHTML = '';

    images.forEach((imgData, index) => {
      const img = new Image();

      img.src = `src/screenshots/${imgData.file}`;
      img.alt = imgData.title;
      img.title = imgData.title;
      img.loading = "lazy";

      img.onclick = () => openImg(index);

      gallery.appendChild(img);

      img.style.transitionDelay = `${index * 30}ms`;

      requestAnimationFrame(() => {
        img.classList.add('show');
      });
    });

  })
  .catch(err => {
    console.error('Erro ao carregar screenshots:', err);
  }
);

lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;

  handleSwipe();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.style.display !== 'flex') return;

  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});