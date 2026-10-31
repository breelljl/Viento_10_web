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
  }, {
    threshold: 0,
    // el fundido empieza cuando el elemento supera el 25% inferior de la pantalla,
    // no en cuanto asoma por el borde
    rootMargin: '0px 0px -25% 0px',
  });

  items.forEach((el) => observer.observe(el));
})();

// ---------- Hero: pase de fotos con fundido ----------
(function () {
  const slides = document.querySelectorAll('#heroSlides .hero__bg');
  if (slides.length < 2) return; // con una sola foto no hay pase

  const INTERVAL = 50000; // tiempo que se ve cada foto (ms)
  let current = 0;       // foto visible ahora (empieza en la primera)

  setInterval(() => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, INTERVAL);
})();

// ---------- Parallax suave (sección Bienvenida) ----------
// Cada elemento con data-parallax se desplaza según su distancia al centro de la pantalla.
// Valor = intensidad: 0.05 casi quieto (fondo) · 0.2 se mueve más (primer plano).
// Usa la propiedad CSS "translate" para no interferir con el fundido (que usa "transform").
(function () {
  const items = [...document.querySelectorAll('[data-parallax]')];
  if (!items.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const mobile = window.matchMedia('(max-width: 767px)');
  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;
    const factor = mobile.matches ? 0.5 : 1; // en móvil, la mitad de movimiento
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const shift = parseFloat(el.dataset.shift || 0); // desplazamiento ya aplicado
      const top = rect.top - shift;                    // posición real, sin parallax
      if (rect.bottom < -200 || top > vh + 200) return; // fuera de pantalla
      const offset = (top + rect.height / 2 - vh / 2) * parseFloat(el.dataset.parallax) * factor;
      el.dataset.shift = (-offset).toFixed(1);
      el.style.translate = `0 ${el.dataset.shift}px`;
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Pase de habitaciones ----------
// Fotos: fundido. Nombres: una cinta horizontal que se desliza hasta dejar
// la habitación activa en el centro, con los vecinos asomando por los lados.
// La cinta se repite 3 veces para que siempre haya vecinos y el bucle no salte.
// Avanza sola (tiempo en --rooms-autoplay); en móvil, deslizar reinicia el contador.
(function () {
  const slider = document.getElementById('roomSlider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('.rooms__slide')];
  const track = slider.querySelector('.rooms__names-track');
  const details = slider.querySelector('.rooms__details');
  const srName = slider.querySelector('[data-room-name]');
  const counter = slider.querySelector('[data-current]');
  const progress = slider.querySelector('.rooms__progress');
  const total = slides.length;

  const styles = getComputedStyle(document.documentElement);
  const toMs = (v) => parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000);
  const AUTOPLAY = toMs(styles.getPropertyValue('--rooms-autoplay')) || 5000;
  const MOVE = toMs(styles.getPropertyValue('--rooms-text-move')) || 1000;

  // Cinta: [copia] [original] [copia]
  for (let copy = 0; copy < 3; copy++) {
    slides.forEach((slide) => {
      // "|" en data-name marca un salto de línea (nombres que van en dos líneas)
      const span = document.createElement('span');
      slide.dataset.name.split('|').forEach((line, i) => {
        if (i) span.appendChild(document.createElement('br'));
        span.appendChild(document.createTextNode(line.trim()));
      });
      track.appendChild(span);
    });
  }
  const names = [...track.children];

  let current = 0;        // habitación activa (0..total-1)
  let position = total;   // nombre centrado dentro de la cinta (empieza en la copia central)
  let busy = false;
  let timer;

  slider.querySelector('[data-total]').textContent = total;

  // Desplaza la cinta para centrar el nombre "position"
  function center(animate) {
    const el = names[position];
    const x = slider.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    track.classList.toggle('no-transition', !animate);
    track.style.transform = `translateX(${x}px)`;
    if (!animate) track.offsetWidth; // aplica sin animación
    if (!animate) placeDetails();
  }

  // Coloca los detalles justo debajo del nombre activo (ocupe una o dos líneas)
  function placeDetails() {
    details.style.top = `calc(50% + ${names[position].offsetHeight / 2 + 12}px)`;
  }

  function restartProgress() {
    progress.classList.remove('is-running');
    progress.offsetWidth; // reinicia la animación de la línea
    progress.classList.add('is-running');
  }

  function go(dir) {
    if (busy) return;
    busy = true;

    const from = slides[current];
    current = (current + dir + total) % total;
    const to = slides[current];

    // Fotos: fundido cruzado
    from.classList.remove('is-active');
    to.classList.add('is-active');

    // Nombres: la cinta se desliza al siguiente (o anterior)
    position += dir;
    center(true);

    // Detalles: se funden y cambian a mitad del movimiento
    details.classList.add('is-hidden');
    setTimeout(() => {
      details.textContent = to.dataset.details;
      placeDetails(); // se recoloca mientras está invisible
      details.classList.remove('is-hidden');
    }, MOVE / 2);

    counter.textContent = current + 1;
    srName.textContent = to.dataset.name.replace('|', '');
    restartProgress();

    setTimeout(() => {
      // Si hemos llegado a una copia, salta sin animación al mismo nombre de la cinta central
      if (position < total || position >= total * 2) {
        position = total + current;
        center(false);
      }
      busy = false;
    }, MOVE);
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(1), AUTOPLAY);
    restartProgress();
  }


  // Deslizar con el dedo (móvil)
  let startX = null;
  slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { go(dx < 0 ? 1 : -1); restart(); }
    startX = null;
  });

  // Recolocar al cambiar el tamaño de la ventana o al cargar las fuentes
  window.addEventListener('resize', () => center(false));
  document.fonts && document.fonts.ready.then(() => center(false));

  center(false);
  restart();
})();

// ---------- Carrusel de fotos (Experiencia) ----------
// Duplica las fotos: la animación CSS mueve media pista y vuelve al inicio sin que se note.
(function () {
  const track = document.querySelector('#expStrip .strip__track');
  if (!track) return;
  [...track.children].forEach((img) => {
    const copy = img.cloneNode();
    copy.alt = '';
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  });
})();

// ---------- Carrusel de opiniones ----------
// La línea de progreso marca el tiempo (--reviews-autoplay): cuando termina de llenarse,
// pasa a la siguiente opinión. Así la línea y el cambio van siempre sincronizados.
(function () {
  const slider = document.getElementById('reviews');
  if (!slider) return;
  const items = [...slider.querySelectorAll('.testimonial')];
  const line = slider.querySelector('.testimonial__line');
  let current = 0;
  items.forEach((el, i) => el.classList.toggle('is-active', i === 0)); // siempre arranca por la primera

  const restartLine = () => {
    line.classList.remove('is-running');
    line.offsetWidth; // reinicia la animación
    line.classList.add('is-running');
  };

  const go = (dir) => {
    if (items.length < 2) return;
    items[current].classList.remove('is-active');
    current = (current + dir + items.length) % items.length;
    items[current].classList.add('is-active');
    restartLine(); // la línea vuelve a empezar también al usar las flechas
  };

  line.addEventListener('animationend', () => go(1));
  slider.querySelectorAll('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => go(Number(btn.dataset.dir)));
  });

  restartLine();
})();

// ---------- Hero: se oscurece al taparlo ----------
// 0 arriba del todo → 1 cuando la sección siguiente cubre el hero por completo.
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let ticking = false;
  const update = () => {
    const progress = Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1);
    hero.style.setProperty('--hero-cover', progress.toFixed(3));
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
