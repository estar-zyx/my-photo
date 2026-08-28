const galleryButton = document.querySelector('[data-scroll-to="gallery"]');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const closeButton = lightbox.querySelector('.lightbox-close');
const lightboxPrevious = lightbox.querySelector('[data-lightbox-previous]');
const lightboxNext = lightbox.querySelector('[data-lightbox-next]');
const randomButton = document.querySelector('[data-random-photo]');
let lightboxCards = [];
let lightboxIndex = 0;
let lightboxSwipeStart = null;

function enablePhotoDragging(track) {
  let pointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let hasDragged = false;

  track.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = track.scrollLeft;
    hasDragged = false;
    track.classList.add('is-dragging');
  });

  track.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 6 && !hasDragged) {
      hasDragged = true;
      try { track.setPointerCapture(pointerId); } catch { /* Pointer capture is not available in every browser. */ }
    }
    if (hasDragged) {
      track.scrollLeft = startScrollLeft - distance;
      event.preventDefault();
    }
  });

  const stopDragging = (event) => {
    if (event.pointerId !== pointerId) return;
    if (hasDragged) {
      track.dataset.dragged = 'true';
      window.setTimeout(() => delete track.dataset.dragged, 0);
    }
    track.classList.remove('is-dragging');
    if (hasDragged) {
      try { track.releasePointerCapture(pointerId); } catch { /* Pointer capture may already be released. */ }
    }
    pointerId = null;
  };

  track.addEventListener('pointerup', stopDragging);
  track.addEventListener('pointercancel', stopDragging);
  track.addEventListener('dragstart', (event) => event.preventDefault());
}

function enableAlbumProgress(track, progress) {
  const updateProgress = () => {
    const card = track.querySelector('.photo-card');
    if (!card) return;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    const current = Math.min(track.querySelectorAll('.photo-card').length, Math.max(1, Math.round(track.scrollLeft / step) + 1));
    progress.textContent = `${current} / ${track.querySelectorAll('.photo-card').length}`;
  };

  track.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

function organizeAlbums() {
  const gallery = document.getElementById('gallery');
  const cards = Array.from(gallery.querySelectorAll('.photo-card'));
  cards.find((card) => card.querySelector('img').alt === '作品一').classList.add('photo-card--portrait');
  cards.find((card) => card.querySelector('img').alt === '作品四').classList.add('photo-card--landscape');
  const groups = [
    ['赛场与伙伴', [64, 13, 14]],
    ['电子竞赛', [0, 2, 3, 4, 6]],
    ['创作作品', [7, 1, 8, 9, 10, 11, 6]],
    ['萝卜日记', [15, 16, 17, 18, 19, 20]],
    ['好友相聚', [21, 22, 23, 24]],
    ['日常瞬间', [25, 26, 27, 28]],
    ['毕业时刻', [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63]],
    ['RM', [5, 12, 29, 30, 31, 32, 33, 34, 35, 36]],
  ];

  gallery.querySelectorAll('.album').forEach((album) => album.remove());
  groups.forEach(([name, indexes], index) => {
    const album = document.createElement('section');
    const titleId = `album-${index + 1}`;
    album.className = 'album';
    album.setAttribute('aria-labelledby', titleId);
    album.innerHTML = `<div class="album-heading"><p>${String(index + 1).padStart(2, '0')}</p><h3 id="${titleId}">${name}</h3><div class="album-meta"><span>${String(indexes.length).padStart(2, '0')} PHOTOS</span><span class="album-progress">1 / ${indexes.length}</span></div></div>`;
    const carousel = document.createElement('div');
    carousel.className = 'album-carousel';
    const grid = document.createElement('div');
    grid.className = 'photos film-strip';
    grid.setAttribute('aria-label', `${name}照片`);
    indexes.forEach((cardIndex) => grid.append(cards[cardIndex]));
    enablePhotoDragging(grid);
    enableAlbumProgress(grid, album.querySelector('.album-progress'));
    carousel.append(grid);
    album.append(carousel);
    gallery.append(album);
  });
}

function usePhotoPreviews() {
  document.querySelectorAll('.photo-card img').forEach((image) => {
    // The preview URL is already in the HTML, so the browser never starts
    // downloading the full-size photo while the gallery page is opening.
    const originalSource = image.dataset.fullSrc || image.getAttribute('src');
    image.dataset.fullSrc = originalSource;
  });
}

usePhotoPreviews();
organizeAlbums();

galleryButton.addEventListener('click', () => document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' }));

function showLightboxPhoto(index) {
  if (!lightboxCards.length) return;
  lightboxIndex = (index + lightboxCards.length) % lightboxCards.length;
  const image = lightboxCards[lightboxIndex].querySelector('img');
  lightboxImage.src = image.dataset.fullSrc || image.src;
  lightboxImage.alt = image.alt;
}

function openLightbox(card) {
  const track = card.closest('.photos');
  lightboxCards = track ? Array.from(track.querySelectorAll('.photo-card')) : [card];
  lightboxIndex = lightboxCards.indexOf(card);
  showLightboxPhoto(lightboxIndex);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  closeButton.focus();
}

document.querySelectorAll('.photo-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (card.closest('.photos')?.dataset.dragged === 'true') {
      event.preventDefault();
      return;
    }
    openLightbox(card);
  });
});

randomButton.addEventListener('click', () => {
  const cards = Array.from(document.querySelectorAll('.photo-card'));
  openLightbox(cards[Math.floor(Math.random() * cards.length)]);
});

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.src = '';
}

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
