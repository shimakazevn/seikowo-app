import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogConfig } from '../config';
import { fetchPostsByTag } from '../api';

interface Post {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
}

interface PostResponse {
  items: any[];
}

const PostsByTag: React.FC = () => {
  const { label } = useParams<{ label: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getSlugFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // ex: "2025/05/slug.html"
    } catch {
      return '';
    }
  };

  const getThumbnail = (post: Post): string => {
    const media = post.content?.match(/<img[^>]+src="([^">]+)"/);
    return media ? media[1] : 'https://www.protean.co.jp/wp-content/themes/protean/images/no-image.gif';
  };

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPostsByTag(label || '') as PostResponse;
        setPosts(data.items || []);
      } catch (error: any) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [label]);

  if (loading) return <div className="text-center">Đang tải bài viết...</div>;

  return (
    <div className="container">
      <h2 className="mb-4">Thể loại: <span className="text-primary">{label}</span></h2>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
        {posts.map((post) => {
          const slugPath = getSlugFromUrl(post.url);
          const date = new Date(post.published);
          const thumb = getThumbnail(post);

          return (
            <div className="col" key={post.id}>
              <Link to={`/${slugPath}`} className="text-decoration-none text-dark">
                <div className="card h-100 shadow-sm">
                  <img src={thumb} className="card-img-top" alt={post.title} style={{ height: 300, objectFit: 'cover' }} />
                  <div className="card-body">
                    <h5 className="card-title text-truncate">{post.title}</h5>
                    <p className="card-text"><small className="text-muted">{date.toLocaleDateString()} </small></p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })} </div>
    </div>
  );
};

export default PostsByTag; 