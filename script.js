const galleryButton = document.querySelector('[data-scroll-to="gallery"]');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('.lightbox-caption');
const closeButton = lightbox.querySelector('.lightbox-close');

function organizeAlbums() {
  const gallery = document.getElementById('gallery');
  const cards = Array.from(gallery.querySelectorAll('.photo-card'));
  cards.find((card) => card.querySelector('img').alt === '作品一').classList.add('photo-card--portrait');
  cards.find((card) => card.querySelector('img').alt === '作品四').classList.add('photo-card--landscape');
  const groups = [
    ['封面与合照', [13, 14]],
    ['电子竞赛', [0, 2, 3, 4, 6]],
    ['创作作品', [1, 7, 8, 9, 10, 11, 6]],
    ['萝卜日记', [15, 16, 17, 18, 19, 20]],
    ['惬意时刻', [21, 22, 23, 24]],
    ['日常瞬间', [25, 26, 27, 28]],
    ['RM', [5, 12, 29, 30, 31, 32, 33, 34, 35, 36]],
  ];

  gallery.querySelectorAll('.album').forEach((album) => album.remove());
  groups.forEach(([name, indexes], index) => {
    const album = document.createElement('section');
    const titleId = `album-${index + 1}`;
    album.className = 'album';
    album.setAttribute('aria-labelledby', titleId);
    album.innerHTML = `<div class="album-heading"><p>${String(index + 1).padStart(2, '0')}</p><h3 id="${titleId}">${name}</h3><span>${String(indexes.length).padStart(2, '0')} PHOTOS</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'photos';
    indexes.forEach((cardIndex) => grid.append(cards[cardIndex]));
    album.append(grid);
    gallery.append(album);
  });
}

organizeAlbums();

galleryButton.addEventListener('click', () => document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' }));

document.querySelectorAll('.photo-card').forEach((card) => {
  card.addEventListener('click', () => {
    const image = card.querySelector('img');
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = image.nextElementSibling.textContent;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    closeButton.focus();
  });
});

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.src = '';
}

closeButton.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox(); });
