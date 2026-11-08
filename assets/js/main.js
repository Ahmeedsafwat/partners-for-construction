(function () {
  const D = window.I18N;
  const PHONE = '201118161858';
  const CAT_IDS = ['all', 'aqua', 'pools', 'kids', 'sports', 'shades', 'furniture', 'structures'];

  let lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = (k, vars) => {
    let s = D[lang][k] !== undefined ? D[lang][k] : D.en[k];
    if (vars && typeof s === 'string') Object.keys(vars).forEach(v => s = s.replace('{' + v + '}', vars[v]));
    return s;
  };
  const CLIENTS = [
    ['palm-hills', 'Palm Hills'], ['tatweer', 'Tatweer Misr'], ['sodic', 'SODIC'], ['emaar-misr', 'Emaar Misr (Marassi)'],
    ['ahly', 'Al Ahly Sporting Club'], ['newgiza', 'New Giza'], ['orascom', 'Orascom Development'], ['hassan-allam', 'Hassan Allam'],
    ['pepsi', 'Pepsi'], ['jaz', 'Jaz Hotel Group'], ['fort-arabesque', 'Fort Arabesque Resort']
  ];
  // Arabic plural for "photos": 3-10 صور, 11+ صورة
  const photos = n => lang === 'ar' ? (n <= 10 ? `${n} صور` : `${n} صورة`) : `${n} photos`;
  const tTitle = s => (D[lang].titles && D[lang].titles[s]) || s;
  const tLoc = s => (s && D[lang].locations && D[lang].locations[s]) || s || '';

  // ---------- Project data ----------
  const COVERS = ['pepsi-2.jpg', 'maldives-3.jpg', 'new-giza-sporting-club-1.jpg', 'kids-kids-play-area-palm-hills-sporting-club-2.jpg'];
  const projects = (window.PROJECTS || []).map(p => {
    p.images = p.images.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    const c = p.images.findIndex(im => COVERS.some(k => im.src.includes(k)));
    if (c > 0) p.images.unshift(p.images.splice(c, 1)[0]);
    return p;
  });
  // Interleave categories so the "All" view shows a mix of work
  const byCat = CAT_IDS.slice(1).map(c => projects.filter(p => p.cat === c));
  const mixed = [];
  for (let i = 0; byCat.some(l => l[i]); i++) byCat.forEach(l => l[i] && mixed.push(l[i]));

  const LIMIT = 12;
  const filters = document.querySelector('.filters');
  const grid = document.getElementById('grid');
  const more = document.getElementById('more');
  let curCat = 'all', showAll = false;

  function buildFilters() {
    filters.innerHTML = '';
    CAT_IDS.forEach(id => {
      const n = id === 'all' ? projects.length : projects.filter(p => p.cat === id).length;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'tab'); b.dataset.cat = id;
      b.setAttribute('aria-selected', id === curCat);
      b.innerHTML = `${t('cat.' + id)}<b>${n}</b>`;
      b.addEventListener('click', () => render(id, false));
      filters.appendChild(b);
    });
  }

  function render(cat, all) {
    curCat = cat; showAll = !!all;
    filters.querySelectorAll('.chip').forEach(ch => ch.setAttribute('aria-selected', ch.dataset.cat === cat));
    let list = cat === 'all' ? mixed : projects.filter(p => p.cat === cat);
    const total = list.length;
    if (!showAll && total > LIMIT) list = list.slice(0, LIMIT);
    more.hidden = list.length === total;
    more.textContent = t('prj.more', { n: total });
    grid.innerHTML = '';
    list.forEach((p, i) => {
      const cover = p.images[0];
      const title = tTitle(p.title), loc = tLoc(p.location);
      const el = document.createElement('article');
      el.className = 'card'; el.tabIndex = 0;
      el.style.animationDelay = Math.min(i, 12) * 40 + 'ms';
      el.innerHTML = `<img src="${cover.src}" width="${cover.w}" height="${cover.h}" alt="${title}${lang === 'ar' ? '، ' : ', '}${loc}" loading="lazy">
        ${p.images.length > 1 ? `<span class="card__count">${photos(p.images.length)}</span>` : ''}
        <div class="card__cap"><small>${t('tag.' + p.cat)}</small><h3>${title}</h3><p>${loc}</p></div>`;
      const open = () => openLb(p, 0);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
      grid.appendChild(el);
    });
  }
  more.addEventListener('click', () => render(curCat, true));

  // Service cards jump to filtered projects
  document.querySelectorAll('.svc').forEach(s => s.addEventListener('click', () => {
    render(s.dataset.filter, false);
    document.getElementById('projects').scrollIntoView();
  }));

  // ---------- Lightbox ----------
  const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg');
  let cur = null, idx = 0;
  function openLb(p, i) { cur = p; idx = i; show(); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb__close').focus(); }
  function show() {
    const im = cur.images[idx];
    lbImg.src = im.src; lbImg.alt = tTitle(cur.title);
    document.getElementById('lbTitle').textContent = tTitle(cur.title);
    document.getElementById('lbLoc').textContent = tLoc(cur.location);
    document.getElementById('lbCount').textContent = cur.images.length > 1 ? `${idx + 1} / ${cur.images.length}` : '';
    lb.querySelectorAll('.lb__nav').forEach(b => b.style.visibility = cur.images.length > 1 ? 'visible' : 'hidden');
  }
  function step(d) { idx = (idx + d + cur.images.length) % cur.images.length; show(); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; }
  const rtl = () => lang === 'ar';
  lb.querySelector('.lb__close').onclick = close;
  lb.querySelector('.lb__prev').onclick = () => step(-1);
  lb.querySelector('.lb__next').onclick = () => step(1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') step(rtl() ? -1 : 1);
    if (e.key === 'ArrowLeft') step(rtl() ? 1 : -1);
  });
  let tx = 0;
  lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) step((dx < 0) !== rtl() ? 1 : -1);
  });

  // ---------- Nav ----------
  const nav = document.querySelector('.nav'), burger = document.querySelector('.nav__burger');
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  document.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- Reveal on scroll ----------
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 }) : null;
  document.querySelectorAll('.sec-head, .svc, .about__img, .about__text, .steps li, .contact__info, .form').forEach(el => {
    if (io) { el.classList.add('reveal'); io.observe(el); }
  });

  // ---------- Quote form -> WhatsApp or email ----------
  let via = 'wa';
  document.querySelectorAll('.form button').forEach(b => b.addEventListener('click', () => via = b.dataset.via));
  document.getElementById('quote').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const text = `${t('msg.hello')}\n\n${t('msg.name')}: ${f.get('name')}\n${t('msg.phone')}: ${f.get('phone')}\n${t('msg.service')}: ${f.get('service')}\n\n${f.get('msg') || ''}`;
    if (via === 'mail') {
      location.href = `mailto:partnersforconstruction@gmail.com?subject=${encodeURIComponent(t('msg.subject') + f.get('service'))}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  });

  // ---------- Apply language ----------
  function applyLang(l, save) {
    lang = l;
    const html = document.documentElement;
    html.lang = l; html.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]').setAttribute('content', t('meta.desc'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => { const [a, k] = pair.split(':'); el.setAttribute(a, t(k)); });
    });
    // Client logos
    document.getElementById('logos').innerHTML = CLIENTS.map(c => {
      const name = (D[lang].clientNames && D[lang].clientNames[c[0]]) || c[1];
      return `<li title="${name}"><img src="assets/clients/${c[0]}.webp" alt="${name}" loading="lazy"></li>`;
    }).join('');
    // Form service options
    const sel = document.getElementById('svcSelect'), si = sel.selectedIndex;
    sel.innerHTML = t('form.opts').map(o => `<option>${o}</option>`).join('');
    if (si > 0) sel.selectedIndex = si;
    document.getElementById('heroWa').href = `https://wa.me/${PHONE}?text=${encodeURIComponent(t('wa.quote'))}`;
    document.getElementById('copy').textContent = t('ft.copy', { y: new Date().getFullYear() });
    buildFilters();
    render(curCat, showAll);
    if (cur && !lb.hidden) show();
    if (save) {
      try { localStorage.setItem('pfc-lang', l); } catch (e) {}
      const u = new URL(location.href); u.searchParams.set('lang', l);
      try { history.replaceState(null, '', u); } catch (e) {}
    }
  }
  document.getElementById('langBtn').addEventListener('click', () => applyLang(lang === 'ar' ? 'en' : 'ar', true));
  applyLang(lang, false);
})();
