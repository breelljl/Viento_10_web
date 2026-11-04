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
    current.textContent = option.lang.toUpperCase(); // abreviado: ES, EN, FR, DE
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

  // tiempo que se ve cada foto: --hero-time en tokens.css
  const INTERVAL = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-time')) * 1000 || 50000;
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
    // primero se mide todo y después se mueve todo: si se alterna medir y mover,
    // el navegador recalcula la página una vez por elemento y el scroll va a saltos
    const moves = [];
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const top = rect.top - parseFloat(el.dataset.shift || 0); // posición real, sin parallax
      if (rect.bottom < -200 || top > vh + 200) return;         // fuera de pantalla
      const offset = (top + rect.height / 2 - vh / 2) * parseFloat(el.dataset.parallax) * factor;
      moves.push([el, (-offset).toFixed(1)]);
    });
    moves.forEach(([el, shift]) => {
      el.dataset.shift = shift;
      el.style.translate = `0 ${shift}px`;
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

  // La línea del contador marca el tiempo: cuando termina de llenarse, pasa a la siguiente.
  // Así la línea y el cambio de habitación van siempre sincronizados.
  progress.addEventListener('animationend', () => (busy ? restartProgress() : go(1)));

  function restart() {
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
// Duplica las fotos y mueve la pista desde aquí, fotograma a fotograma: al llegar a la
// mitad vuelve al inicio sin que se note. Velocidad: --strip-time (lo que tarda media pista).
// Se hace con JS y no con animación CSS porque Safari, con una pista tan ancha, dejaba
// huecos en blanco o daba tirones al hacer scroll.
// Sirve para todos los carruseles .strip (Home, El hotel, Sobre Córdoba).
(function () {
  const time = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--strip-time')) || 120) * 1000;
  const strips = [...document.querySelectorAll('.strip')].map((strip) => {
    const track = strip.querySelector('.strip__track');
    [...track.children].forEach((img) => {
      const copy = img.cloneNode();
      copy.alt = '';
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
    return { strip, track, half: 0, visible: true };
  });
  if (!strips.length) return;

  // media pista + media separación: lo que recorre en una vuelta
  const measure = () => strips.forEach((s) => {
    const gap = parseFloat(getComputedStyle(s.track).columnGap) || 0;
    s.half = (s.track.scrollWidth + gap) / 2;
  });
  measure();
  window.addEventListener('load', measure);
  window.addEventListener('resize', measure);

  // fuera de pantalla no se calcula nada (al volver sigue donde iba: no se nota)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const s = strips.find((x) => x.strip === e.target);
      if (s) s.visible = e.isIntersecting;
    }));
    strips.forEach((s) => io.observe(s.strip));
  }

  const start = performance.now();
  const frame = (now) => {
    strips.forEach((s) => {
      if (!s.visible || !s.half) return;
      const x = (((now - start) / time) % 1) * s.half;
      s.track.style.transform = `translate3d(${-x.toFixed(2)}px, 0, 0)`;
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
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

// ---------- Hero: se oscurece y funde navegación, logo e idioma al taparlo ----------
// 0 arriba del todo → 1 cuando la sección siguiente cubre el hero por completo.
// En páginas sin hero (Sobre Córdoba) se mide con el alto de la pantalla.
(function () {
  const hero = document.querySelector('.hero');
  const targets = document.querySelectorAll('.header__meta, .header__lang, .hero__slides');
  let ticking = false;
  const update = () => {
    const height = hero ? hero.offsetHeight : window.innerHeight;
    const progress = Math.min(Math.max(window.scrollY / height, 0), 1);
    // solo en los elementos que lo usan: ponerlo en <html> obligaba a recalcular toda la página en cada scroll
    targets.forEach((el) => el.style.setProperty('--hero-cover', progress.toFixed(3)));
    // tapado del todo: se oculta para que Safari deje de pintar el zoom de las fotos
    if (hero) hero.classList.toggle('is-covered', progress >= 1);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Habitaciones: el pase tapa el texto de entrada ----------
// --rooms-cover: 0 cuando el pase asoma por abajo → 1 cuando ocupa toda la pantalla.
(function () {
  const section = document.querySelector('.rooms');
  const slider = document.getElementById('roomSlider');
  if (!section || !slider) return;
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    const progress = Math.min(Math.max(1 - slider.getBoundingClientRect().top / vh, 0), 1);
    section.style.setProperty('--rooms-cover', progress.toFixed(3));
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Preguntas frecuentes: acordeón ----------
// Cada pregunta se abre y se cierra por separado; la animación está en CSS (--faq-time).
(function () {
  const toggles = document.querySelectorAll('.faq__toggle');
  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') !== 'true');
    });
  });
})();

// ---------- Galería de habitaciones ----------
// "Ver galería" lleva la lista de fotos en data-gallery; el nombre y los datos se toman de su ficha.
// Se cierra con "Cerrar" o Escape; flechas del teclado y deslizar con el dedo para cambiar de foto.
(function () {
  const dialog = document.getElementById('gallery');
  const buttons = document.querySelectorAll('[data-gallery]');
  if (!dialog || !buttons.length) return;

  const img = dialog.querySelector('.gallery__img');
  const name = dialog.querySelector('.gallery__name');
  const details = dialog.querySelector('.gallery__details');
  const thumbs = dialog.querySelector('.gallery__thumbs');
  const FADE = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gallery-fade')) * 1000 || 500;
  let photos = [];
  let current = 0;

  function show(index, animate) {
    current = (index + photos.length) % photos.length;
    [...thumbs.children].forEach((t, i) => t.setAttribute('aria-current', i === current));
    thumbs.children[current].scrollIntoView({ block: 'nearest', inline: 'center' });
    const swap = () => {
      img.src = photos[current];
      img.alt = `${name.textContent}, foto ${current + 1} de ${photos.length}`;
      img.classList.remove('is-changing');
    };
    if (!animate) return swap();
    img.classList.add('is-changing');
    setTimeout(swap, FADE);
  }

  function open(btn) {
    const card = btn.closest('.room-card');
    photos = btn.dataset.gallery.split(',');
    name.textContent = card.querySelector('.room-card__name').textContent;
    details.textContent = card.querySelector('.room-card__details').textContent;
    thumbs.innerHTML = '';
    photos.forEach((src, i) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.setAttribute('aria-label', `Foto ${i + 1}`);
      t.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
      t.addEventListener('click', () => i !== current && show(i, true));
      thumbs.appendChild(t);
    });
    dialog.showModal();
    dialog.focus(); // sin marco de foco sobre "Cerrar" al abrir
    document.body.classList.add('no-scroll');
    show(0, false);
    requestAnimationFrame(() => dialog.classList.add('is-visible'));
  }

  function close() {
    dialog.classList.remove('is-visible');
    setTimeout(() => {
      dialog.close();
      document.body.classList.remove('no-scroll');
    }, FADE);
  }

  buttons.forEach((btn) => btn.addEventListener('click', () => open(btn)));
  dialog.querySelector('[data-close]').addEventListener('click', close);
  dialog.querySelectorAll('[data-dir]').forEach((b) => {
    b.addEventListener('click', () => show(current + Number(b.dataset.dir), true));
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); }); // Escape con fundido
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1, true);
    if (e.key === 'ArrowRight') show(current + 1, true);
  });

  let startX = null;
  dialog.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), true);
    startX = null;
  });
})();

