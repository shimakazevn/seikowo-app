import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogConfig } from '../config';
import { fetchPages } from '../api';

interface PageData {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
}

function extractImage(content: string): string | null {
  const div = document.createElement('div');
  div.innerHTML = content;
  const img = div.querySelector('img');
  return img ? img.src : null;
}

const PagesList: React.FC = () => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPages = async () => {
      try {
        const data = await fetchPages();
        setPages(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  document.title = "Danh sách Trang";
  if (loading) return <div className="text-center my-4">Đang tải trang...</div>;
  if (pages.length === 0) return <div className="text-center my-4">Không có trang nào.</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">Danh sách Trang Tĩnh</h2>
      <div className="row row-cols-1 row-cols-md-2 g-4">
        {pages.map((page) => {
          const urlParts = page.url.split('/p/');
          const slug = urlParts[1]?.replace('.html', '') || '';
          const linkPath = `/p/${slug}.html`;
          const date = new Date(page.published);
          const thumbnail = extractImage(page.content);

          return (
            <div className="col" key={page.id}>
              <Link to={linkPath} className="text-decoration-none text-dark">
                <div className="card h-100 shadow-sm">
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt={page.title}
                      className="card-img-top"
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{page.title}</h5>
                    <small className="text-muted mt-auto">{date.toLocaleDateString()} </small>
                  </div>
                </div>
              </Link>
            </div>
          );
        })} </div>
    </div>
  );
};

export default PagesList; 