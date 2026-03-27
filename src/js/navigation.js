function go(id) {
  document.querySelector(id).scrollIntoView({
    behavior: 'smooth'
  });
}

const hamburger = document.getElementById('hamburger'),
  menu = document.getElementById('navMenu'),
  navLinks = document.querySelectorAll('#navMenu a');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('active');
  hamburger.classList.toggle('active');
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    menu.classList.remove('active');
    hamburger.classList.remove('active');
  });
});