/* Cafe Trotzdem - Chrome/Interaktion (Vanilla, kein Framework) */
(function(){
  'use strict';
  var nav = document.getElementById('nav');
  var isSub = document.body.classList.contains('sub');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav: transparent -> solid ab Scroll (nur auf Seiten mit Hero) */
  function onScroll(){ if(nav && !isSub) nav.classList.toggle('scrolled', window.scrollY > 30); }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  /* ---- Mobile-Menue: Vollglas-Panel, Header blendet aus, Logo+X im Panel ---- */
  var burger = document.getElementById('burger'),
      mmenu  = document.getElementById('mmenu'),
      mclose = document.getElementById('mclose');

  function lockScroll(){
    var sw = window.innerWidth - document.documentElement.clientWidth;
    if(sw > 0) document.body.style.paddingRight = sw + 'px';
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll(){ document.body.style.overflow=''; document.body.style.paddingRight=''; }

  function openMenu(){ mmenu.classList.add('open'); nav.classList.add('menu-open'); mmenu.removeAttribute('inert'); burger.setAttribute('aria-expanded','true'); lockScroll(); }
  function closeMenu(){ mmenu.classList.remove('open'); nav.classList.remove('menu-open'); mmenu.setAttribute('inert',''); burger.setAttribute('aria-expanded','false'); unlockScroll(); }

  if(burger){ burger.addEventListener('click', openMenu); }
  if(mclose){ mclose.addEventListener('click', closeMenu); }
  if(mmenu){ mmenu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); }); }
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && mmenu && mmenu.classList.contains('open')) closeMenu(); });

  /* Swipe nach rechts (Herkunftsrichtung) schliesst das Menue */
  if(mmenu){
    var msx=0, msy=0, mtrack=false;
    mmenu.addEventListener('touchstart', function(e){ msx=e.touches[0].clientX; msy=e.touches[0].clientY; mtrack=true; }, {passive:true});
    mmenu.addEventListener('touchmove', function(e){
      if(!mtrack) return;
      var dx=e.touches[0].clientX-msx, dy=e.touches[0].clientY-msy;
      if(dx>60 && Math.abs(dx)>Math.abs(dy)){ mtrack=false; closeMenu(); }
    }, {passive:true});
    mmenu.addEventListener('touchend', function(){ mtrack=false; });
  }

  /* Smooth-Scroll mit Nav-Offset. Behandelt "/" und "/index.html" als dieselbe Seite,
     damit Anker auf der Startseite sanft scrollen statt neu zu laden. */
  var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
  function samePage(p){ return p.replace(/\/index\.html$/,'/').replace(/\/$/,''); }
  document.querySelectorAll('a[href*="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var url; try{ url = new URL(a.href, location.href); }catch(err){ return; }
      if(samePage(url.pathname) !== samePage(location.pathname) || !url.hash) return;
      var el = document.querySelector(url.hash); if(!el) return;
      e.preventDefault();
      var y = el.getBoundingClientRect().top + window.scrollY - (navH - 4);
      window.scrollTo({ top: (url.hash==='#hero'||url.hash==='#top')?0:y, behavior: reduce?'auto':'smooth' });
      history.replaceState(null,'',url.hash);
    });
  });

  /* Reveal-on-scroll */
  if(!reduce && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }

  /* Hero-Parallax 50% (Desktop + Mobil, rAF-gedrosselt, GPU-Compositing) */
  var heroBg = document.getElementById('heroBg'), ticking=false;
  if(heroBg && !reduce){
    var park = function(){ heroBg.style.transform = 'translate3d(0,' + (window.scrollY*0.5) + 'px,0)'; ticking=false; };
    window.addEventListener('scroll', function(){ if(ticking) return; ticking=true; requestAnimationFrame(park); }, {passive:true});
    park();
  }

  /* Demo-Leiste: Disclaimer erscheint bei JEDEM Laden (Slide-in). Das X blendet nur
     die aktuelle Ansicht aus - bewusst NICHT dauerhaft merken (Reload zeigt ihn wieder). */
  var demobar = document.getElementById('demobar'), dclose = document.getElementById('demoClose');
  if(dclose){ dclose.addEventListener('click', function(){ demobar.classList.add('hide'); }); }

  /* Scrollspy: aktive Sektion im Menue unterstreichen */
  var spyLinks = [].slice.call(document.querySelectorAll('.nav__links a[href*="#"]'));
  var spyMap = {};
  spyLinks.forEach(function(a){ var h=a.hash; if(h && h.length>1){ var s=document.querySelector(h); if(s) spyMap[h.slice(1)]=a; } });
  if('IntersectionObserver' in window && Object.keys(spyMap).length){
    var spyIo = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ spyLinks.forEach(function(a){ a.classList.remove('active'); }); var a=spyMap[en.target.id]; if(a) a.classList.add('active'); }
      });
    }, { rootMargin:'-45% 0px -50% 0px', threshold:0 });
    Object.keys(spyMap).forEach(function(id){ var s=document.getElementById(id); if(s) spyIo.observe(s); });
  }

  /* Lightbox fuer die Galerie */
  var lb=document.getElementById('lb'), lbImg=document.getElementById('lbImg');
  var gpics=[].slice.call(document.querySelectorAll('.gallery picture'));
  if(lb && lbImg && gpics.length){
    var shots = gpics.map(function(p){ var im=p.querySelector('img'); return { src:(im.currentSrc||im.src), alt:im.alt }; });
    var cur=0;
    function showLb(i){ cur=(i+shots.length)%shots.length; lbImg.src=shots[cur].src; lbImg.alt=shots[cur].alt; }
    function openLb(i){ showLb(i); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
    function closeLb(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    gpics.forEach(function(p,i){ p.addEventListener('click', function(){ openLb(i); }); });
    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', function(e){ e.stopPropagation(); showLb(cur-1); });
    document.getElementById('lbNext').addEventListener('click', function(e){ e.stopPropagation(); showLb(cur+1); });
    lb.addEventListener('click', function(e){ if(e.target===lb) closeLb(); });
    document.addEventListener('keydown', function(e){ if(!lb.classList.contains('open')) return;
      if(e.key==='Escape') closeLb(); else if(e.key==='ArrowLeft') showLb(cur-1); else if(e.key==='ArrowRight') showLb(cur+1); });
  }

  /* Hero-Ribbon: mobiler Auto-Marquee, per Finger schiebbar */
  (function(){
    var ribbon = document.querySelector('.ribbon'); if(!ribbon) return;
    var mq = window.matchMedia('(max-width:700px)');
    var track=null, built=false, offset=0, half=0, raf=0, dragging=false, sx=0, so=0;
    function build(){
      if(built) return;
      track=document.createElement('div'); track.className='ribbon__track';
      while(ribbon.firstChild) track.appendChild(ribbon.firstChild);
      [].slice.call(track.children).forEach(function(k){ var c=k.cloneNode(true); c.setAttribute('data-dup','1'); track.appendChild(c); });
      ribbon.appendChild(track); built=true; offset=0; half=track.scrollWidth/2;
    }
    function unbuild(){
      if(!built) return; cancelAnimationFrame(raf);
      [].slice.call(track.querySelectorAll('[data-dup]')).forEach(function(d){ d.remove(); });
      while(track.firstChild) ribbon.insertBefore(track.firstChild, track);
      track.remove(); track=null; built=false;
    }
    function frame(){
      if(!dragging && !reduce) offset -= 0.4;
      if(offset <= -half) offset += half; if(offset > 0) offset -= half;
      track.style.transform = 'translateX(' + offset.toFixed(2) + 'px)';
      raf = requestAnimationFrame(frame);
    }
    function start(){ build(); half=track.scrollWidth/2; cancelAnimationFrame(raf); raf=requestAnimationFrame(frame); }
    ribbon.addEventListener('touchstart', function(e){ if(!built) return; dragging=true; sx=e.touches[0].clientX; so=offset; }, {passive:true});
    ribbon.addEventListener('touchmove', function(e){ if(!dragging) return; offset=so+(e.touches[0].clientX-sx); }, {passive:true});
    ribbon.addEventListener('touchend', function(){ dragging=false; });
    function apply(){ start(); }
    apply();
    if(mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
  })();

  /* Topbar-Hoehe messen -> --topbar-h, damit die Nav sauber darunter sitzt */
  (function(){
    var tb=document.getElementById('topbar');
    function setH(){ var h=(tb && !tb.classList.contains('hide')) ? tb.offsetHeight : 0; document.documentElement.style.setProperty('--topbar-h', h+'px'); }
    setH();
    window.addEventListener('resize', setH);
    if(tb){ var x=tb.querySelector('.topbar__x'); if(x) x.addEventListener('click', function(){ tb.classList.add('hide'); setH(); }); }
  })();

  /* Google-Maps mit Cookie-Einwilligung: laedt erst nach Zustimmung,
     jederzeit ueber den Footer-Link "Cookie-Einstellungen" aenderbar */
  (function(){
    var CK='msr_maps_consent';
    var box=document.getElementById('cookie');
    var maps=[].slice.call(document.querySelectorAll('[data-map]'));
    maps.forEach(function(w){ w._ph=w.innerHTML; });
    function loadMaps(){
      maps.forEach(function(w){
        if(w.querySelector('iframe')) return;
        var f=document.createElement('iframe');
        f.src=w.getAttribute('data-map'); f.loading='lazy';
        f.title='Karte zum MS Bootshaus Rodenkirchen';
        f.setAttribute('referrerpolicy','no-referrer-when-downgrade');
        f.allowFullscreen=true;
        w.innerHTML=''; w.appendChild(f);
      });
    }
    function unloadMaps(){ maps.forEach(function(w){ w.innerHTML=w._ph; }); }
    function set(v){ try{localStorage.setItem(CK,v);}catch(e){} }
    var consent=null; try{ consent=localStorage.getItem(CK); }catch(e){}
    if(consent==='yes') loadMaps();
    else if(box && maps.length) box.hidden=false;
    if(box){
      var a=document.getElementById('ckAccept'), d=document.getElementById('ckDecline');
      if(a) a.addEventListener('click', function(){ set('yes'); box.hidden=true; loadMaps(); });
      if(d) d.addEventListener('click', function(){ set('no'); box.hidden=true; unloadMaps(); });
    }
    /* Delegation: Einzel-Freigabe ueber den Platzhalter + Wieder-Aufrufen ueber den Footer */
    document.addEventListener('click', function(e){
      var t=e.target;
      if(t.closest && t.closest('[data-map] .mapph button')){ set('yes'); if(box) box.hidden=true; loadMaps(); return; }
      if(t.closest && t.closest('[data-consent-revoke]')){ e.preventDefault(); if(box) box.hidden=false; }
    });
  })();

  /* Barzahlungs-Figur dezent von rechts einfahren lassen */
  (function(){
    if(!document.body.classList.contains('home')) return; /* Barzahlungs-Figur nur auf der Startseite */
    var pn=document.getElementById('paynote'); if(!pn) return;
    var x=document.getElementById('paynoteX');
    setTimeout(function(){ pn.classList.add('show'); pn.setAttribute('aria-hidden','false'); }, 1400);
    if(x) x.addEventListener('click', function(){ pn.classList.remove('show'); pn.setAttribute('aria-hidden','true'); });
  })();
})();
