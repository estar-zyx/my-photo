(() => {
  const range = (last, first = 1) => Array.from({ length: last - first + 1 }, (_, offset) => first + offset);
  const parenthesized = (name, indexes, extension = 'jpg') => indexes.map((index) => `${name} (${index}).${extension}`);
  const numbered = (indexes, extension = 'jpg') => indexes.map((index) => `${index}.${extension}`);
  const albums = [
    { name: 'RM日常', folder: 'RM日常', files: parenthesized('RM日常', range(25)) },
    { name: '朋友', folder: '朋友', files: parenthesized('朋友', range(31)) },
    { name: '发小', folder: '发小', files: parenthesized('发小', range(11)) },
    { name: '萝卜', folder: '萝卜', files: parenthesized('萝卜', [1, ...range(17, 7)]) },
    { name: '比赛', folder: '比赛', files: parenthesized('比赛', range(6)) },
    { name: '作品', folder: '作品', files: ['作品 (1).jpg', '作品 (2).jpg', '作品 (3).png', '作品 (4).png', '作品 (5).jpg', '作品 (6).jpg'] },
    { name: '变化', folder: '变化', files: [...numbered(range(4)), '5.png', ...numbered(range(13, 6))] },
    { name: '毕业与战友', folder: '毕业与战友', files: parenthesized('毕业与战友', range(39)) },
    { name: '毕业与舍友', folder: '毕业与舍友', files: parenthesized('毕业与舍友', range(13)) },
  ];

  window.PHOTO_ALBUMS = albums.map((album) => ({
    name: album.name,
    photos: album.files.map((file, index) => ({
      fullSrc: `web_images/${album.folder}/${file}`,
      previewSrc: `web_images/previews/${album.folder}/${file.replace(/\.[^.]+$/, '.webp')}`,
      alt: `${album.name} ${String(index + 1).padStart(2, '0')}`,
    })),
  }));
})();