// ---------- Logo: blanco sobre fotos y fondos oscuros, oscuro sobre fondos claros ----------
// Las zonas oscuras llevan data-dark en el HTML; se mira qué hay debajo del logo al hacer scroll.
(function () {
  const logo = document.querySelector('.hero__logo');
  const img = logo && logo.querySelector('img[data-dark-src]');
  if (!img) return;
  const light = img.getAttribute('src');
  const dark = img.dataset.darkSrc;
  let ticking = false;

  const update = () => {
    const r = logo.getBoundingClientRect();
    const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      .find((el) => !logo.contains(el) && el !== logo && !el.closest('.header, .loader, .menu')); // la cortina de carga y el menú no cuentan
    const onDark = !under || !!under.closest('[data-dark]');
    const src = onDark ? light : dark;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- El hotel: relato de Gerardo Holgado ----------
// El botón "+" despliega y recoge el relato; la animación está en CSS (--faq-time).
(function () {
  const btn = document.querySelector('.founder__more');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') !== 'true');
  });
})();


// ---------- Menú desplegable ----------
// El botón "Menú" abre el menú a pantalla completa y pasa a "Cerrar"; Esc también lo cierra.
(function () {
  const btn = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Cerrar' : 'Menú';
    menu.setAttribute('aria-hidden', !open);
  };
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));

  // Al pasar por cada etiqueta se muestra la foto de esa página; al salir vuelve la hierba (Inicio)
  const imgs = [...menu.querySelectorAll('.menu__img')];
  const show = (page) => imgs.forEach((img) => img.classList.toggle('is-active', img.dataset.for === page));
  menu.querySelectorAll('.menu__nav a').forEach((link) => {
    const page = link.getAttribute('href');
    link.addEventListener('mouseenter', () => show(page));
    link.addEventListener('focus', () => show(page));
  });
  menu.querySelector('.menu__nav').addEventListener('mouseleave', () => show('index.html'));
  imgs.forEach((img) => { img.loading = 'eager'; });   // cargadas de antemano: el cambio es inmediato
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();

