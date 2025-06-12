import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogConfig } from '../config';
import { fetchPages } from '../api';

interface PageData {
  title: string;
  content: string;
  published: string;
  url: string;
}

interface PageResponse {
  items: PageData[];
}

const Page: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const data = await fetchPages() as PageResponse;
        const found = data.items?.find((p: PageData) => {
          const pageSlug = p.url.split('/').pop();
          return pageSlug === slug;
        });
        setPage(found || null);
      } catch (error: any) {
        console.error(error);
      }
    };

    loadPage();
  }, [slug]);

  if (!page) {
    return (
      <div className="container py-5">
        <h3>Trang không tồn existence.</h3>
        <Link to="/" className="btn btn-secondary mt-3">← Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2>{page.title}</h2>
      <div className="text-muted mb-3">
        {new Date(page.published).toLocaleDateString()} </div>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
      <Link to="/" className="btn btn-outline-primary mt-4">← Quay lại</Link>
    </div>
  );
};

export default Page; 