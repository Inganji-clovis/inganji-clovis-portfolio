'use strict';

document.documentElement.classList.add('js');
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
try {
  const stored = localStorage.getItem('clovis-reduce-motion');
  if (stored !== null) reducedMotion = stored === 'true';
} catch (_) { /* Fallback */ }

const motionButton = $('.motion-toggle');
const videos = $$('.portfolio-video');

function updateFilmButton(video) {
  const button = $(`[data-video="${video.id}"]`);
  if (!button) return;
  button.textContent = video.paused ? 'Play film' : 'Pause film';
  button.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${video.id === 'server-film' ? 'infrastructure' : 'software'} film`);
}

function playFilm(video) {
  const promise = video.play();
  if (promise) promise.catch(() => updateFilmButton(video));
}

function applyMotionPreference() {
  document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  if (motionButton) {
    motionButton.textContent = reducedMotion ? 'Motion off' : 'Motion on';
    motionButton.setAttribute('aria-label', 'Toggle animation motion');
    motionButton.setAttribute('aria-pressed', String(reducedMotion));
  }
  for (const video of videos) {
    if (reducedMotion) video.pause();
    else if (video.dataset.inView === 'true' && video.dataset.userPaused !== 'true') playFilm(video);
    updateFilmButton(video);
  }
}

videos.forEach(video => {
  video.pause();
  video.addEventListener('play', () => updateFilmButton(video));
  video.addEventListener('pause', () => updateFilmButton(video));
  video.addEventListener('error', () => {
    const button = $(`[data-video="${video.id}"]`);
    if (button) { button.textContent = 'Media offline'; button.disabled = true; }
  });
});
applyMotionPreference();

if (motionButton) {
  motionButton.addEventListener('click', () => {
    reducedMotion = !reducedMotion;
    try { localStorage.setItem('clovis-reduce-motion', String(reducedMotion)); } catch (_) {}
    applyMotionPreference();
  });
}

motionPreference.addEventListener('change', event => {
  let hasCustom = false;
  try { hasCustom = localStorage.getItem('clovis-reduce-motion') !== null; } catch (_) {}
  if (!hasCustom) { reducedMotion = event.matches; applyMotionPreference(); }
});

$$('.film-toggle').forEach(button => button.addEventListener('click', () => {
  const video = document.getElementById(button.dataset.video);
  if (!video) return;
  if (video.paused) { video.dataset.userPaused = 'false'; playFilm(video); }
  else { video.dataset.userPaused = 'true'; video.pause(); }
  updateFilmButton(video);
}));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
  $$('.reveal').forEach(element => revealObserver.observe(element));

  const filmObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      video.dataset.inView = String(entry.isIntersecting);
      if (entry.isIntersecting && !reducedMotion && video.dataset.userPaused !== 'true') playFilm(video);
      else video.pause();
    });
  }, { threshold: 0.15 });
  videos.forEach(video => filmObserver.observe(video));

  const navObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      $$('#main-navigation a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  ['about', 'expertise', 'work', 'process'].forEach(id => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });
} else {
  $$('.reveal').forEach(element => element.classList.add('is-visible'));
  if (!reducedMotion) videos.forEach(playFilm);
}

const menuButton = $('.menu-toggle');
const navigation = $('#main-navigation');
function closeMenu() {
  if (!navigation) return;
  navigation.classList.remove('open');
  if (menuButton) {
    menuButton.setAttribute('aria-expanded', 'false');
    const span = $('span', menuButton);
    if (span) span.textContent = '+';
  }
}
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = !navigation.classList.contains('open');
    navigation.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    const span = $('span', menuButton);
    if (span) span.textContent = open ? '−' : '+';
  });
  $$('a', navigation).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); }, { passive: true });
}

const progress = $('.scroll-progress');
const header = $('.site-header');
const topLink = $('.back-to-top');
let scrollTick = false;
function updateScroll() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${total > 0 ? Math.min(1, window.scrollY / total) : 0})`;
  if (header) header.classList.toggle('scrolled', window.scrollY > 15);
  if (topLink) topLink.classList.toggle('visible', window.scrollY > 800);
  scrollTick = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
updateScroll();
window.addEventListener('load', updateScroll, { once: true });
const yearEl = $('#year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
$$('.tilt').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (reducedMotion || !finePointer.matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 4}deg`);
    card.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 4}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  $$('[data-filter]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $$('.project-card').forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
    if (!card.hidden) card.classList.add('is-visible');
  });
}));

const projectDetails = {
  erp: {
    category: 'FULL-STACK SAAS · ENTERPRISE PRODUCTION',
    title: 'Stunning ERP & Tour Operations Platform',
    role: 'Lead Full-Stack Developer & Architect',
    tools: 'React · Node.js · Express · PostgreSQL · TailwindCSS · Docker',
    status: 'Production Deployment',
    image: 'assets/erp-dashboard.jpg',
    alt: 'Stunning ERP Operations & Booking Management Dashboard',
    body: `
      <p>A full-stack enterprise resource planning (ERP) platform built to automate tour booking, ticketing operations, quote generations, and client communications for a high-growth travel agency in Kigali.</p>
      <h3>The Engineering Challenge</h3>
      <p>The business was previously constrained by fragmented spreadsheets, manual PDF quotations, and disconnected booking records, resulting in human error and delayed client responses.</p>
      <h3>Architecture &amp; Key Features</h3>
      <ul class="case-list">
        <li><strong>Frontend Application:</strong> Engineered with React, TypeScript, and TailwindCSS for sub-second page transitions, dynamic booking cost calculators, and full mobile responsiveness.</li>
        <li><strong>Backend REST API:</strong> Node.js and Express microservice architecture handling transactional booking creation, customer records, and email notification queues.</li>
        <li><strong>Relational Database:</strong> PostgreSQL database with normalized schema designs, foreign key constraints, automated indexing, and strict ACID transaction safety.</li>
        <li><strong>Security &amp; Permissions:</strong> Role-Based Access Control (RBAC) protecting sensitive financial logs, customer passport files, and administrative settings.</li>
      </ul>
      <h3>Impact &amp; Results</h3>
      <p>Reduced average booking turnaround time by 45%, eliminated duplicate reservation incidents, and delivered 99.9% uptime since deployment.</p>
    `,
    action: '<a class="button case-action" href="https://github.com/Inganji-clovis/newstunningrw" target="_blank" rel="noopener noreferrer">Inspect GitHub Repository &rarr;</a>'
  },
  network: {
    category: 'CISCO NETWORKING · ENTERPRISE IT INFRASTRUCTURE',
    title: 'Multi-VLAN Architecture & Router-on-a-Stick',
    role: 'Network Engineer & Systems Administrator',
    tools: 'Cisco IOS · Catalyst 2960/3750 Switches · Cisco 2901 Router · 802.1Q',
    status: 'Enterprise Blueprint & Packet Tracer Verified',
    body: `
      <p>An enterprise-grade network infrastructure design engineered to enforce strict Layer 2 segmentation between Staff, Management, and Guest networks while enabling high-throughput Layer 3 inter-VLAN routing through a dedicated router gateway.</p>
      <h3>Technical Architecture</h3>
      <ul class="case-list">
        <li><strong>VLAN Segmentation:</strong> Separated Layer 2 broadcast domains (VLAN 10: Management, VLAN 20: Operations, VLAN 30: Guest Wi-Fi) preventing unauthorized broadcast snooping.</li>
        <li><strong>802.1Q Trunking:</strong> High-bandwidth trunk links carrying tagged frames between access switches and the core distribution layer with native VLAN protection.</li>
        <li><strong>Router-on-a-Stick:</strong> Configured logical subinterfaces (g0/0.10, g0/0.20, g0/0.30) acting as default gateways with 802.1Q encapsulation.</li>
        <li><strong>Security ACLs:</strong> Access Control Lists deployed at the router boundary restricting Guest VLAN access to internal management servers and database subnets.</li>
      </ul>
      <p>This design demonstrates full enterprise network planning, packet verification, and Cisco IOS configuration best practices.</p>
    `,
    action: '<a class="button case-action" href="https://github.com/Inganji-clovis" target="_blank" rel="noopener noreferrer">View Cisco Configs on GitHub &rarr;</a>'
  },
  devops: {
    category: 'CLOUD, DEVOPS & INFRASTRUCTURE',
    title: 'Containerized Deployment & Automated CI/CD Pipeline',
    role: 'DevOps & Systems Specialist',
    tools: 'Docker · GitHub Actions · Nginx · Linux (Ubuntu 22.04 LTS) · SSL/TLS',
    status: 'Automated Continuous Deployment',
    image: 'assets/devops-dashboard.jpg',
    alt: 'DevOps CI/CD Pipeline and Docker Health Dashboard',
    body: `
      <p>A production-ready DevOps pipeline designed to eliminate manual server deployments, enforce automated linting/testing on git push, and deliver zero-downtime releases via containerization.</p>
      <h3>Implementation Highlights</h3>
      <ul class="case-list">
        <li><strong>Docker Multi-Stage Builds:</strong> Minimized container image sizes by over 60%, separating build-time dependencies from production runtimes.</li>
        <li><strong>GitHub Actions Workflow:</strong> Automated pipeline that executes unit tests, code linting, security vulnerability scans, and builds Docker images upon pull-request merge.</li>
        <li><strong>Nginx Reverse Proxy &amp; Hardening:</strong> Configured Nginx with HTTP/2, automated Let's Encrypt SSL/TLS certificate renewals, Gzip compression, and rate-limiting against DoS attacks.</li>
        <li><strong>Linux Server Hardening:</strong> Configured UFW firewall, disabled SSH password authentication in favor of ed25519 keys, and set up systemd service auto-restart policies.</li>
      </ul>
    `,
    action: '<a class="button case-action" href="https://github.com/Inganji-clovis" target="_blank" rel="noopener noreferrer">View DevOps Repositories &rarr;</a>'
  },
  payment: {
    category: 'FINTECH & BACKEND SERVICES',
    title: 'Secure Payment Gateway & Webhook Integration Engine',
    role: 'Backend & Security Engineer',
    tools: 'Node.js · Express · Redis · MTN MoMo API · Webhook Verification',
    status: 'Tested FinTech Module',
    image: 'assets/fintech-dashboard.jpg',
    alt: 'FinTech Payment Gateway and API Analytics Dashboard',
    body: `
      <p>A resilient payment integration service built to process instant transactions across African telecom networks (MTN Mobile Money, Airtel Money) alongside international card processors.</p>
      <h3>Key Engineering Features</h3>
      <ul class="case-list">
        <li><strong>Idempotent API Requests:</strong> Utilized Redis caching and transaction UUIDs to prevent double-charging during network timeouts and retries.</li>
        <li><strong>Cryptographic Webhook Handlers:</strong> Verified incoming payment provider webhooks using SHA256 HMAC digital signatures before updating order statuses.</li>
        <li><strong>Exponential Backoff Retries:</strong> Asynchronous worker queue that polls provider transaction status with jitter when instant webhooks fail to deliver.</li>
        <li><strong>Audit Logging:</strong> Structured JSON audit logging for all transaction states adhering to financial data security standards.</li>
      </ul>
    `,
    action: '<a class="button case-action" href="https://github.com/Inganji-clovis" target="_blank" rel="noopener noreferrer">Explore Code on GitHub &rarr;</a>'
  }
};

const dialog = $('#project-dialog');
const detailRoot = $('#project-detail');
let priorDialogFocus = null;

function closeProjectDialog() { if (dialog) dialog.close(); }
function openProjectDialog(key) {
  const project = projectDetails[key];
  if (!project || !dialog || !detailRoot) return;
  priorDialogFocus = document.activeElement;
  detailRoot.innerHTML = `
    <p class="eyebrow">${project.category}</p>
    <h2 id="dialog-title">${project.title}</h2>
    <div class="case-meta">
      <span><strong>ROLE</strong>${project.role}</span>
      <span><strong>TECH STACK</strong>${project.tools}</span>
      <span><strong>STATUS</strong>${project.status}</span>
    </div>
    ${project.image ? `<img class="case-image" src="${project.image}" alt="${project.alt}">` : ''}
    ${project.body}
    ${project.action || ''}
  `;
  detailRoot.querySelector('[data-close-dialog]')?.addEventListener('click', closeProjectDialog);
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}

$$('[data-project]').forEach(button => button.addEventListener('click', () => openProjectDialog(button.dataset.project)));
const closeDialogBtn = $('#close-dialog');
if (closeDialogBtn) closeDialogBtn.addEventListener('click', closeProjectDialog);

if (dialog) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProjectDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    priorDialogFocus?.focus({ preventScroll: true });
  });
}

let toastTimer = 0;
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
}

const copyIntroBtn = $('#copy-intro');
if (copyIntroBtn) {
  copyIntroBtn.addEventListener('click', async () => {
    const intro = `Hello Inganji Clovis,\n\nI reviewed your portfolio and was impressed by your dual expertise across Full-Stack Software Engineering (React, Node.js, TypeScript, PostgreSQL) and IT Network Infrastructure (Cisco, Linux, Docker).\n\nWe have an exciting opportunity that matches your profile and would like to arrange an introductory interview.\n\nBest regards,\n[Recruiter / Hiring Manager Name]\n[Company / Organization]`;
    try {
      await navigator.clipboard.writeText(intro);
      showToast('Recruiter message template copied to clipboard!');
    } catch (_) {
      priorDialogFocus = document.activeElement;
      if (detailRoot && dialog) {
        detailRoot.innerHTML = `
          <p class="eyebrow">RECRUITER / HIRING CONTACT TEMPLATE</p>
          <h2 id="dialog-title">Interview &amp; Hiring Invitation</h2>
          <p>Copy this message to reach out to Inganji Clovis for software engineering or IT roles:</p>
          <pre class="copyable-intro" style="white-space: pre-wrap; font-family: inherit; font-size: 15px;"></pre>
          <a class="button case-action" href="mailto:clovisinganji@gmail.com">Send via Email &rarr;</a>
        `;
        $('.copyable-intro', detailRoot).textContent = intro;
        dialog.showModal();
        document.body.classList.add('dialog-open');
      }
    }
  });
}