// ---------- Pantalla de carga y paso entre páginas ----------
// 1ª visita de la sesión: pantalla vacía → se dibuja el símbolo línea a línea y aparece el texto →
// espera a que cargue la página
// y --loader-hold más → el símbolo se funde → la cortina sube.
// Resto de páginas: la cortina sube en cuanto carga. Al pulsar un enlace interno la cortina
// baja y, cuando ha terminado de bajar, se abre la página nueva.
(function () {
  const loader = document.querySelector('.loader');
  if (!loader) return;
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const ms = (name) => parseFloat(css.getPropertyValue(name)) * 1000 || 0;
  const wait = (t) => new Promise((resolve) => setTimeout(resolve, t));
  const loaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });

  let first = true;
  try {
    first = !sessionStorage.getItem('v10-intro');
    sessionStorage.setItem('v10-intro', '1');
  } catch (e) {}

  const open = () => { loader.classList.add('is-open'); root.classList.remove('is-loading'); };
  root.classList.add('is-loading');

  (async () => {
    if (first) {
      await wait(ms('--loader-mark-delay'));
      loader.classList.add('is-mark');
      // termina de dibujarse (líneas escalonadas + texto) y la página está cargada
      const drawn = 2 * ms('--loader-draw') + 14 * ms('--loader-draw-stagger') + ms('--loader-mark-fade'); // palillo + espigas
      await Promise.all([loaded, wait(drawn)]);
      await wait(ms('--loader-hold'));
      loader.classList.add('is-out');
      await wait(ms('--loader-mark-out'));
    } else {
      await loaded;
    }
    open();
  })();

  // Paso a otra página de la web
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || link.target) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('.html')) return;
    if (url.pathname === location.pathname && url.hash) return; // ancla en la misma página
    e.preventDefault();
    // solo baja la cortina; la página sigue visible debajo hasta que la tapa
    // (antes se ponía también .is-loading y el fondo verde aparecía de golpe dejando ver las fotos)
    loader.classList.remove('is-mark', 'is-out', 'is-open');
    wait(ms('--loader-time') + 100).then(() => { location.href = url.href; });
  });

  // Al volver con "atrás" el navegador puede recuperar la página con la cortina bajada
  window.addEventListener('pageshow', (e) => { if (e.persisted) open(); });
})();

// ---------- Vídeos en bucle (Vivir Viento 10) ----------
// Se reproducen solo mientras se ven: Safari a veces no los arranca solos con autoplay,
// y pararlos fuera de pantalla aligera el scroll.
(function () {
  const videos = document.querySelectorAll('video[autoplay]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    });
  });
  videos.forEach((v) => { v.muted = true; io.observe(v); });
})();
