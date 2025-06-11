import { resizeImage } from '../imageUtils';

export const createAuthor = (obj = {}) => {
  const image = obj.image?.url || '';
  const name = obj.displayName || '';
  const id = obj.id || '';
  return {
    id,
    name,
    image
  };
};

export const mapFeedToFeatureData = (obj) => {
  const data = obj?.feed?.entry?.[0];
  if (!data) return null;

  const image = data.media$thumbnail?.url || '';
  const resized = resizeImage(image, 1200, 480);
  
  return {
    title: data.title?.$t || '',
    description: data.summary?.$t || '',
    image: resized,
    url: data.link?.[data.link.length - 1]?.href || ''
  };
};
