// ==UserScript==
// @name         ShortsBlock
// @version      1.1.2
// @description  Simple browser extension that allows you to hide Shorts on a YouTube
// @match        *://*.youtube.com/*
// @match        *://*.youtubekids.com/*
// @grant        none
// @run-at       document-idle
// @author       artemgassan
// @license      MIT
// ==/UserScript==

// ------- YOUTUBE VARIABLES -------

const KEYWORD = 'shorts';

const SELECTORS = {
  chips: [
    'yt-chip-cloud-chip-renderer',
    'ytd-chip-cloud-chip-renderer',
    'button.ytChipShapeButtonReset',
    'chip-shape'
  ],
  links: [
    'a[title]',
    'a[aria-label]'
  ],
  tabs: [
    '[role="tab"]'
  ],
  videos: [
    'ytd-video-renderer'
  ],
  sections: [
    'ytd-rich-section-renderer',
    'grid-shelf-view-model',
    'ytd-reel-shelf-renderer'
  ]
};

const CANDIDATE_SELECTORS = [
  ...SELECTORS.chips,
  ...SELECTORS.links,
  ...SELECTORS.tabs,
  ...SELECTORS.videos
].join(',');

const CONTAINER_SELECTORS = [
  ...SELECTORS.chips,
  ...SELECTORS.tabs
].join(',');

const SECTION_SELECTORS = SELECTORS.sections.join(',');



// ------- CORE -------

function startScript() {
  hideShorts();
  observeShorts();
  setupRouting();
}

if (document.body) {
  startScript();
} else {
  window.addEventListener('load', startScript);
}



// ------- HIDING SHORTS -------

function hideShorts() {
  const candidates = document.querySelectorAll(CANDIDATE_SELECTORS);
  for (const node of candidates) {
    const text = (node.textContent || '').trim().toLowerCase();
    if (text.includes(KEYWORD)) {
      const chipContainer = node.closest(CONTAINER_SELECTORS) || node;
      if (chipContainer) {
        chipContainer.style.display = 'none';
      }
    }
  }

  const sections = document.querySelectorAll(SECTION_SELECTORS);
  for (const element of sections) {
    element.style.display = 'none';
  }
}

function observeShorts() {
  const observer = new MutationObserver(hideShorts);
  observer.observe(document.body, { childList: true, subtree: true });
}



// ------- ROUTING -------

function getCurrentChannelId() {
  const pathname = window.location.pathname;
  const channelPatterns = [
    /\/@([\w-]+)/,           // - youtube.com/@username
    /\/c\/([\w-]+)/,         // - youtube.com/c/channelname
    /\/channel\/([\w-]+)/,   // - youtube.com/channel/UCxxxxxxx
    /\/user\/([\w-]+)/       // - youtube.com/user/username
  ];

  for (const pattern of channelPatterns) {
    const match = pathname.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function isChannelPage() {
  return getCurrentChannelId() !== null;
}

function setupRouting() {
  let button = null;

  function updateButtonVisibility() {
    if (isChannelPage()) {
      if (!button || !document.body.contains(button)) {
        createToggleButton();
        button = document.getElementById('shortsblock-toggle-btn');
      } else {
        const channelId = getCurrentChannelId();
        if (channelId) {
          const isExcluded = isChannelExcluded(channelId);
          updateButtonState(button, isExcluded);
        }
      }
    } else {
      if (button && document.body.contains(button)) {
        button.remove();
        button = null;
      }
    }
  }

  updateButtonVisibility();

  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      updateButtonVisibility();
    }
  }).observe(document.body, { childList: true, subtree: true });

  window.addEventListener('yt-navigate-finish', updateButtonVisibility);
  window.addEventListener('popstate', updateButtonVisibility);
}



// ------- LOCAL STORAGE -------

const STORAGE_KEY = 'shortsblock-excluded-channels';

function getExcludedChannels() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

function saveExcludedChannels(channels) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
    return true;
  } catch (error) {
    return false;
  }
}

function isChannelExcluded(channelId) {
  const excluded = getExcludedChannels();
  return excluded.includes(channelId);
}

function toggleChannelExclusion(channelId) {
  if (!channelId) return false;

  const excluded = getExcludedChannels();
  const index = excluded.indexOf(channelId);

  if (index === -1) {
    excluded.push(channelId);
  } else {
    excluded.splice(index, 1);
  }

  return saveExcludedChannels(excluded);
}



// ------- VIEW -------

function createButtonStyles() {
  if (document.getElementById('shortsblock-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'shortsblock-styles';
  style.textContent = `
    :root {
      --btn-bg: #cc0000;
      --btn-color: white;
      --btn-shadow: rgba(0, 0, 0, 0.3);
      --btn-bg-excluded: #065fd4;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --btn-bg: #f1f1f1;
        --btn-color: #0f0f0f;
        --btn-shadow: rgba(255, 255, 255, 0.2);
        --btn-bg-excluded: #3ea6ff;
      }
    }
  `;
  document.head.appendChild(style);
}

function updateButtonState(button, isExcluded) {
  const span = button.querySelector('span');

  if (isExcluded) {
    button.style.background = 'var(--btn-bg-excluded)';
    if (span) span.textContent = 'Shorts: ON';
  } else {
    button.style.background = 'var(--btn-bg)';
    if (span) span.textContent = 'Shorts: OFF';
  }
}

function createButtonElement() {
  const button = document.createElement('button');
  button.id = 'shortsblock-toggle-btn';

  const channelId = getCurrentChannelId();
  const isExcluded = channelId ? isChannelExcluded(channelId) : false;
  const buttonText = isExcluded ? 'Shorts: ON' : 'Shorts: OFF';

  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20H14V4H10V20ZM4 20H8V10H4V20ZM16 9V20H20V9H16Z" fill="currentColor"/>
    </svg>
    <span>${buttonText}</span>
  `;

  const bgColor = isExcluded ? 'var(--btn-bg-excluded)' : 'var(--btn-bg)';

  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: ${bgColor};
    color: var(--btn-color);
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px var(--btn-shadow);
    transition: all 0.3s ease;
    font-family: "YouTube Sans", "Roboto", sans-serif;
    user-select: none;
  `;

  return button;
}

function attachButtonHoverEffects(button) {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 16px var(--btn-shadow)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px var(--btn-shadow)';
  });
}

function attachButtonPressEffects(button) {
  button.addEventListener('mousedown', () => {
    button.style.transform = 'scale(0.95)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'scale(1.05)';
  });
}

function attachButtonClickHandler(button) {
  button.addEventListener('click', () => {
    const channelId = getCurrentChannelId();
    const success = toggleChannelExclusion(channelId);

    if (success) {
      const isExcluded = isChannelExcluded(channelId);
      updateButtonState(button, isExcluded);
    }
  });
}

function attachButtonEventHandlers(button) {
  attachButtonHoverEffects(button);
  attachButtonPressEffects(button);
  attachButtonClickHandler(button);
}

function createToggleButton() {
  if (document.getElementById('shortsblock-toggle-btn')) {
    return;
  }

  createButtonStyles();
  const button = createButtonElement();
  attachButtonEventHandlers(button);
  document.body.appendChild(button);
}
