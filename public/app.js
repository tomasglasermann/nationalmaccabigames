
/* ============================================================
   CONFIG — EDIT THESE TWO LINKS once you have them
   ============================================================ */
const CONFIG = {
  // Official registration portal (Salesforce). Leave as "#" until you have the link.
  salesforceRegistrationUrl: "#",
  // Donation form (RedPodium). Leave as "#" until you have the link.
  redpodiumDonationUrl: "#",
  // Countdown target date — JCC Maccabi Games 2027, Austin (July 25–30, 2027).
  eventDate: "2027-07-25T09:00:00",
  // Contacts (informational only)
  registrationContactEmail: "tomasg@marjcc.org",
  sponsorContactEmail: "roxanam@marjcc.org",
};

(function(){
  "use strict";
  document.documentElement.classList.add('js');
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Nav: scrolled state + mobile toggle + active link ---- */
  var nav = document.getElementById('nav');
  var navlinks = document.getElementById('navlinks');
  var toggle = document.getElementById('navToggle');
  function onScroll(){ if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  if (toggle && navlinks){
    toggle.addEventListener('click', function(){
      var open = navlinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navlinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ navlinks.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
    });
  }

  /* ---- Active link on scroll ---- */
  var sections = [].map(function(id){ return document.getElementById(id); }).filter(Boolean);
  var linkFor = {};
  document.querySelectorAll('.nav__links a.link').forEach(function(a){ var h=a.getAttribute('href'); if(h) linkFor[h.slice(1)] = a; });
  if ('IntersectionObserver' in window){
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          Object.values(linkFor).forEach(function(a){ a.classList.remove('active'); });
          var a = linkFor[e.target.id]; if (a) a.classList.add('active');
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px', threshold:0});
    sections.forEach(function(s){ spy.observe(s); });
  }

  /* ---- WOW effects: scroll progress + hero parallax + crest tilt ---- */
  var _bar = document.getElementById('scrollbar');
  var _stars = document.querySelector('.hero__stars');
  var _glow = document.querySelector('.hero__glow');
  var _crest = document.querySelector('.hero__crest-stage');
  var _hero = document.getElementById('hero');
  var _reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var _ticking = false;
  function _onScrollFx(){
    var y = window.scrollY || window.pageYOffset || 0;
    var h = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    if (_bar) _bar.style.width = Math.min(100, Math.max(0, y / h * 100)) + '%';
    if (!_reduce && y < window.innerHeight * 1.2){
      if (_stars) _stars.style.transform = 'translate3d(0,' + (y * 0.16) + 'px,0)';
      if (_glow) _glow.style.transform = 'translate3d(0,' + (y * 0.10) + 'px,0)';
    }
    _ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!_ticking){ _ticking = true; requestAnimationFrame(_onScrollFx); }
  }, { passive: true });
  _onScrollFx();

  // 3D tilt of the hero crest following the pointer (desktop only).
  if (!_reduce && _crest && _hero && window.matchMedia('(hover:hover)').matches){
    _hero.addEventListener('mousemove', function(e){
      var r = _hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      _crest.style.transition = 'transform .12s ease-out';
      _crest.style.animation = 'none';
      _crest.style.transform = 'rotateY(' + (px * 20) + 'deg) rotateX(' + (-py * 20) + 'deg) scale(1.05)';
    });
    _hero.addEventListener('mouseleave', function(){
      _crest.style.transition = 'transform .4s ease';
      _crest.style.transform = '';
      // let the idle float animation resume
      setTimeout(function(){ _crest.style.animation = ''; _crest.style.transition = ''; }, 420);
    });
  }

  /* ---- Reveal on scroll (fail-safe: reveal all after 1.4s) ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  function showAll(){ reveals.forEach(function(el){ el.classList.add('in'); }); }
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var ro = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
    reveals.forEach(function(el){ ro.observe(el); });
    setTimeout(showAll, 1400);
  } else { showAll(); }

  /* ---- Count-up stats ---- */
  function countUp(el){
    var target = parseInt(el.getAttribute('data-count'),10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent = target + suffix; return; }
    var start = 0, dur = 1100, t0 = null;
    function step(ts){
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(start + (target-start)*eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var nums = document.querySelectorAll('.stat .num[data-count]');
  if ('IntersectionObserver' in window){
    var no = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(e){ if (e.isIntersecting){ countUp(e.target); obs.unobserve(e.target); } });
    }, {threshold:0.5});
    nums.forEach(function(n){ no.observe(n); });
  } else { nums.forEach(countUp); }

  /* ---- Countdown ---- */
  (function(){
    var root = document.getElementById('countdown');
    if (root){
      var target = new Date(CONFIG.eventDate).getTime();
      if (!isNaN(target)){
        var elD = root.querySelector('[data-cd="days"]'),
            elH = root.querySelector('[data-cd="hours"]'),
            elM = root.querySelector('[data-cd="mins"]'),
            elS = root.querySelector('[data-cd="secs"]');
        var pad = function(n){ return (n<10?'0':'')+n; };
        var tick = function(){
          var diff = target - Date.now();
          if (diff <= 0){ elD.textContent='0'; elH.textContent='00'; elM.textContent='00'; elS.textContent='00'; return false; }
          var s = Math.floor(diff/1000);
          var days = Math.floor(s/86400); s -= days*86400;
          var h = Math.floor(s/3600); s -= h*3600;
          var m = Math.floor(s/60); s -= m*60;
          elD.textContent = String(days); elH.textContent = pad(h); elM.textContent = pad(m); elS.textContent = pad(s);
          return true;
        };
        tick();
        var iv = setInterval(function(){ if (tick() === false) clearInterval(iv); }, 1000);
      }
    }
  })();

  /* ---- Wire external links (Salesforce + RedPodium) ---- */
  function wire(selector, url, noteSel){
    var ready = url && url !== '#';
    document.querySelectorAll(selector).forEach(function(a){
      if (ready){
        a.setAttribute('href', url);
        a.setAttribute('target','_blank');
        a.setAttribute('rel','noopener');
      } else {
        a.addEventListener('click', function(ev){
          // No link yet: fall back gracefully
          if (noteSel){
            ev.preventDefault();
            var note = document.querySelector(noteSel);
            if (note){ note.hidden = false; note.scrollIntoView({behavior:'smooth', block:'center'}); }
          }
        });
      }
    });
  }
  wire('[data-salesforce]', CONFIG.salesforceRegistrationUrl, null);
  wire('[data-redpodium]', CONFIG.redpodiumDonationUrl, '[data-redpodium-note]');
  // "Donate" buttons that point to the #donar section always scroll there; if RedPodium is set,
  // the primary button inside #donar carries the real link.

  /* ---- Copy-to-clipboard for emails ---- */
  document.querySelectorAll('.copybtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var val = btn.getAttribute('data-copy') || '';
      var done = function(){ var old = btn.textContent; btn.textContent='Copied!'; btn.classList.add('copied');
        setTimeout(function(){ btn.textContent = old; btn.classList.remove('copied'); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(val).then(done).catch(function(){ fallbackCopy(val); done(); });
      } else { fallbackCopy(val); done(); }
    });
  });
  function fallbackCopy(text){
    try{ var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }catch(e){}
  }

  /* ---- Registration form ---- */
  var form = document.getElementById('regForm');
  var success = document.getElementById('formSuccess');
  var recap = document.getElementById('formRecap');
  if (form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }
      var payload = {
        participant_first_name: form.participant_first_name.value.trim(),
        participant_last_name: form.participant_last_name.value.trim(),
        participant_phone: form.participant_phone.value.trim(),
        participant_dob: form.participant_dob.value,
        parent1_first_name: form.parent1_first_name.value.trim(),
        parent1_last_name: form.parent1_last_name.value.trim(),
        parent1_email: form.parent1_email.value.trim(),
        parent1_phone: form.parent1_phone.value.trim(),
        sport: form.sport.value
      };
      var data = {
        'Athlete': (payload.participant_first_name + ' ' + payload.participant_last_name).trim(),
        'Phone': payload.participant_phone,
        'Sport': payload.sport,
        'Parent/Guardian': (payload.parent1_first_name + ' ' + payload.parent1_last_name).trim(),
        'Email': payload.parent1_email
      };
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      var finish = function(){
        if (recap){
          recap.innerHTML = Object.keys(data).map(function(k){
            return '<div><strong>'+k+':</strong> '+ (data[k] ? escapeHtml(data[k]) : '—') +'</div>';
          }).join('');
        }
        form.hidden = true;
        if (success) success.classList.add('show');
        if (success) success.scrollIntoView({behavior:'smooth', block:'center'});
        if (btn) btn.disabled = false;
      };
      // Send to the backend; never block the user if the request fails.
      fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(finish, finish);
    });
  }
  var resetBtn = document.getElementById('formReset');
  if (resetBtn){
    resetBtn.addEventListener('click', function(){
      form.reset(); form.hidden = false; if (success) success.classList.remove('show');
      form.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
})();


(function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Preloader: curtain + logo, once per session ---- */
  (function(){
    var pl = document.getElementById('preloader');
    if (!pl) return;
    var seen = false;
    try { seen = !!sessionStorage.getItem('nmb_seen'); if (!seen) sessionStorage.setItem('nmb_seen','1'); } catch(e){}
    if (seen || reduce){ pl.style.display = 'none'; return; }
    setTimeout(function(){ pl.style.display = 'none'; }, 2050);
  })();

  /* ---- Hero floating particles ---- */
  (function(){
    var canvas = document.getElementById('heroParticles');
    var hero = document.getElementById('hero');
    if (!canvas || !hero || reduce) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], raf = null;
    function resize(){
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed(){
      var n = Math.max(22, Math.min(46, Math.round(W / 30)));
      parts = [];
      for (var i = 0; i < n; i++){
        parts.push({
          x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.7 + 0.6,
          vy: -(Math.random()*0.24 + 0.05), vx: (Math.random()-0.5)*0.12,
          a: Math.random()*0.5 + 0.12, tw: Math.random()*0.02 + 0.004, tp: Math.random()*6.28,
          c: Math.random() < 0.22 ? '184,58,84' : '255,255,255'
        });
      }
    }
    function tick(){
      ctx.clearRect(0,0,W,H);
      for (var i = 0; i < parts.length; i++){
        var p = parts[i];
        p.y += p.vy; p.x += p.vx; p.tp += p.tw;
        if (p.y < -6){ p.y = H+6; p.x = Math.random()*W; }
        if (p.x < -6) p.x = W+6; else if (p.x > W+6) p.x = -6;
        var al = p.a * (0.55 + 0.45*Math.sin(p.tp)); if (al < 0) al = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + p.c + ',' + al.toFixed(3) + ')'; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    function start(){ if (!raf) tick(); }
    function stop(){ if (raf){ cancelAnimationFrame(raf); raf = null; } }
    resize(); seed();
    window.addEventListener('resize', function(){ resize(); seed(); }, { passive: true });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? start() : stop(); }); }, { threshold: 0 }).observe(hero);
    } else { start(); }
  })();

  /* ---- Gallery lightbox ---- */
  (function(){
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.gallery .ph img'));
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    if (!imgs.length || !lb || !lbImg) return;
    var idx = 0;
    function show(){ lbImg.src = imgs[idx].src; lbImg.alt = imgs[idx].alt || ''; }
    function open(i){ idx = i; show(); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; }
    function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
    function go(d){ idx = (idx + d + imgs.length) % imgs.length; show(); }
    imgs.forEach(function(im, i){ im.addEventListener('click', function(){ open(i); }); });
    var c = document.getElementById('lbClose'); if (c) c.addEventListener('click', close);
    var pv = document.getElementById('lbPrev'); if (pv) pv.addEventListener('click', function(e){ e.stopPropagation(); go(-1); });
    var nx = document.getElementById('lbNext'); if (nx) nx.addEventListener('click', function(e){ e.stopPropagation(); go(1); });
    lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
    document.addEventListener('keydown', function(e){
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
  })();
})();


/* ---- Multi-page: mark the current nav link active ---- */
(function(){
  try{
    var path = location.pathname.replace(/index\.html$/,'/');
    document.querySelectorAll('.nav__links a.link').forEach(function(a){
      var href = a.getAttribute('href');
      if (href === path || (href !== '/' && path.indexOf(href) === 0)) a.classList.add('active');
    });
  }catch(e){}
})();
