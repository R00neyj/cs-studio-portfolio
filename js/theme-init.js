(function () {
  var saved = null;
  try { saved = localStorage.getItem('csas-theme'); } catch (e) {}
  var theme = saved === 'dark' || saved === 'light'
    ? saved
    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
