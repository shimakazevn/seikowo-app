export const resizeImage = (image: string, width = 226, height = 320, crop = true) => {
  if (!image) return '';
  
  const target = /\/s[0-9]+\-c/g;
  const result = `/w${width}-h${height}-${crop ? 'c' : ''}`;
  return image.replace(target, result);
};

export const getDefaultImage = () => {
  return 'https://www.protean.co.jp/wp-content/themes/protean/images/no-image.gif';
};

export const getImage = (image = '') => {
  if (image) return image;
  return getDefaultImage();
};
