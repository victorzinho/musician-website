function showSection (section) {
  const sections = [...document.getElementsByTagName('section')];
  sections.forEach(section => section.classList.remove('section-show'));
  section.classList.add('section-show');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSectionWithTimeout (section) {
  setTimeout(() => showSection(section, 350));
}

function updateSection (target) {
  if (!target) return false;

  target = target.replace('#', '');
  const section = document.getElementById(target);
  if (!section) return false;

  const home = document.getElementById('home');
  if (target === 'home') {
    home.classList.remove('header-top');
    showSection(section);
  } else if (!home.classList.contains('header-top')) {
    // transition to header on top, showing the contents after ~350ms gives time for header transitions to go first
    home.classList.add('header-top');
    showSectionWithTimeout(section);
  } else {
    showSection(section);
  }

  return true;
}

function onHashChange () {
  if (updateSection(window.location.hash)) {
    [...document.querySelectorAll('.nav-link')].forEach(link => {
      if (link.getAttribute('href') === window.location.hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

// open/close menu on small screens
document.getElementById('navbar-mobile-toggle').addEventListener('click', () => {
  // class .enabled only considered for small screens on css
  document.querySelector('#navbar ul').classList.toggle('enabled');
  document.getElementById('navbar-mobile-toggle').classList.toggle('bi-list');
  document.getElementById('navbar-mobile-toggle').classList.toggle('bi-x');
});

document.querySelectorAll('.nav-link').forEach(element => element.addEventListener('click', event => {
  const target = (event.target.hash || event.target.parentElement.hash).replace('#', '');
  if (!document.getElementById(target)) return;

  event.preventDefault();

  // update active state on nav bar
  document.querySelectorAll('.nav-link').forEach(element => element.classList.remove('active'));
  event.target.classList.add('active');

  // update mobile menu
  document.getElementById('navbar-mobile-toggle').classList.add('bi-list');
  document.getElementById('navbar-mobile-toggle').classList.remove('bi-x');
  document.querySelector('#navbar ul').classList.remove('enabled');

  updateSection(target);
  window.history.pushState({}, '', '#' + target);
}));

window.addEventListener('hashchange', onHashChange);
window.addEventListener('load', onHashChange);
