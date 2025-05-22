import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Đổi đường dẫn RSS tại đây cho blog bạn
const BLOG_RSS_URL = 'https://seikowoteam.blogspot.com/feeds/posts/default?alt=rss';

const RSS_PROXY = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(BLOG_RSS_URL)}`;

function RSSHomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(RSS_PROXY)
      .then(res => res.json())
      .then(data => {
        const postsData = data.items.map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.content,
        }));
        setPosts(postsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải RSS feed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center my-5">Đang tải dữ liệu...</div>;
  return (
    <div className="container py-4">
      <h3>Bài viết mới nhất từ RSS</h3>
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {posts.map((post, idx) => (
          <div className="col" key={idx}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{post.title}</h5>
                <p className="card-text" dangerouslySetInnerHTML={{ __html: post.content }}></p>
              </div>
              <div className="card-footer">
                <small className="text-muted">{new Date(post.pubDate).toLocaleDateString()}</small> |{" "}
                <a href={post.link} target="_blank" rel="noopener noreferrer">Xem chi tiết</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RSSHomePage;
