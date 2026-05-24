(() => {
  "use strict";

  const canvas = document.getElementById("cosmos");
  const ctx = canvas.getContext("2d", { alpha: true });
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  const state = {
    w: 0,
    h: 0,
    particles: [],
    arcs: [],
    mouse: { x: 0, y: 0, active: false },
    t: 0,
    last: performance.now()
  };

  function resize() {
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    canvas.width = Math.floor(state.w * dpr);
    canvas.height = Math.floor(state.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createParticles();
    createArcs();
  }

  function createParticles() {
    const count = Math.min(180, Math.floor((state.w * state.h) / 10500));

    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * state.w,
      y: Math.random() * state.h,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.7 + 0.12,
      hue: 180 + Math.random() * 140
    }));
  }

  function createArcs() {
    state.arcs = Array.from({ length: 18 }, (_, i) => ({
      radius: 120 + i * 42,
      speed: 0.02 + i * 0.0015,
      hue: (180 + i * 18) % 360,
      alpha: 0.035 + i * 0.002
    }));
  }

  function drawBackground(t) {
    ctx.clearRect(0, 0, state.w, state.h);

    const cx = state.w * 0.5;
    const cy = state.h * 0.52;

    const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(state.w, state.h) * 0.72);
    gradient.addColorStop(0, "rgba(255,255,255,0.075)");
    gradient.addColorStop(0.24, "rgba(102,244,255,0.045)");
    gradient.addColorStop(0.58, "rgba(185,131,255,0.04)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.w, state.h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    for (const arc of state.arcs) {
      const start = t * arc.speed;
      const sweep = Math.PI * (0.8 + 0.3 * Math.sin(t * 0.2 + arc.radius * 0.01));

      ctx.beginPath();
      ctx.arc(cx, cy, arc.radius, start, start + sweep);
      ctx.strokeStyle = `hsla(${arc.hue}, 100%, 70%, ${arc.alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles(t, dt) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const p of state.particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      if (p.x < -20) p.x = state.w + 20;
      if (p.x > state.w + 20) p.x = -20;
      if (p.y < -20) p.y = state.h + 20;
      if (p.y > state.h + 20) p.y = -20;

      const twinkle = 0.55 + 0.45 * Math.sin(t * 1.8 + p.x * 0.01 + p.y * 0.02) ** 2;
      const alpha = p.a * twinkle;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (state.mouse.active) {
        const dx = p.x - state.mouse.x;
        const dy = p.y - state.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(state.mouse.x, state.mouse.y);
          ctx.strokeStyle = `rgba(102,244,255,${(1 - dist / 140) * 0.12})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    state.t += dt;

    drawBackground(state.t);
    drawParticles(state.t, dt);

    requestAnimationFrame(loop);
  }

  function setupMenu() {
    const navToggle = document.getElementById("navToggle");
    const mainNav = document.getElementById("mainNav");

    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
      });
    });
  }

  function setupReveal() {
    const items = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));
  }

  function setupActiveNav() {
    const links = Array.from(document.querySelectorAll(".main-nav a"));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    window.addEventListener("scroll", () => {
      const y = window.scrollY + 140;

      let active = null;

      for (const section of sections) {
        if (section.offsetTop <= y) {
          active = section;
        }
      }

      links.forEach((link) => {
        link.classList.toggle(
          "active",
          active && link.getAttribute("href") === `#${active.id}`
        );
      });
    });
  }

  function setupCopyMint() {
    const btn = document.getElementById("copyMint");
    const code = document.getElementById("mintCode");

    if (!btn || !code) return;

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        btn.textContent = "Copié";
        setTimeout(() => {
          btn.textContent = "Copier";
        }, 1400);
      } catch {
        btn.textContent = "Copie impossible";
        setTimeout(() => {
          btn.textContent = "Copier";
        }, 1400);
      }
    });
  }

  window.addEventListener("mousemove", (event) => {
    state.mouse.x = event.clientX;
    state.mouse.y = event.clientY;
    state.mouse.active = true;
  });

  window.addEventListener("mouseleave", () => {
    state.mouse.active = false;
  });

  window.addEventListener("resize", resize);

  resize();
  setupMenu();
  setupReveal();
  setupActiveNav();
  setupCopyMint();
  requestAnimationFrame(loop);
})();
