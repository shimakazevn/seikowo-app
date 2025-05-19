import { elementId } from '../utils';

const elements = {
  get HOME_FEATURED_POST() {
    return elementId('HomeFeaturedPost');
  },
  get HOME_POST_CONTAINER() {
    return elementId('HomePostContainer');
  },
  get SIDEBAR_POPULAR_POST() {
    return elementId('singlePopularPost');
  },
  get SINGLEPOST() {
    return elementId('SinglePostContainer');
  },
  get FOOTER_SOCIAL_ICON() {
    return elementId('FooterSocialContainer');
  },
  get SEARCH_CONTAINER() {
    return elementId('SearchPostContainer');
  }
};

export default elements;
