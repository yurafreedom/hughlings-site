(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 620px)');
  const toggle = document.querySelector('.motion-toggle');
  let paused = reduceMotion.matches;
  try { const saved = sessionStorage.getItem('hughlings-motion'); if (saved !== null) paused = saved === 'paused'; } catch (_) {}
  function setMotion(value) {
    paused = value;
    root.classList.toggle('motion-paused', paused);
    root.classList.toggle('motion-enabled', !paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('.motion-text').textContent = paused ? 'Enable motion' : 'Pause motion';
    toggle.querySelector('.motion-indicator').textContent = paused ? '▷' : 'Ⅱ';
    try { sessionStorage.setItem('hughlings-motion', paused ? 'paused' : 'enabled'); } catch (_) {}
    if (paused) document.querySelector('.hero-art').style.transform = '';
  }
  setMotion(paused);
  toggle.addEventListener('click', () => setMotion(!paused));
  reduceMotion.addEventListener('change', event => setMotion(event.matches));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -35px 0px', threshold: 0.03 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  } else document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));

  const menuButton = document.querySelector('.menu-button');
  const menu = document.querySelector('#mobile-nav');
  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const opened = menuButton.getAttribute('aria-expanded') === 'true';
    menu.hidden = opened;
    menuButton.setAttribute('aria-expanded', String(!opened));
    menuButton.setAttribute('aria-label', opened ? 'Open navigation' : 'Close navigation');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) closeMenu(true); });
  document.addEventListener('click', event => { if (!menu.hidden && !event.target.closest('.site-header')) closeMenu(); });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const story = document.querySelector('.story-visual');
  const steps = [...document.querySelectorAll('.story-step')];
  const stageButtons = [...document.querySelectorAll('[data-step]')];
  const counter = document.querySelector('.visual-counter');
  let currentStage = -1;
  function setStage(index) {
    if (index === currentStage) return;
    currentStage = index;
    story.dataset.stage = String(index);
    counter.textContent = `0${index + 1} / 04`;
    stageButtons.forEach((button, i) => {
      button.classList.toggle('active', i === index);
      if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    steps.forEach((step, i) => step.classList.toggle('active', i === index));
  }
  setStage(0);
  stageButtons.forEach((button, index) => button.addEventListener('click', () => {
    setStage(index);
    if (!mobile.matches) {
      const target = steps[index].getBoundingClientRect().top + window.scrollY - (window.innerHeight - steps[index].offsetHeight) / 2;
      window.scrollTo({ top: Math.max(0, target), behavior: paused || reduceMotion.matches ? 'instant' : 'smooth' });
    }
  }));
  let ticking = false;
  const progress = document.querySelector('.reading-progress');
  const art = document.querySelector('.hero-art');
  function updateScroll() {
    ticking = false;
    const available = root.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? window.scrollY / available : 0})`;
    if (!paused && !reduceMotion.matches && !mobile.matches && window.scrollY < window.innerHeight * 1.5) {
      art.style.transform = `translateY(${Math.min(window.scrollY * 0.055, 48)}px)`;
    }
    if (!mobile.matches) {
      const middle = window.innerHeight * 0.5;
      let index = 0;
      steps.forEach((step, i) => { if (step.getBoundingClientRect().top < middle) index = i; });
      setStage(index);
    }
  }
  function scheduleScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  mobile.addEventListener('change', () => { art.style.transform = ''; scheduleScroll(); });
  updateScroll();

  const cases = [
    { category: 'Duration', title: 'Three weeks.\nA question left open.', body: 'The recorded course lasted three weeks. Duration needs to be assessed against the selected adequacy rule before this is counted as a failed adequate trial.', finding: 'A short course does not tell the whole story.', start: 'Recorded course', end: '3 weeks', width: '33.333%', color: '#c6ae90' },
    { category: 'Exposure', title: 'Something changed\nin week four.', body: 'Bupropion was added in week four. The recorded intolerance coincides with a change in the medication combination. The review flags this sequence for clinical assessment; it does not establish causation.', finding: 'The dose stayed the same. The context changed.', start: 'Bupropion added in week 4', end: '9 weeks recorded', width: '100%', color: '#94abb1' },
    { category: 'Adherence', title: 'Eight weeks on paper.\nA gap in the evidence.', body: 'Pharmacy refills cover only about half of the recorded course, with a 23-day gap. Refill data can raise an adherence question; they cannot prove whether a medicine was taken.', finding: 'Keep uncertainty visible. Don’t turn it into a verdict.', start: 'Refill coverage ≈ half the course', end: '23-day gap', width: '50%', color: '#a4ac90' }
  ];
  const tabs = [...document.querySelectorAll('[data-course]')];
  const panel = document.querySelector('#course-panel');
  function setCase(index, focus = false) {
    const data = cases[index];
    tabs.forEach((tab, i) => { tab.classList.toggle('active', i === index); tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tabs[index].id);
    document.querySelector('#case-category').textContent = data.category;
    const title = document.querySelector('#case-title');
    title.replaceChildren();
    data.title.split('\n').forEach((line, i) => { if (i) title.append(document.createElement('br')); title.append(document.createTextNode(line)); });
    document.querySelector('#case-body').textContent = data.body;
    document.querySelector('#case-finding').textContent = data.finding;
    document.querySelector('#timeline-start').textContent = data.start;
    document.querySelector('#timeline-end').textContent = data.end;
    document.querySelector('.panel-overline>span:last-child').textContent = `Illustrative review / 0${index + 1}`;
    const fill = document.querySelector('.timeline-fill'); fill.style.width = data.width; fill.style.background = data.color;
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setCase(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); setCase(next, true); }
    });
  });
})();
