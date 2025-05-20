import { React } from 'libraries';
import _ from 'lodash';
import { View,  Button } from 'components/atoms';
import { PostCard } from 'components/molecules';
import { callPosts } from 'services';
import { createAuthor, getImage } from 'utils';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

class FeatureBlock extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isLoaded: false,
      nextToken: null,
      showImage: false,
      posts: []
    };
  }

  componentDidMount() {
    this.init();
    window.addEventListener('mousewheel', this.imageLoading);
    window.addEventListener('touchmove', this.imageLoading);
  }

  componentDidUpdate(prevProps, prevState) {
    const { nextToken } = this.state;
    if (prevState.nextToken && !nextToken) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        isLoaded: true
      });
      return false;
    }
    return true;
  }

  componentWillUnmount() {
    window.removeEventListener('mousewheel', this.imageLoading);
    window.removeEventListener('touchmove', this.imageLoading);
  }

  init = async () => {
    try {
      const { nextToken, posts } = this.state;
      const payload = {
        params: {
          pageToken: nextToken
        }
      };
      await this.setState({ isLoading: true });
      const response = nextToken ? await callPosts(payload) : await callPosts();
      setTimeout(() => {
        if (nextToken) {
          return this.setState({
            isLoading: false,
            posts: [...posts, ..._.get(response, 'items', [])],
            nextToken: _.get(response, 'nextPageToken', null)
          });
        }
        return this.setState({
          isLoading: false,
          posts: _.get(response, 'items', []),
          nextToken: _.get(response, 'nextPageToken', null)
        });
      }, 2000);
    } catch (err) {
      this.setState({
        isLoading: false,
        isLoaded: true
      });
    }
  };

  imageLoading = () => {
    const { showImage } = this.state;
    if (!showImage) {
      this.setState({
        showImage: true
      });
    }
  };

  renderSkeleton = () =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
    
      <View key={value} className="o-post-block__column">
        <SkeletonTheme baseColor="#dedede" highlightColor="#444">
          <Skeleton
          style={{
            paddingBottom: '140%',
            width: '100%',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            margin: 0,
            height: 0,
          }}
          />
        </SkeletonTheme>
        <SkeletonTheme baseColor="rgba(71, 71, 71, 0.1450980392)" highlightColor="#444">
          <Skeleton
            style={{
              // paddingBottom: '25%',
              width: '100%',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
              margin: 0,
              height: 70,
            }}
          />
        </SkeletonTheme>
      </View>
    ));

  render() {
    const { posts, isLoading, isLoaded, showImage } = this.state;
    return (
      <View className="o-post-block__wrapper">
        <View className="o-post-block__row">
          {posts &&
            posts.map((post, index) => (
              <View key={index} className="o-post-block__column">
                <PostCard
                  url={post.url}
                  title={post.title}
                  image={ 
                          showImage ? getImage(_.get(post, 'images[0].url', '')) : 
                          <Skeleton style={{ paddingBottom: '140%', width: '100%', marginBottom: 24, borderRadius: 4 }}/>
                        }
                  author={createAuthor(post.author)}
                  label={post.labels}
                />
              </View>
            ))}
          {isLoading && this.renderSkeleton()}
        </View>
        {!isLoaded && !isLoading && (
          <View className="text-align-center">
            <Button onPress={this.init} variant="primary">
              Load More
            </Button>
          </View>
        )}
      </View>
    );
  }
}

export default FeatureBlock;
