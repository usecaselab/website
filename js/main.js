// Route map: path <-> thesis ID
const routes = {
  '/verifiable-cities': 'cities',
  '/composable-commerce': 'commerce',
  '/global-insurance': 'insurance',
  '/automated-smbs': 'sme'
};

const idToPath = Object.fromEntries(
  Object.entries(routes).map(([path, id]) => [id, path])
);

function showMain(animate) {
  const mainPage = document.getElementById('mainPage');
  const activeThesis = document.querySelector('.thesis-page.active');

  if (animate !== false && activeThesis) {
    activeThesis.classList.remove('visible');
    setTimeout(() => {
      activeThesis.classList.remove('active');
      mainPage.style.display = 'block';
      mainPage.classList.remove('fade-out');
      requestAnimationFrame(() => {
        mainPage.classList.remove('fade-out');
      });
      window.scrollTo(0, 0);
    }, 300);
  } else {
    document.querySelectorAll('.thesis-page').forEach(p => {
      p.classList.remove('active');
      p.classList.remove('visible');
    });
    mainPage.style.display = 'block';
    mainPage.classList.remove('fade-out');
    window.scrollTo(0, 0);
  }
  history.pushState(null, '', '/');
}

function showThesis(id, animate) {
  const mainPage = document.getElementById('mainPage');
  const targetPage = document.getElementById('page-' + id);
  if (!targetPage) return;

  if (animate !== false) {
    mainPage.classList.add('fade-out');
    setTimeout(() => {
      mainPage.style.display = 'none';
      document.querySelectorAll('.thesis-page').forEach(p => {
        p.classList.remove('active');
        p.classList.remove('visible');
      });
      targetPage.classList.add('active');
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        targetPage.classList.add('visible');
      });
    }, 300);
  } else {
    mainPage.style.display = 'none';
    document.querySelectorAll('.thesis-page').forEach(p => {
      p.classList.remove('active');
      p.classList.remove('visible');
    });
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      targetPage.classList.add('visible');
    });
  }

  const path = idToPath[id] || '/' + id;
  history.pushState(null, '', path);
}

document.getElementById('homeLink').addEventListener('click', () => { showMain(); });

// Handle back/forward button
window.addEventListener('popstate', () => {
  const path = window.location.pathname;
  if (routes[path]) {
    showThesis(routes[path], false);
  } else {
    showMain(false);
  }
});

// Handle direct navigation to a thesis path
const initPath = window.location.pathname;
if (routes[initPath]) {
  showThesis(routes[initPath], false);
}
