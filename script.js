// =====================================================================
//  All site content lives in content.json — edit it in the dashboard
//  (Pages CMS). This file only turns that content into the page.
// =====================================================================

// ===== Navigation =====
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
  document.querySelector('.menu-toggle').classList.toggle('active');
}
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
    document.querySelector('.menu-toggle').classList.remove('active');
  });
});

// ===== Scroll fade-in =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== Helpers =====
// The dashboard may save image paths as "/images/x.jpg"; make them relative
// so the site works both on a custom domain and on username.github.io/repo/.
function asset(p) { return (p || '').replace(/^\/+/, ''); }
function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function img(src, alt) {
  var i = document.createElement('img');
  i.src = asset(src); i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async';
  return i;
}
function get(obj, path) {
  return path.split('.').reduce(function (o, k) { return o ? o[k] : undefined; }, obj);
}

// Portfolio tabs, in this order. Only tabs that have projects are shown.
var CATEGORIES = [
  { id: 'logos',    label: 'Logos' },
  { id: 'branding', label: 'Brand Identity' },
  { id: 'social',   label: 'Social Media' },
  { id: 'catalog',  label: 'Catalogs' }
];
var CONTACT_TYPES = {
  email:    { label: 'Email',    icon: '✉️', href: function (v) { return 'mailto:' + v.trim(); } },
  whatsapp: { label: 'WhatsApp', icon: '💬', href: function (v) { return 'https://wa.me/' + v.replace(/\D/g, ''); }, blank: true },
  phone:    { label: 'Phone',    icon: '📞', href: function (v) { return 'tel:+' + v.replace(/\D/g, ''); } },
  mobile:   { label: 'Phone',    icon: '📱', href: function (v) { return 'tel:+' + v.replace(/\D/g, ''); } },
  link:     { label: 'Link',     icon: '🔗', href: function (v) { return v.trim(); }, blank: true }
};

var PROJECTS = {};

