// ==========================================================
// Viento 10 · interacciones
// ==========================================================

// ---------- Selector de idioma ----------
// Solo cambia la etiqueta visible; las traducciones están pendientes.
(function () {
  const lang = document.getElementById('lang');
  if (!lang) return;

  const toggle = lang.querySelector('.lang__toggle');
  const list = lang.querySelector('.lang__list');
  const current = lang.querySelector('.lang__current');

  const setOpen = (open) => {
    list.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
  };

  toggle.addEventListener('click', () => setOpen(list.hidden));

  list.addEventListener('click', (e) => {
    const option = e.target.closest('button');
    if (!option) return;
    list.querySelectorAll('button').forEach((b) => b.removeAttribute('aria-current'));
    option.setAttribute('aria-current', 'true');
    current.textContent = option.textContent;
    setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!lang.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

// ---------- Fundido al hacer scroll ----------
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('js');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // solo la primera vez
    });
  }, { threshold: 0.15 });

  items.forEach((el) => observer.observe(el));
})();
