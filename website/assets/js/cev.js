/* CEV Siargao · Bewegung, erster Blick, Leiste, Reservieren (Designstudie Tasty Studios, 22.11.2026)
   Handschrift (Website-Bau Kern 3): deckend von unten herein, sobald der Bereich den Rand berührt; Fotos zoomen in ihren Rahmen;
   Überschriften rollen zeilenweise aus dem Schlitz. Bewegung nur dieses Hauses: die Teller werden auf den Tisch gesetzt.
   Nur transform, nativer Scroll. Erster Blick: verdeckt, bis die Bilder im ersten Bildschirm geladen sind (nur load). */
(function () {
  var D = document, H = D.documentElement, ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1 Erster Blick */
  function imBild(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 2; }
  var schrift = !(D.fonts && D.fonts.load), bilder = false;
  if (!schrift) Promise.all([D.fonts.load('700 1em Archivo'), D.fonts.load('400 1em "DM Sans"')]).then(function () { schrift = true; if (bilder) zeigen(); }, function () { schrift = true; if (bilder) zeigen(); });
  function zeigen() {
    bilder = true; if (!schrift || H.classList.contains('bereit')) return;
    D.querySelectorAll('.kopf [data-schlitz], .wand [data-schlitz]').forEach(zeilen);
    H.classList.remove('laed');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      H.classList.add('bereit');
      D.querySelectorAll('.kopf [data-r], .kopf [data-schlitz], .kopf .bild, .wand [data-schlitz]').forEach(function (e) { e.classList.add('da'); });
      beobachten();
    }); });
  }
  function warten() {
    var erste = [].filter.call(D.querySelectorAll('img'), imBild);
    erste.forEach(function (i) { i.loading = 'eager'; i.decoding = 'sync'; });
    var offen = erste.filter(function (i) { return !(i.complete && i.naturalWidth); }).length;
    if (!offen) return zeigen();
    erste.forEach(function (i) {
      if (i.complete && i.naturalWidth) return;
      var f = function () { if (--offen <= 0) zeigen(); };
      i.addEventListener('load', f, { once: true }); i.addEventListener('error', f, { once: true });
    });
    setTimeout(zeigen, 5000);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', warten); else warten();

  /* 2 Überschriften in Zeilen (aus Bareiss, Teil 2) */
  function zeilen(h) {
    if (h.dataset.z || !(h.offsetParent || h.getClientRects().length)) return; h.dataset.z = '1';   /* ausgeblendete Überschriften erst beim Zeigen zerlegen */
    var woerter = [];
    (function lauf(k, ak) {
      k.childNodes.forEach(function (n) {
        if (n.nodeType === 3) n.textContent.split(/\s+/).forEach(function (w) { if (w) woerter.push({ t: w, ak: ak }); });
        else if (n.nodeName === 'BR') woerter.push({ br: 1 });
        else lauf(n, ak || (n.classList && n.classList.contains('rot')));
      });
    })(h, false);
    h.textContent = '';
    var spans = [];
    woerter.forEach(function (w) {
      if (w.br) { h.appendChild(D.createElement('br')); return; }
      var s = D.createElement('span'); s.textContent = w.t; s.style.whiteSpace = 'nowrap'; s._w = w;
      h.appendChild(s); h.appendChild(D.createTextNode(' ')); spans.push(s);
    });
    var rows = [], top = null;
    spans.forEach(function (s) { var t = s.offsetTop; if (top === null || Math.abs(t - top) > 4) { top = t; rows.push([]); } rows[rows.length - 1].push(s._w); });
    h.textContent = '';
    rows.forEach(function (r, i) {
      var z = D.createElement('span'); z.className = 'zl';
      var inn = D.createElement('span'); inn.className = 'zi'; inn.style.setProperty('--z', i);
      r.forEach(function (w, k) {
        var t = w.t + (k < r.length - 1 ? ' ' : '');
        if (w.ak) { var s = D.createElement('span'); s.className = 'rot'; s.textContent = t; inn.appendChild(s); }
        else inn.appendChild(D.createTextNode(t));
      });
      inn.normalize(); z.appendChild(inn); h.appendChild(z);
    });
  }

  window.cevZeilen = zeilen;

  /* 3 Auftritte: jedes Stück einzeln, sobald es selbst an den Rand kommt; Bilder vorher geholt und entpackt */
  function beobachten() {
    var ziele = D.querySelectorAll('[data-r]:not(.da),[data-teller]:not(.da),[data-schlitz]:not(.da),.bild:not(.da)');
    if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(function (e) { e.classList.add('da'); }); return; }
    var vor = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; vor.unobserve(e.target); e.target.loading = 'eager'; if (e.target.decode) e.target.decode().catch(function () {}); });
    }, { rootMargin: (innerWidth < 861 ? '300%' : '150%') + ' 0px 150% 0px' });
    D.querySelectorAll('img[loading=lazy]').forEach(function (i) { vor.observe(i); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, im = el.tagName === 'IMG' ? el : el.querySelector('img');
        var los = function () { if (el.classList.contains('da')) return; el.classList.add('da'); var z = el.querySelector('[data-zahl]'); if (z) zaehlen(z); };
        if (im && !(im.complete && im.naturalWidth)) { im.addEventListener('load', los, { once: true }); setTimeout(los, innerWidth < 861 ? 600 : 1800); } else los();
      });
    }, { rootMargin: innerWidth < 861 ? '0px 0px 6% 0px' : '0px 0px -6% 0px' });
    ziele.forEach(function (e) { if (e.hasAttribute('data-schlitz')) zeilen(e); io.observe(e); });
    /* Fenster: Bild und Satz stehen fest, der Satz steigt einmal hoch, wenn das Fenster aufgeht */
    var fo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); fo.unobserve(e.target); } }); }, { rootMargin: '0px 0px -35% 0px' });
    D.querySelectorAll('.fenster').forEach(function (f) { fo.observe(f); });
  }

  /* Hochzählen: grosse Zahl zählt einmal von 0 auf ihren Wert */
  function zaehlen(z) {
    var ziel = parseFloat(z.getAttribute('data-zahl')), st = null, dauer = 1300;
    if (ruhig) return;
    (function f(t) { if (st === null) st = t; var k = Math.min(1, (t - st) / dauer), e = 1 - Math.pow(1 - k, 3); z.textContent = (ziel * e).toFixed(z.hasAttribute('data-dez') ? +z.getAttribute('data-dez') : 1); if (k < 1) requestAnimationFrame(f); })(performance.now());
  }

  /* 4 Leiste: verschwindet beim Hinunterscrollen, kommt beim Hinaufscrollen zurück */
  var leiste = D.querySelector('.leiste'), alt = scrollY, tick = 0;
  addEventListener('scroll', function () {
    if (tick) return; tick = requestAnimationFrame(function () {
      tick = 0; var y = scrollY;
      if (leiste && !leiste.classList.contains('auf')) leiste.classList.toggle('weg', y > alt && y > 160);
      alt = y;
    });
  }, { passive: true });

  /* 4b Menü am Handy */
  var mk = D.querySelector('.menu-knopf');
  if (mk) {
    mk.addEventListener('click', function () { var auf = leiste.classList.toggle('auf'); mk.setAttribute('aria-expanded', auf); });
    D.querySelectorAll('.leiste__menu a').forEach(function (a) { a.addEventListener('click', function () { leiste.classList.remove('auf'); mk.setAttribute('aria-expanded', 'false'); }); });
  }

  /* 5 Reservieren: Fenster auf der Seite, Anfrage geht über WhatsApp an die Nummer des Hauses */
  var dlg = D.getElementById('res');
  if (dlg) {
    D.querySelectorAll('[data-res]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); if (!dlg.open) dlg.showModal(); }); });
    dlg.querySelector('.res__zu').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    var f = dlg.querySelector('form'), d = f.querySelector('[name=datum]');
    var heute = new Date(), iso = function (x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); };
    d.min = iso(heute); var mx = new Date(heute); mx.setDate(mx.getDate() + 120); d.max = iso(mx);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (f.querySelector('[name=' + n + ']').value || '').trim(); };
      if (!v('datum') || !v('zeit') || !v('gaeste') || !v('name')) { f.reportValidity && f.reportValidity(); return; }
      var tag = new Date(v('datum') + 'T12:00:00');
      var txt = 'Hi CEV, I would like to reserve a table.\n' +
        'Date: ' + tag.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '\n' +
        'Time: ' + v('zeit') + '\nGuests: ' + v('gaeste') + '\nName: ' + v('name') + (v('notiz') ? '\nNote: ' + v('notiz') : '');
      window.open('https://wa.me/639394008804?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      dlg.querySelector('.res__ok').classList.add('da');
    });
  }
})();