// ===== Build the page from content.json =====
function render(c) {
  var site = c.site || {}, hero = c.hero || {};
  if (site.pageTitle) document.title = site.pageTitle;

  document.querySelectorAll('[data-text]').forEach(function (n) {
    var v = get(c, n.getAttribute('data-text'));
    n.textContent = v == null ? '' : v;
  });

  // Hero name: "FIRST <span>LAST</span>"
  var hn = document.getElementById('heroName');
  hn.textContent = (hero.firstName || '') + ' ';
  hn.appendChild(el('span', null, hero.lastName || ''));

  var photo = document.getElementById('profileImg');
  photo.src = asset(hero.photo); photo.alt = (hero.firstName || '') + ' ' + (hero.lastName || '');

  var cv = document.getElementById('cvBtn');
  if (hero.cv) { cv.href = asset(hero.cv); cv.setAttribute('download', asset(hero.cv).split('/').pop()); }
  else cv.style.display = 'none';

  // Stats
  var stats = document.getElementById('heroStats');
  (c.stats || []).forEach(function (s) {
    var st = el('div', 'stat');
    var num = el('div', 'stat-num', '0');
    num.setAttribute('data-target', s.number || 0);
    num.setAttribute('data-suffix', s.suffix || '');
    st.appendChild(num);
    st.appendChild(el('div', 'stat-label', s.label));
    stats.appendChild(st);
  });

  // Skills
  var skills = document.getElementById('skillsGrid');
  (c.skills || []).forEach(function (s) {
    var card = el('div', 'skill-card');
    var ic = el('div', 'skill-icon');
    if (s.icon) ic.appendChild(img(s.icon, s.name));
    card.appendChild(ic);
    card.appendChild(el('div', 'skill-name', s.name));
    card.appendChild(el('div', 'skill-level', s.level));
    skills.appendChild(card);
  });

  // Services (numbered automatically)
  var services = document.getElementById('servicesList');
  (c.services || []).forEach(function (s, i) {
    var row = el('article', 'service-row');
    row.appendChild(el('span', 'service-num', String(i + 1).padStart(2, '0')));
    var body = el('div', 'service-body');
    body.appendChild(el('h3', null, s.title));
    body.appendChild(el('p', null, s.description));
    row.appendChild(body);
    services.appendChild(row);
  });

  // Portfolio
  var grid = document.getElementById('portfolioGrid');
  var used = {};
  (c.projects || []).forEach(function (p, i) {
    var images = (p.images || []).filter(Boolean);
    if (!images.length) return;
    var id = 'p' + i, n = images.length, viewer = p.viewer || 'single';
    var countText = viewer === 'grid' ? n + ' posts' : n + ' Pages';
    var sub = p.subtitle || '';
    if (viewer !== 'single' && n > 1) sub += (viewer === 'grid' ? ' — ' : ' · ') + countText;
    PROJECTS[id] = { title: p.title, sub: sub, kind: viewer, images: images.map(asset) };
    used[p.category] = true;

    var badge = viewer === 'grid' ? n + ' Posts'
              : viewer === 'flipbook' ? 'Flipbook'
              : p.category === 'logos' ? 'Logo' : 'View';

    var item = el('div', 'portfolio-item');
    item.dataset.cat = p.category;
    item.onclick = function () { openProject(id); };
    var thumb = el('div', 'portfolio-thumb' + (p.category === 'logos' ? ' logo-thumb' : ''));
    thumb.appendChild(img(p.thumbnail || images[0], p.title));
    thumb.appendChild(el('span', 'thumb-badge', badge));
    var info = el('div', 'portfolio-info');
    info.appendChild(el('h3', null, p.title));
    info.appendChild(el('p', null, sub));
    item.appendChild(thumb); item.appendChild(info);
    grid.appendChild(item);
  });

  var tabs = document.getElementById('portfolioTabs');
  var first = null;
  CATEGORIES.forEach(function (cat) {
    if (!used[cat.id]) return;
    var b = el('button', 'tab-btn', cat.label);
    b.onclick = function () { filterWork(cat.id, b); };
    tabs.appendChild(b);
    if (!first) first = { id: cat.id, btn: b };
  });
  if (first) filterWork(first.id, first.btn);

  // Contact
  var contact = document.getElementById('contactGrid');
  (c.contact || []).forEach(function (ct) {
    var t = CONTACT_TYPES[ct.type] || CONTACT_TYPES.link;
    var a = el('a', 'contact-card');
    a.href = t.href(ct.value || '');
    if (t.blank) a.target = '_blank';
    a.appendChild(el('div', 'contact-icon', t.icon));
    a.appendChild(el('div', 'contact-label', ct.label || t.label));
    a.appendChild(el('div', 'contact-value', ct.value));
    contact.appendChild(a);
  });

  // Footer (year updates automatically)
  var f = document.getElementById('footer');
  f.textContent = '© ' + new Date().getFullYear() + ' ';
  f.appendChild(el('span', null, site.footerName || ''));
  f.appendChild(document.createTextNode(' — All Rights Reserved'));

  startStats();
}

// ===== Tab filter =====
function filterWork(cat, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.portfolio-item').forEach(item => {
    item.style.display = (cat === 'all' || item.dataset.cat === cat) ? '' : 'none';
  });
}

// ===== Animated stat counters =====
function animateCount(el) {
  var target = parseInt(el.getAttribute('data-target'), 10) || 0;
  var suffix = el.getAttribute('data-suffix') || '';
  var dur = 1600, start = null;
  function step(ts) {
    if (!start) start = ts;
    var prog = Math.min((ts - start) / dur, 1);
    var eased = 1 - Math.pow(1 - prog, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (prog < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}
function startStats() {
  var stats = document.getElementById('heroStats');
  if (!stats) return;
  var done = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !done) {
        done = true;
        stats.querySelectorAll('.stat-num[data-target]').forEach(animateCount);
        io.disconnect();
      }
    });
  }, { threshold: 0.4 });
  io.observe(stats);
}

