import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogConfig } from '../config';
import { fetchPosts, searchPosts } from '../api';

function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState('');
  const [year, setYear] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagsList, setTagsList] = useState([]);
  const [yearsList, setYearsList] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageTokens, setPrevPageTokens] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Lấy danh sách tag từ Blogger API
  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await fetchPosts(500);
        if (!data.items) return;

        const allTags = new Set();
        const allYears = new Set();

        data.items.forEach(post => {
          // Tags
          if (post.labels) {
            post.labels.forEach(label => allTags.add(label));
          }

          // Year
          if (post.published) {
            const y = new Date(post.published).getFullYear();
            allYears.add(y);
          }
        });

        // Sắp xếp năm giảm dần
        setYearsList(Array.from(allYears).sort((a, b) => b - a));
        setTagsList(Array.from(allTags).sort());
      } catch (error) {
        console.error(error);
      }
    };

    loadTags();
  }, []);

  // Hàm tách slug từ URL đầy đủ
  function getSlugFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // bỏ dấu "/" đầu
    } catch {
      return ''; // fallback
    }
  }

  const fetchPosts = async (pageToken = null, isNext = true) => {
    setLoading(true);
    setError(null);

    try {
      const data = await searchPosts({
        keyword,
        tag,
        year,
        pageToken,
        maxResults: 10
      });

      setPosts(data.items || []);
      setNextPageToken(data.nextPageToken || null);

      if (isNext) {
        if (pageToken) setPrevPageTokens(prev => [...prev, pageToken]);
        else setPrevPageTokens([]);
        setCurrentPage(prev => (pageToken ? prev + 1 : 1));
      } else {
        setPrevPageTokens(prev => prev.slice(0, -1));
        setCurrentPage(prev => (prev > 1 ? prev - 1 : 1));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    setPrevPageTokens([]);
    setCurrentPage(1);
    fetchPosts(null);
  };

  const handleNext = () => {
    if (!nextPageToken) return;
    fetchPosts(nextPageToken, true);
  };

  const handlePrev = () => {
    if (prevPageTokens.length === 0) return;
    const prevToken = prevPageTokens[prevPageTokens.length - 2] || null;
    fetchPosts(prevToken, false);
  };

  document.title = "Tìm kiếm bài viết";
  return (
    <div className="container my-4">
      <h2>Tìm kiếm bài viết</h2>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <input
              type="search"
              className="form-control"
              placeholder="Từ khóa"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={tag}
              onChange={e => setTag(e.target.value)}
            >
              <option value="">-- Chọn nhãn (tag) --</option>
              {tagsList.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option value="">-- Chọn năm --</option>
              {yearsList.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <button type="submit" className="btn btn-primary w-100">
              Tìm kiếm
            </button>
          </div>
        </div>
      </form>

      {loading && <div>Đang tải kết quả...</div>}

      {error && <div className="text-danger mb-3">Lỗi: {error}</div>}

      {!loading && posts.length === 0 && <div>Không tìm thấy bài viết nào.</div>}

      <ul className="list-group mb-4">
        {posts.map(post => (
            <li key={post.id} className="list-group-item">
                <Link to={`/${getSlugFromUrl(post.url)}`}>{post.title}</Link>
                <br />
                <small className="text-muted">{new Date(post.published).toLocaleDateString()}</small>
            </li>
        ))}
      </ul>

      {posts.length > 0 && (
        <div className="d-flex justify-content-between mb-4">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={prevPageTokens.length <= 1}
          >
            ← Trang trước
          </button>
          <div>Trang {currentPage}</div>
          <button className="btn btn-secondary" onClick={handleNext} disabled={!nextPageToken}>
            Trang sau →
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
