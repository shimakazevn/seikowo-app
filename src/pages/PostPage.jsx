import React, { useEffect, useState } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { blogConfig } from '../config';

function PostPage() {
  const location = useLocation();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPosts = async () => {
      const cacheKey = "cachedPosts"; // Định danh cho cache
      setLoading(true);
      // Kiểm tra nếu đã có dữ liệu trong localStorage
      const cData = localStorage.getItem(cacheKey);
      if (cData) {
        const cachedData = JSON.parse(cData);
        const found = cachedData?.find(p => {
          const postSlug = p.url.split('/').pop(); // lấy phần cuối của URL
          return postSlug === slug; // so sánh slug từ URL trình duyệt
         
        });
        setTimeout(() => {
          setPost(found || null);
          setLoading(false);
        }, 1250);
        
        return;
      }

      // Nếu chưa có, fetch API
      try {
        const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=200`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);

        const data = await res.json();
        setPost(data.items || []);

        // Lưu vào localStorage để lần sau dùng lại
        localStorage.setItem(cacheKey, JSON.stringify(data.items));
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
        setError(error.message);
        setPost([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
    // setLoading(true);
    // // const url = `https://content-blogger.googleapis.com/v3/blogs/${blogConfig.blogId}/posts/bypath?path=${encodeURIComponent(location.pathname)}&key=${blogConfig.apiKey}`;

    // fetch(url)
    //   .then(res => res.json())
    //   .then(data => {
    //     setPost(data || null);
    //   })
    //   .catch(() => setPost(null))
    //   .finally(() => setLoading(false)); // Kết thúc loading
  }, [slug]);
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải bài viết...</span>
        </div>
      </div>
    );
  }


  if (!post) {
    return (
      <div className="container py-5">
        <h3>Bài viết không tồn tại.</h3>
        <Link to="/" className="btn btn-secondary mt-3">← Quay lại trang chủ</Link>
      </div>
    );
  }
  document.title = post.title;
  return (
    <div className="container py-4">
      <h2>{post.title}</h2>
      <div className="text-muted mb-3">
        {new Date(post.published).toLocaleDateString()}
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      <Link to="/" className="btn btn-outline-primary mt-4">← Quay lại</Link>
    </div>
  );
}

export default PostPage;