// ===== Load content =====
fetch('content.json', { cache: 'no-cache' })
  .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(render)
  .catch(function (err) {
    console.error('Could not load content.json', err);
    document.getElementById('portfolioGrid').textContent =
      'Content could not be loaded. (If you opened index.html straight from your computer, use a local server or view the live site.)';
  });

// ===== Unified Project Viewer =====
var V = { id:null, kind:null, images:[], idx:0 };

function openProject(id) {
  var p = PROJECTS[id];
  if (!p) return;
  V.id = id; V.kind = p.kind; V.images = p.images.slice(); V.idx = 0;
  document.getElementById('viewerTitle').textContent = p.title;
  document.getElementById('viewerSub').textContent = p.sub;

  var stage = document.getElementById('viewerStage');
  var flip  = document.getElementById('flipStage');
  var scroll = document.getElementById('scrollStage');
  var grid  = document.getElementById('gridStage');

  // reset all stages
  stage.style.display = 'none';
  flip.style.display = 'none';
  scroll.style.display = 'none';
  grid.style.display = 'none';

  if (p.kind === 'flipbook') {
    flip.style.display = 'flex';
    flipRender();
  } else if (p.kind === 'scroll') {
    scroll.style.display = 'block';
    scroll.scrollTop = 0;
    scrollRender();
  } else if (p.kind === 'grid') {
    grid.style.display = 'grid';
    grid.scrollTop = 0;
    gridRender();
  } else {
    stage.style.display = 'flex';
    // hide nav arrows for single-image projects
    var single = V.images.length <= 1;
    document.querySelectorAll('#viewerStage .viewer-nav').forEach(b => b.style.display = single ? 'none' : '');
    galleryRender();
  }
  document.getElementById('viewer').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ---- grid mode (social: all thumbnails at once) ----
function gridRender() {
  var c = document.getElementById('gridStage');
  c.innerHTML = '';
  V.images.forEach(function(src, i){
    var cell = document.createElement('div');
    cell.className = 'grid-cell';
    var im = document.createElement('img');
    im.src = src;
    im.alt = 'Post ' + (i+1);
    im.loading = 'lazy';
    im.decoding = 'async';
    cell.appendChild(im);
    cell.onclick = function(){ openImgLightbox(src); };
    c.appendChild(cell);
  });
  document.getElementById('viewerCounter').textContent = V.images.length + ' posts';
}

// ---- image lightbox (popped from grid) ----
function openImgLightbox(src) {
  var lb = document.getElementById('imgLightbox');
  document.getElementById('imgLightboxImg').src = src;
  lb.classList.add('active');
}
function closeImgLightbox(e) {
  // close on backdrop or close button
  if (e.target === document.getElementById('imgLightbox') ||
      e.target.classList.contains('imglightbox-close')) {
    document.getElementById('imgLightbox').classList.remove('active');
  }
}

// ---- scroll mode (identity decks: all pages stacked vertically) ----
function scrollRender() {
  var c = document.getElementById('scrollStage');
  c.innerHTML = '';
  V.images.forEach(function(src, i){
    var im = document.createElement('img');
    im.src = src;
    im.alt = 'Page ' + (i+1);
    im.className = 'scroll-page';
    im.loading = 'lazy';
    im.decoding = 'async';
    c.appendChild(im);
  });
  document.getElementById('viewerCounter').textContent = V.images.length + ' pages';
}

function closeViewer() {
  document.getElementById('viewer').classList.remove('active');
  document.body.style.overflow = '';
}
function viewerBackdrop(e) {
  if (e.target === document.getElementById('viewer')) closeViewer();
}

// ---- gallery / single ----
function galleryRender() {
  var img = document.getElementById('viewerImg');
  img.src = V.images[V.idx];
  document.getElementById('viewerCounter').textContent =
    V.images.length > 1 ? (V.idx + 1) + ' / ' + V.images.length : '';
}
function viewerNav(dir) {
  V.idx = (V.idx + dir + V.images.length) % V.images.length;
  galleryRender();
}

// ---- flipbook (two-page spread) ----
// Desktop: cover (page 1) alone on the right, then spreads [2-3],[4-5]...
//   modeled as: spread 0 = [null, p1]; spread k = [p(2k), p(2k+1)]
// Mobile (<=600px): single page per view -> [null, p(idx)]
function isMobileFlip() {
  return window.matchMedia('(max-width: 600px)').matches;
}
function flipSpreads() {
  var imgs = V.images, spreads = [];
  if (isMobileFlip()) {
    for (var j = 0; j < imgs.length; j++) spreads.push([null, imgs[j]]);
    return spreads;
  }
  spreads.push([null, imgs[0]]);              // cover on the right
  for (var i = 1; i < imgs.length; i += 2) {
    spreads.push([imgs[i], imgs[i+1] || null]);
  }
  return spreads;
}
function flipRender() {
  var spreads = flipSpreads();
  if (V.idx < 0) V.idx = 0;
  if (V.idx >= spreads.length) V.idx = spreads.length - 1;
  var sp = spreads[V.idx];
  var L = document.getElementById('flipLeft');
  var R = document.getElementById('flipRight');
  var Lp = L.parentElement, Rp = R.parentElement;
  if (sp[0]) { L.src = sp[0]; Lp.style.visibility = 'visible'; }
  else { L.removeAttribute('src'); Lp.style.visibility = 'hidden'; }
  if (sp[1]) { R.src = sp[1]; Rp.style.visibility = 'visible'; }
  else { R.removeAttribute('src'); Rp.style.visibility = 'hidden'; }
  // page label
  var first = sp[0] ? V.images.indexOf(sp[0]) + 1 : (sp[1] ? V.images.indexOf(sp[1]) + 1 : 1);
  var last  = sp[1] ? V.images.indexOf(sp[1]) + 1 : first;
  document.getElementById('viewerCounter').textContent =
    (first === last ? first : first + '–' + last) + ' / ' + V.images.length;
}
function flipNav(dir) {
  var spreads = flipSpreads();
  V.idx = Math.min(Math.max(V.idx + dir, 0), spreads.length - 1);
  flipRender();
}

// ===== Re-render flipbook on viewport change =====
var _rsz;
window.addEventListener('resize', function(){
  clearTimeout(_rsz);
  _rsz = setTimeout(function(){
    var v = document.getElementById('viewer');
    if (v.classList.contains('active') && V.kind === 'flipbook') flipRender();
  }, 150);
});

// ===== Keyboard controls =====
document.addEventListener('keydown', (e) => {
  // image lightbox takes priority
  var lb = document.getElementById('imgLightbox');
  if (lb.classList.contains('active')) {
    if (e.key === 'Escape') lb.classList.remove('active');
    return;
  }
  if (!document.getElementById('viewer').classList.contains('active')) return;
  if (e.key === 'Escape') closeViewer();
  else if (V.kind === 'scroll' || V.kind === 'grid') { return; }
  else if (e.key === 'ArrowLeft')  { V.kind === 'flipbook' ? flipNav(-1) : (V.images.length>1 && viewerNav(-1)); }
  else if (e.key === 'ArrowRight') { V.kind === 'flipbook' ? flipNav(1)  : (V.images.length>1 && viewerNav(1)); }
});

// ===== Touch swipe (mobile) =====
(function(){
  var x0 = null;
  var v = document.getElementById('viewer');
  v.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, {passive:true});
  v.addEventListener('touchend', e => {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) {
      if (V.kind === 'scroll' || V.kind === 'grid') { x0 = null; return; }
      var dir = dx < 0 ? 1 : -1;
      V.kind === 'flipbook' ? flipNav(dir) : (V.images.length>1 && viewerNav(dir));
    }
    x0 = null;
  }, {passive:true});
})();
