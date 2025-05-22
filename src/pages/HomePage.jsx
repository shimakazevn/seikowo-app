import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogConfig } from '../config';
import PopularSlider from '../component/HomePage/PopularSlider';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';


const SkeletonCard = () => (
  <div className="card h-100 border-0 shadow-sm" aria-hidden="true">
    <div
      className="card-img-top placeholder rounded"
      style={{
        height: '350px',
        width: '100%',
        backgroundColor: '#e9ecef'
      }}
    ></div>
    <div className="card-body d-flex flex-column m-0 p-2">
      <h6 className="card-title placeholder-glow">
        <span className="placeholder col-12 "></span>
        <span className="placeholder col-11 mt-1 "></span>
      </h6>
    </div>
  </div>
);

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(12);
  const [isCacheExpired, setIsCacheExpired] = useState(false);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const nextPosts = posts.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);
  const currentPosts = posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  function extractImage(content) {
    const match = content.match(/<img[^>]+src="([^"]+)"/);
    return match ? match[1] : null;
  }


  document.title = "Trang chủ";

  // Hàm để lấy slug từ URL
  const getSlugFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1);
    } catch {
      return '';
    }
  };
  // Hàm để lấy slug từ bài viết
  function getPostCount(width) {
    if (width <= 768) {
      return 4; // Điện thoại
    } else if (width <= 991) {
      return 6; // Máy tính bảng
    } else if (width <= 1200) {
      return 8; // PC  HD+
    } else if (width <= 1400) {
      return 10; // PC Full HD
    } else {
      return 12; // Màn hình lớn (2560x1440)
    }
  }
  // Hàm để lấy số lượng bài viết trên mỗi trang
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    // Hàm xử lý sự kiện vuốt
    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    // Hàm xử lý sự kiện kết thúc vuốt
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const distance = touchEndX - touchStartX;

      // Vuốt trái để sang trang sau
      if (distance < -50 && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }

      // Vuốt phải để quay lại trang trước
      if (distance > 50 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    };
    // Thêm sự kiện touchstart và touchend vào vùng vuốt
    const container = document.getElementById('swipe-area');
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
    }
    // Xóa sự kiện khi component unmount
    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [currentPage, totalPages]);
  // Lắng nghe sự thay đổi kích thước cửa sổ
  useEffect(() => {
    const width = window.innerWidth;
    const cacheExpiration = 10 * 60 * 1000;
    const cacheKey = "cachedPosts";
    const cacheTimeKey = "cacheTime";
    setPostsPerPage(getPostCount(width));
    // Lấy dữ liệu từ localStorage nếu có
    const fetchPosts = async () => {
      setLoading(true);
      // Kiểm tra nếu đã có dữ liệu trong localStorage
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setPosts(JSON.parse(cachedData)); // Sử dụng cache
        setTimeout(() => {
          setLoading(false);
        }, 500);
        return;
      }
      // Nếu chưa có, fetch API
      try {
        const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=200`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        // Kiểm tra xem có dữ liệu hay không
        const data = await res.json();
        setPosts(data.items || []);

        // Lưu vào localStorage để lần sau dùng lại
        localStorage.setItem(cacheKey, JSON.stringify(data.items));
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
        setError(error.message);
        setPosts([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };
    fetchPosts();
    // Xóa cache nếu đã quá thời gian quy định
    const cacheTime = localStorage.getItem(cacheTimeKey);
    if (cacheTime && Date.now() - cacheTime > cacheExpiration) {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimeKey);
    }
    localStorage.setItem(cacheTimeKey, Date.now());
    // Xóa cache khi người dùng nhấn nút "Xóa cache"
    // Hàm để xóa cache
    if (isCacheExpired === true) {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimeKey);
      setPosts([]); // Xóa dữ liệu trong state
      setLoading(true); // Đặt lại trạng thái loading
      localStorage.setItem(cacheTimeKey, Date.now());
      setIsCacheExpired(false); // Đặt lại trạng thái isCacheExpired
      setCurrentPage(1); // Đặt lại trang hiện tại về 1
    }
  }, [blogConfig.blogId, blogConfig.apiKey, isCacheExpired]);

  useEffect(() => {
    const preloadContainer = document.createElement("div");
    preloadContainer.hidden = true; // Ẩn hoàn toàn
    document.body.appendChild(preloadContainer);
    nextPosts.forEach(item => {
      const thumbnail = extractImage(item.content);
      if (thumbnail) {
        const img = document.createElement("img");
        img.src = thumbnail.replace(/(?<=\/)(w\d+-h\d+|s\d+)(?=\.jpg)/g, "s320");
        preloadContainer.appendChild(img);
        img.onload = () => {
          if (preloadContainer.parentNode) {
            preloadContainer.parentNode.removeChild(preloadContainer); // Xóa div ngay sau khi preload
          }
        };

      }
    });

  }, [nextPosts]);
  const skeletonCount = 10;
  // Số lượng skeleton card
  if (loading) {
    return (
      <div className="container my-4">
        <h3 className="mb-4">Bài viết mới nhất</h3>
        <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={`skeleton-${index}`} className="col">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="container my-4 text-center">
        <h3 className="mb-3">Đã xảy ra lỗi</h3>
        <p>Không thể tải danh sách bài viết. Vui lòng thử lại sau.</p>
        <p><em>Chi tiết lỗi: {error}</em></p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* <PopularSlider /> */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0" style={{ cursor: 'pointer' }} onClick={() => setIsCacheExpired(true)}>Bài viết mới nhất</h3>
        {totalPages > 1 && (
          <div className="btn-group">
            <button
              className="btn btn-outline-light btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >←</button>
            <button
              className="btn btn-outline-light btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >→</button>
          </div>
        )}
      </div>

      {posts.length === 0 && !loading && !error && (
        <div className="text-center py-5">
          <p className="lead">Hiện chưa có bài viết nào.</p>
        </div>
      )}
      <div id="swipe-area" className="row g-3 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6">
        {currentPosts.map(item => {
          const date = new Date(item.updated);
          const description = item.content ? item.content.replace(/<[^>]+>/g, '') : 'Xem chi tiết...';
          const thumbnail = extractImage(item.content);
          const updatedUrlThumbnail = thumbnail.replace(/(?<=\/)(w\d+-h\d+|s\d+)(?=\.jpg)/g, "s320");

          return (
            <div key={item.id} className="col d-flex">
              <div className="card h-100 text-decoration-none border-0 bg-transparent">
                <Link to={`/${getSlugFromUrl(item.url)}`} className="text-decoration-none">
                  <div className="card-custom-hover position-relative">
                    <LazyLoadImage
                      src={updatedUrlThumbnail}
                      alt={item.title}
                      effect="blur"
                      wrapperProps={{
                        style: { transitionDelay: "2.5ms" },
                      }}
                      className="card-img"
                    />
                    <div className="card-description">{description}</div>
                  </div>
                  <h6 className="card-custom-title card-title fade-in text-white">{item.title}</h6>
                </Link>
                <div className="card-footer bg-transparent border-0 p-0 mt-auto">
                  <div className="d-flex justify-content-between align-items-center">
                    {item.labels && item.labels.length > 0 ? (
                      <div className="badge bg-dark text-white p-1 rounded fade-in">
                        <Link
                          to={`/tag/${encodeURIComponent(item.labels[0])}`}
                          className="text-decoration-none text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.labels[0]}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-muted fade-in"></span>
                    )}
                    <div className="badge bg-dark text-white p-1 rounded fade-in">
                      {date.toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
