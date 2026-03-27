export function initThemeToggle() {
  const PREF_KEY = 'johnny-bravo-theme';
  
  // Define SVG Icons
  const moonIcon = `
    <svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
    </svg>`;
  
  const sunIcon = `
    <svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
    </svg>`;

  // Create floating button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'theme-toggle-btn';
  toggleBtn.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1.5rem;
    z-index: 9999;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-base);
  `;

  // Attach hover styles dynamically using a style tag
  const style = document.createElement('style');
  style.textContent = `
    .theme-toggle-btn:hover {
      background: var(--bg-card-hover);
      transform: scale(1.05);
      box-shadow: var(--shadow-md);
    }
  `;
  document.head.appendChild(style);

  // Read initial preference
  const savedPref = localStorage.getItem(PREF_KEY);
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let isLight = false;
  if (savedPref === 'light') isLight = true;
  else if (savedPref === 'dark') isLight = false;
  else if (!sysDark) isLight = true;

  // Apply visual theme
  const applyTheme = () => {
    if (isLight) {
      document.body.classList.add('light-mode');
      toggleBtn.innerHTML = sunIcon;
    } else {
      document.body.classList.remove('light-mode');
      toggleBtn.innerHTML = moonIcon;
    }
  };

  applyTheme();

  // Toggle handler
  toggleBtn.addEventListener('click', () => {
    isLight = !isLight;
    localStorage.setItem(PREF_KEY, isLight ? 'light' : 'dark');
    applyTheme();
  });

  document.body.appendChild(toggleBtn);
}
