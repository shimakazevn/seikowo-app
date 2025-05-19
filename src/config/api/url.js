import { isLocalhost, blogId } from 'utils';

const blogConfig = window.__CODEPELAJAR_CONFIG__;
const development = {
  url: {
    api: 'https://www.googleapis.com/blogger/v3',
    feed: 'https://seikowo-app.blogspot.com//feeds',
    asset: 'https://seikowo-app.blogspot.com/',
    origin: 'https://seikowo-app.blogspot.com/'
  },
  google: {
    apiKey: 'AIzaSyAygK6w9GS-UuEqzlfYr77YSAv35Mrmfvc',
    blogId
  },
  disqus: {
    shortName: 'seikowo-app'
  },
  cse: {
    url:
      blogConfig.cseUrl ||
      'https://cse.google.com/cse.js?cx=005178091281942032751:rimwwhz9ofx'
  }
};

const production = {
  url: {
    api: 'https://www.googleapis.com/blogger/v3',
    feed: `${window.location.origin}/feeds`,
    asset: window.location.origin,
    origin: window.location.origin
  },
  google: {
    apiKey: 'AIzaSyAygK6w9GS-UuEqzlfYr77YSAv35Mrmfvc',
    blogId: blogConfig.blogId || blogId
  },
  disqus: {
    shortName: blogConfig.disqus || null
  },
  cse: {
    url:
      blogConfig.cseUrl ||
      'https://cse.google.com/cse.js?cx=005178091281942032751:rimwwhz9ofx'
  }
};

export const config = isLocalhost ? development : production;

const baseUrl = {
  summary: `${config.url.feed}/posts/summary`,
  postFeed: `${config.url.feed}/posts/default`,
  post: `${config.url.api}/blogs/${config.google.blogId}/posts`,
  page: `${config.url.api}/blogs/${config.google.blogId}/pages`
};

export default baseUrl;
