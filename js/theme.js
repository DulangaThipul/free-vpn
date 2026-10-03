/**
 * LEGION Free VPN - Theme Engine (Light / Dark Mode & Accent Color Palette)
 * Supports:
 * - Modes: Dark (AMOLED Black) and Light Mode
 * - Accent Colors: Green (Default #00FF66), Cyan (#00E5FF), Purple/Violet (#A855F7), Electric Blue (#3B82F6), Orange/Amber (#FF9900), Neon Pink (#FF007F)
 */

(function () {
  'use strict';

  const STORAGE_MODE_KEY = 'legion_theme_mode';
  const STORAGE_COLOR_KEY = 'legion_theme_color';

  const ACCENT_COLORS = {
    green: {
      name: 'Emerald Green',
      neon: '#00FF66',
      hover: '#00df59',
      dim: 'rgba(0, 255, 102, 0.12)',
      glow: 'rgba(0, 255, 102, 0.28)',
      rgb: '0, 255, 102'
    },
    cyan: {
      name: 'Cyber Cyan',
      neon: '#00E5FF',
      hover: '#00b4cc',
      dim: 'rgba(0, 229, 255, 0.12)',
      glow: 'rgba(0, 229, 255, 0.28)',
      rgb: '0, 229, 255'
    },
    blue: {
      name: 'Electric Blue',
      neon: '#3B82F6',
      hover: '#2563EB',
      dim: 'rgba(59, 130, 246, 0.12)',
      glow: 'rgba(59, 130, 246, 0.28)',
      rgb: '59, 130, 246'
    },
    purple: {
      name: 'Neon Violet',
      neon: '#A855F7',
      hover: '#9333EA',
      dim: 'rgba(168, 85, 247, 0.12)',
      glow: 'rgba(168, 85, 247, 0.28)',
      rgb: '168, 85, 247'
    },
    pink: {
      name: 'Neon Pink',
      neon: '#FF007F',
      hover: '#e60072',
      dim: 'rgba(255, 0, 127, 0.12)',
      glow: 'rgba(255, 0, 127, 0.28)',
      rgb: '255, 0, 127'
    },
    amber: {
      name: 'Sunset Gold',
      neon: '#FFB800',
      hover: '#e5a600',
      dim: 'rgba(255, 184, 0, 0.12)',
      glow: 'rgba(255, 184, 0, 0.28)',
      rgb: '255, 184, 0'
    }
  };

  function getMode() {
    return localStorage.getItem(STORAGE_MODE_KEY) || 'dark';
  }

  function getColor() {
    return localStorage.getItem(STORAGE_COLOR_KEY) || 'green';
  }

  function setMode(mode) {
    const activeMode = mode === 'light' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_MODE_KEY, activeMode);
    applyMode(activeMode);
  }

  function setColor(colorKey) {
    const key = ACCENT_COLORS[colorKey] ? colorKey : 'green';
    localStorage.setItem(STORAGE_COLOR_KEY, key);
    applyColor(key);
  }

  function toggleMode() {
    const current = getMode();
    setMode(current === 'dark' ? 'light' : 'dark');
  }

  function applyMode(mode) {
    const root = document.documentElement;
    const body = document.body;
    const isLight = mode === 'light';

    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
      if (body) {
        body.classList.remove('bg-black', 'text-zinc-100');
        body.classList.add('bg-zinc-50', 'text-zinc-900');
      }
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      if (body) {
        body.classList.add('bg-black', 'text-zinc-100');
        body.classList.remove('bg-zinc-50', 'text-zinc-900');
      }
    }

    // Update toggle icons
    document.querySelectorAll('.js-theme-toggle-icon').forEach(icon => {
      icon.innerHTML = isLight 
        ? `<svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`
        : `<svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`;
    });

    // Update modal mode buttons state
    const darkBtn = document.getElementById('theme-mode-dark-btn');
    const lightBtn = document.getElementById('theme-mode-light-btn');
    if (darkBtn && lightBtn) {
      if (isLight) {
        lightBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-neon text-black';
        darkBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-zinc-400 hover:text-white';
      } else {
        darkBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-neon text-black';
        lightBtn.className = 'py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-zinc-400 hover:text-white';
      }
    }

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isLight ? '#f8fafc' : '#000000');
    }
  }

  function applyColor(colorKey) {
    const c = ACCENT_COLORS[colorKey] || ACCENT_COLORS.green;
    const root = document.documentElement;

    root.style.setProperty('--color-neon', c.neon);
    root.style.setProperty('--color-neon-hover', c.hover);
    root.style.setProperty('--color-neon-dim', c.dim);
    root.style.setProperty('--color-neon-glow', c.glow);
    root.style.setProperty('--color-neon-rgb', c.rgb);

    // Update color picker buttons active state
    document.querySelectorAll('.js-color-dot').forEach(dot => {
      const dotColor = dot.getAttribute('data-color');
      if (dotColor === colorKey) {
        dot.classList.add('ring-2', 'ring-white', 'border-neon');
      } else {
        dot.classList.remove('ring-2', 'ring-white', 'border-neon');
      }
    });

    // Update any dynamic elements using neon
    if (window.tailwind && window.tailwind.config && window.tailwind.config.theme) {
      try {
        window.tailwind.config.theme.extend.colors.neon.DEFAULT = c.neon;
        window.tailwind.config.theme.extend.colors.neon.hover = c.hover;
      } catch (e) {}
    }
  }

  function openPaletteModal() {
    const modal = document.getElementById('theme-customizer-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closePaletteModal() {
    const modal = document.getElementById('theme-customizer-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  // Self-execute initial settings immediately
  applyMode(getMode());
  applyColor(getColor());

  document.addEventListener('DOMContentLoaded', () => {
    applyMode(getMode());
    applyColor(getColor());

    // Theme toggle button
    document.querySelectorAll('.js-theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMode();
      });
    });

    // Palette modal triggers
    const openBtn = document.getElementById('open-palette-btn');
    const closeBtn = document.getElementById('close-theme-modal');
    if (openBtn) openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPaletteModal();
    });
    if (closeBtn) closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closePaletteModal();
    });

    // Modal display mode buttons
    const darkBtn = document.getElementById('theme-mode-dark-btn');
    const lightBtn = document.getElementById('theme-mode-light-btn');
    if (darkBtn) darkBtn.addEventListener('click', () => setMode('dark'));
    if (lightBtn) lightBtn.addEventListener('click', () => setMode('light'));

    // Color buttons
    document.querySelectorAll('.js-color-dot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const colorKey = btn.getAttribute('data-color');
        if (colorKey) setColor(colorKey);
      });
    });
  });

  window.LegionTheme = {
    getMode,
    setMode,
    toggleMode,
    getColor,
    setColor,
    openPaletteModal,
    closePaletteModal,
    colors: ACCENT_COLORS
  };
})();
