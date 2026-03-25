let i = 1;
const gallery = document.getElementById('gallery');

function loadNext() {
  const img = new Image();
  img.src = `src/screenshots/${i}.png`;
  img.loading = "lazy";

  img.onload = function () {
    img.onclick = () => openImg(img.src);
    gallery.appendChild(img);

    i++;

    setTimeout(loadNext, 100);
  };
}

loadNext();