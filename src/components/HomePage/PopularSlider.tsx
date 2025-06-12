import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Glide from '@glidejs/glide';
import { blogConfig } from '../../config';
import { fetchPosts } from '../../api';
import { Post } from '../../types/global';
import './PopularSlider.css';

function getThumbnail(post: Post): string {
  const img = post.content?.match(/<img[^>]+src="([^">]+)"/);
  return img ? img[1] : 'https://picsum.photos/300/300?random=1';
}

function getSlug(post: Post): string {
  const url = new URL(post.url || '');
  return url.pathname.replace(/^\/+|\/+$/g, '');
}

const PopularSlider: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts(10);
        if (data.items) setPosts(data.items);
      } catch (error: any) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      new Glide('.glide', {
        type: 'carousel',
        animationDuration: 800,
        animationTimingFunc: 'ease-in-out',
        autoplay: 3500,
        perView: 2,
        gap: 16,
        breakpoints: {
          992: { perView: 2 },
          576: { perView: 1 }
        }
      }).mount();
    }
  }, [posts]);

  return (
    <div className="glide mb-5">
      <h3 className="text-white mb-3">🔥 Bài viết nổi bật</h3>
      <div className="glide__track" data-glide-el="track">
        <ul className="glide__slides">
          {(loading ? Array(3).fill(null) : posts).map((post, idx) => {
            if (!post) {
              return (
                <li key={idx} className="glide__slide">
                  <div className="row">
                    <div className="col-6">
                      <div className="skeleton-card" />
                    </div>
                    <div className="col-6">
                      <div className="skeleton-card" />
                    </div>
                  </div>
                </li>
              );
            }

            const thumbnail = getThumbnail(post);
            const slug = getSlug(post);
            const date = new Date(post.published || '').toLocaleDateString('vi-VN');
            const tags = post.labels?.slice(0, 5) || [];
            const excerpt = post.content?.replace(/<[^>]+>/g, '').slice(0, 520) || '';

            return (
              <li className="glide__slide" key={post.id}>
                <div className="post-card">
                  <div className="post-thumb">
                    <img src={thumbnail} alt={post.title} />
                  </div>
                  <div className="post-body">
                    <div
                      className="post-bg-blur"
                      style={{ backgroundImage: `url(${thumbnail})` }}
                    />
                    <div className="post-content">
                      <Link to={`/${slug}`} className="text-decoration-none text-white">
                        <h5 className="post-title">{post.title}</h5>
                      </Link>
                      <div className="mt-2 d-flex flex-wrap gap-1">
                        {tags.map((tag: string, i: number) => (
                          <Link
                            key={i}
                            to={`/tag/${encodeURIComponent(tag)}`}
                            className="badge bg-info-subtle text-decoration-none"
                          >
                            {tag}
                          </Link>
                        ))} </div>
                      <small className="post-excerpt m-2">{excerpt}...</small>
                    </div>
                  </div>
                </div>
              </li>
            );
          })} </ul>
      </div>
    </div>
  );
};

export default PopularSlider; 