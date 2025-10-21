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

// ------- VARIABLES -------

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

hideShorts();

const observer = new MutationObserver(hideShorts);
observer.observe(document.body, { childList: true, subtree: true });



// ------- LOCAL STORAGE -------

// TODO



// ------- VIEW -------

function createButtonStyles() {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --btn-bg: #cc0000;
      --btn-color: white;
      --btn-shadow: rgba(0, 0, 0, 0.3);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --btn-bg: #f1f1f1;
        --btn-color: #0f0f0f;
        --btn-shadow: rgba(255, 255, 255, 0.2);
      }
    }
  `;
  document.head.appendChild(style);
}

function createButtonElement() {
  const button = document.createElement('button');
  button.id = 'shortsblock-toggle-btn';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20H14V4H10V20ZM4 20H8V10H4V20ZM16 9V20H20V9H16Z" fill="currentColor"/>
    </svg>
    <span>Shorts</span>
  `;

  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--btn-bg);
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
    console.log('Shorts toggle clicked'); // TODO
  });
}

function attachButtonEventHandlers(button) {
  attachButtonHoverEffects(button);
  attachButtonPressEffects(button);
  attachButtonClickHandler(button);
}

function createToggleButton() {
  createButtonStyles();
  const button = createButtonElement();
  attachButtonEventHandlers(button);
  document.body.appendChild(button);
}

if (document.body) {
  createToggleButton();
} else {
  window.addEventListener('load', createToggleButton);
}
