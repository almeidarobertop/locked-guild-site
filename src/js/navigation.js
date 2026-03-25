function go(id) {
  document.querySelector(id).scrollIntoView({
    behavior: 'smooth'
  });
}

const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('active');
  hamburger.classList.toggle('active');
});
