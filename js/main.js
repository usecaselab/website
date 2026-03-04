// Route map: path <-> thesis ID
const routes = {
  '/verifiable-cities': 'cities',
  '/open-telematics': 'telematics',
  '/composable-commerce': 'commerce',
  '/global-insurance': 'insurance',
  '/automated-smes': 'sme'
};

const idToPath = Object.fromEntries(
  Object.entries(routes).map(([path, id]) => [id, path])
);

function showMain() {
  document.getElementById('mainPage').style.display = 'block';
  document.querySelectorAll('.thesis-page').forEach(p => p.classList.remove('active'));
  window.scrollTo(0, 0);
  history.pushState(null, '', '/');
}

function showThesis(id) {
  document.getElementById('mainPage').style.display = 'none';
  document.querySelectorAll('.thesis-page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo(0, 0);
  const path = idToPath[id] || '/' + id;
  history.pushState(null, '', path);
}

document.getElementById('homeLink').addEventListener('click', () => { showMain(); });

// Handle back/forward button
window.addEventListener('popstate', () => {
  const path = window.location.pathname;
  if (routes[path]) {
    showThesis(routes[path]);
  } else {
    showMain();
  }
});

// Handle direct navigation to a thesis path
const initPath = window.location.pathname;
if (routes[initPath]) {
  showThesis(routes[initPath]);
}
