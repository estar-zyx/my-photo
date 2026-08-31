const legacyMain = document.querySelector('body > main');
const legacyGallery = document.getElementById('gallery');
const sourceCards = Array.from(legacyGallery.querySelectorAll('.photo-card'));
const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const closeButton = lightbox.querySelector('.lightbox-close');
const lightboxPrevious = lightbox.querySelector('[data-lightbox-previous]');
const lightboxNext = lightbox.querySelector('[data-lightbox-next]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lightboxCards = [];
let lightboxIndex = 0;
let lightboxSwipeStart = null;

const groups = [
  ['赛场与伙伴', [64, 13, 14]], ['电子竞赛', [0, 2, 3, 4, 6]],
  ['创作作品', [7, 1, 8, 9, 10, 11, 6]], ['萝卜日记', [15, 16, 17, 18, 19, 20]],
  ['好友相聚', [21, 22, 23, 24]], ['日常瞬间', [25, 26, 27, 28]],
  ['毕业时刻', [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63]],
  ['RM', [5, 12, 29, 30, 31, 32, 33, 34, 35, 36]],
];

function enablePhotoDragging(track) {
  let pointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let hasDragged = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    pointerId = event.pointerId; startX = event.clientX; startScrollLeft = track.scrollLeft; hasDragged = false;
    track.classList.add('is-dragging');
  });
  track.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) <= 6) return;
    hasDragged = true;
    try { track.setPointerCapture(pointerId); } catch { /* Pointer capture is optional. */ }
    track.scrollLeft = startScrollLeft - distance;
    event.preventDefault();
  });
  const stop = (event) => {
    if (event.pointerId !== pointerId) return;
    if (hasDragged) {
      track.dataset.dragged = 'true';
      window.setTimeout(() => delete track.dataset.dragged, 0);
      try { track.releasePointerCapture(pointerId); } catch { /* It may already be released. */ }
    }
    track.classList.remove('is-dragging'); pointerId = null;
  };
  track.addEventListener('pointerup', stop);
  track.addEventListener('pointercancel', stop);
  track.addEventListener('dragstart', (event) => event.preventDefault());
}

function enableAutoFlow(track, direction, duration) {
  if (reducedMotion) return;
  let lastTime = performance.now();
  let virtualPosition = track.scrollLeft;
  let pauseUntil = 0;
  let isResetting = false;
  const pause = () => {
    pauseUntil = performance.now() + 1800;
    virtualPosition = track.scrollLeft;
  };
  track.addEventListener('pointerdown', pause);
  track.addEventListener('wheel', pause, { passive: true });
  window.setInterval(() => {
    const now = performance.now();
    const maximum = track.scrollWidth - track.clientWidth;
    const elapsed = now - lastTime;
    lastTime = now;
    if (now <= pauseUntil || maximum <= 0 || isResetting) {
      virtualPosition = track.scrollLeft;
      return;
    }
    const next = virtualPosition + (elapsed * 0.005 * direction);
    if (next >= maximum || next <= 0) {
      isResetting = true;
      track.classList.add('is-resetting');
      window.setTimeout(() => {
        virtualPosition = direction > 0 ? 0 : maximum;
        track.scrollLeft = virtualPosition;
        track.classList.remove('is-resetting');
        isResetting = false;
      }, 240);
      return;
    }
    virtualPosition = next;
    track.scrollLeft = next;
  }, 40);
}

function showLightboxPhoto(index) {
  if (!lightboxCards.length) return;
  lightboxIndex = (index + lightboxCards.length) % lightboxCards.length;
  const image = lightboxCards[lightboxIndex].querySelector('img');
  lightboxImage.src = image.dataset.fullSrc || image.src;
  lightboxImage.alt = image.alt;
}

function openLightbox(card) {
  const track = card.closest('.photos');
  lightboxCards = track ? Array.from(track.querySelectorAll('.photo-card:not(.photo-card--loop-copy)')) : [card];
  lightboxIndex = Number(card.dataset.lightboxIndex ?? lightboxCards.indexOf(card));
  showLightboxPhoto(lightboxIndex);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  closeButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.src = '';
}

