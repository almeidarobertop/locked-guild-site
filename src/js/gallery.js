const gallery = document.getElementById('gallery');

function openImg(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').style.display = 'flex';
}

document.getElementById('lightbox').addEventListener('click', () => {
  document.getElementById('lightbox').style.display = 'none';
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

      setTimeout(() => {
        img.classList.add('show');
      }, index * 30);
    });

  })
  .catch(err => {
    console.error('Erro ao carregar screenshots:', err);
  });