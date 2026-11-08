(function () {
  const CATS = [
    { id: 'all', label: 'All projects' },
    { id: 'aqua', label: 'Aqua Parks & Water Slides' },
    { id: 'pools', label: 'Swimming Pools & Fountains' },
    { id: 'kids', label: 'Kids Play Areas' },
    { id: 'sports', label: 'Sports & Athletic Surfaces' },
    { id: 'shades', label: 'Shades & Pergolas' },
    { id: 'furniture', label: 'Site Furniture' },
    { id: 'structures', label: 'Outdoor Structures' }
  ];
  const SHORT = { aqua: 'Aqua Park', pools: 'Pools & Fountains', kids: 'Kids Area', sports: 'Sports', shades: 'Shades', furniture: 'Site Furniture', structures: 'Structures' };

  const COVERS = ['pepsi-2.jpg', 'maldives-3.jpg', 'new-giza-sporting-club-1.jpg', 'kids-kids-play-area-palm-hills-sporting-club-2.jpg'];
  const projects = (window.PROJECTS || []).map(p => {
    p.images = p.images.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    const c = p.images.findIndex(im => COVERS.some(k => im.src.includes(k)));
    if (c > 0) p.images.unshift(p.images.splice(c, 1)[0]);
    return p;
  });
  // Interleave categories so the "All" view shows a mix of work
  const byCat = CATS.slice(1).map(c => projects.filter(p => p.cat === c.id));
  const mixed = [];
  for (let i = 0; byCat.some(l => l[i]); i++) byCat.forEach(l => l[i] && mixed.push(l[i]));
  const LIMIT = 12;
  const more = document.getElementById('more');

  // Filters
  const filters = document.querySelector('.filters');
  const grid = document.getElementById('grid');
  CATS.forEach(c => {
    const n = c.id === 'all' ? projects.length : projects.filter(p => p.cat === c.id).length;
    const b = document.createElement('button');
    b.className = 'chip'; b.setAttribute('role', 'tab'); b.dataset.cat = c.id;
    b.setAttribute('aria-selected', c.id === 'all');
    b.innerHTML = `${c.label}<b>${n}</b>`;
    b.addEventListener('click', () => render(c.id));
    filters.appendChild(b);
  });

  function render(cat, all) {
    filters.querySelectorAll('.chip').forEach(ch => ch.setAttribute('aria-selected', ch.dataset.cat === cat));
    let list = cat === 'all' ? mixed : projects.filter(p => p.cat === cat);
    const total = list.length;
    if (!all && total > LIMIT) list = list.slice(0, LIMIT);
    more.hidden = list.length === total;
    more.textContent = `Show all ${total} projects`;
    more.onclick = () => render(cat, true);
    grid.innerHTML = '';
    list.forEach((p, i) => {
      const cover = p.images[0];
      const el = document.createElement('article');
      el.className = 'card'; el.tabIndex = 0;
      el.style.animationDelay = Math.min(i, 12) * 40 + 'ms';
      el.innerHTML = `<img src="${cover.src}" width="${cover.w}" height="${cover.h}" alt="${p.title}, ${p.location}" loading="lazy">
        ${p.images.length > 1 ? `<span class="card__count">${p.images.length} photos</span>` : ''}
        <div class="card__cap"><small>${SHORT[p.cat]}</small><h3>${p.title}</h3><p>${p.location || ''}</p></div>`;
      const open = () => openLb(p, 0);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
      grid.appendChild(el);
    });
  }
  render('all');

  // Service cards jump to filtered projects
  document.querySelectorAll('.svc').forEach(s => s.addEventListener('click', () => {
    render(s.dataset.filter);
    document.getElementById('projects').scrollIntoView();
  }));

  // Lightbox
  const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg');
  let cur = null, idx = 0;
  function openLb(p, i) { cur = p; idx = i; show(); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb__close').focus(); }
  function show() {
    const im = cur.images[idx];
    lbImg.src = im.src; lbImg.alt = `${cur.title}, ${cur.location}`;
    document.getElementById('lbTitle').textContent = cur.title;
    document.getElementById('lbLoc').textContent = cur.location || '';
    document.getElementById('lbCount').textContent = cur.images.length > 1 ? `${idx + 1} / ${cur.images.length}` : '';
    lb.querySelectorAll('.lb__nav').forEach(b => b.style.visibility = cur.images.length > 1 ? 'visible' : 'hidden');
  }
  function step(d) { idx = (idx + d + cur.images.length) % cur.images.length; show(); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; }
  lb.querySelector('.lb__close').onclick = close;
  lb.querySelector('.lb__prev').onclick = () => step(-1);
  lb.querySelector('.lb__next').onclick = () => step(1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  let tx = 0;
  lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });

  // Nav
  const nav = document.querySelector('.nav'), burger = document.querySelector('.nav__burger');
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  document.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Marquee: duplicate for seamless loop
  const track = document.querySelector('.marquee__track');
  track.innerHTML += track.innerHTML;

  // Reveal on scroll
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 }) : null;
  document.querySelectorAll('.sec-head, .svc, .about__img, .about__text, .steps li, .contact__info, .form').forEach(el => {
    if (io) { el.classList.add('reveal'); io.observe(el); }
  });

  // Quote form -> WhatsApp or email
  let via = 'wa';
  document.querySelectorAll('.form button').forEach(b => b.addEventListener('click', () => via = b.dataset.via));
  document.getElementById('quote').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const text = `Hello Partners for Construction,\n\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nService: ${f.get('service')}\n\n${f.get('msg') || ''}`;
    if (via === 'mail') {
      location.href = `mailto:partnersforconstruction@gmail.com?subject=${encodeURIComponent('Quote request: ' + f.get('service'))}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/201118161858?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  });

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