function buildMemoryStage() {
  const stage = document.createElement('section');
  stage.className = 'memory-stage';
  stage.innerHTML = '<button class="stage-photo" type="button" data-random-stage aria-label="打开这张随机照片"><img alt="随机回忆"></button><h1>恰好想起</h1><a class="guestbook-entry" data-guestbook-entry href="guestbook.html"><span>留言簿</span><strong>留下一句话给我</strong><i aria-hidden="true">↗</i></a>';
  const stageButton = stage.querySelector('[data-random-stage]');
  const stageImage = stageButton.querySelector('img');
  let stageIndex = -1;
  const changePhoto = () => {
    let next = Math.floor(Math.random() * sourceCards.length);
    if (sourceCards.length > 1 && next === stageIndex) next = (next + 1) % sourceCards.length;
    const sourceImage = sourceCards[next].querySelector('img');
    const update = () => {
      stageImage.src = sourceImage.getAttribute('src');
      stageImage.dataset.fullSrc = sourceImage.dataset.fullSrc || sourceImage.getAttribute('data-full-src');
      stageImage.alt = sourceImage.alt;
      stageIndex = next;
      stageImage.classList.remove('is-fading');
    };
    if (stageIndex < 0 || reducedMotion) update();
    else { stageImage.classList.add('is-fading'); window.setTimeout(update, 260); }
  };
  changePhoto();
  window.setInterval(changePhoto, 3000);
  stageButton.addEventListener('click', () => openLightbox(sourceCards[stageIndex]));
  return stage;
}

function buildAlbums(wall) {
  groups.forEach(([name, indexes], groupIndex) => {
    const album = document.createElement('section');
    const titleId = `album-${groupIndex + 1}`;
    album.className = 'album';
    album.setAttribute('aria-labelledby', titleId);
    album.innerHTML = `<div class="album-heading"><span>${String(groupIndex + 1).padStart(2, '0')} / ${String(indexes.length).padStart(2, '0')}</span><h2 id="${titleId}">${name}</h2></div><div class="album-carousel"><div class="photos film-strip" aria-label="${name}照片"></div></div>`;
    const track = album.querySelector('.photos');
    const cards = indexes.map((cardIndex) => sourceCards[cardIndex]);
    cards.forEach((card, photoIndex) => { card.dataset.lightboxIndex = String(photoIndex); track.append(card); });
    enablePhotoDragging(track);
    wall.append(album);
    requestAnimationFrame(() => {
      const direction = groupIndex % 2 === 0 ? 1 : -1;
      if (direction < 0) track.scrollLeft = track.scrollWidth - track.clientWidth;
      enableAutoFlow(track, direction, 60000 + groupIndex * 5000);
    });
  });
}

legacyMain.id = 'memory-hall';
legacyMain.replaceChildren();
const stage = buildMemoryStage();
const wall = document.createElement('section');
wall.className = 'album-wall';
wall.id = 'gallery';
wall.setAttribute('aria-label', '照片分组');
legacyMain.append(stage, wall);
buildAlbums(wall);

document.querySelectorAll('.photo-card').forEach((card) => card.addEventListener('click', (event) => {
  if (card.closest('.photos')?.dataset.dragged === 'true') return;
  event.preventDefault();
  openLightbox(card);
}));
closeButton.addEventListener('click', closeLightbox);
lightboxPrevious.addEventListener('click', () => showLightboxPhoto(lightboxIndex - 1));
lightboxNext.addEventListener('click', () => showLightboxPhoto(lightboxIndex + 1));
lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
lightbox.addEventListener('pointerdown', (event) => { if (event.target === lightboxImage) lightboxSwipeStart = event.clientX; });
lightbox.addEventListener('pointerup', (event) => {
  if (lightboxSwipeStart === null) return;
  const distance = event.clientX - lightboxSwipeStart;
  if (Math.abs(distance) > 45) showLightboxPhoto(lightboxIndex + (distance < 0 ? 1 : -1));
  lightboxSwipeStart = null;
});
document.addEventListener('keydown', (event) => {
  if (!lightbox.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showLightboxPhoto(lightboxIndex - 1);
  if (event.key === 'ArrowRight') showLightboxPhoto(lightboxIndex + 1);
});
