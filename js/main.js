function showMain() {
  document.getElementById('mainPage').style.display = 'block';
  document.querySelectorAll('.thesis-page').forEach(p => p.classList.remove('active'));
  window.scrollTo(0, 0);
  history.pushState(null, '', window.location.pathname);
}

function showThesis(id) {
  document.getElementById('mainPage').style.display = 'none';
  document.querySelectorAll('.thesis-page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo(0, 0);
  history.pushState(null, '', '#' + id);
}

document.getElementById('homeLink').addEventListener('click', () => { showMain(); });

// Handle back button
window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('page-' + hash)) {
    showThesis(hash);
  } else {
    showMain();
  }
});

// Handle direct hash navigation
const initHash = window.location.hash.replace('#', '');
if (initHash && document.getElementById('page-' + initHash)) {
  showThesis(initHash);
}
