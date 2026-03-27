const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openImg(src) {
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

    gallery.innerHTML = '';

    images.forEach((imgData, index) => {
      const img = new Image();

      img.src = `src/screenshots/${imgData.file}`;
      img.alt = imgData.title;
      img.title = imgData.title;
      img.loading = "lazy";

      img.onclick = () => openImg(img.src);

      gallery.appendChild(img);

      img.style.transitionDelay = `${index * 30}ms`;

      requestAnimationFrame(() => {
        img.classList.add('show');
      });
    });

  })
  .catch(err => {
    console.error('Erro ao carregar screenshots:', err);
  });