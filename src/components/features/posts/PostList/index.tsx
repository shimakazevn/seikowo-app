import { PostCard } from '../PostCard';
import { TagList } from '../TagList';
import { AuthorInfo } from '../molecules/AuthorInfo';
import { type Post } from '../../types';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  error?: string;
}

export const PostList: React.FC<PostListProps> = ({ posts, loading, error }) => {
  if (loading) {
    return <div className="post-list-skeleton">Loading...</div>;
  }

  if (error) {
    return <div className="post-list-error">{error}</div>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <div key={post.id} className="post-list-item">
          <PostCard post={post} />
          <TagList tags={post.tags} />
          <AuthorInfo author={post.author} />
        </div>
      ))}
    </div>
  );
};
