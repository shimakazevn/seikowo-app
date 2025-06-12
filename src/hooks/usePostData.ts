import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Post } from '../types/post';
import { loadPost } from '../utils/postLoader';

export const usePostData = () => {
  const { year, month, slug: rawSlug } = useParams<{ year: string; month: string; slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clean and process the slug
  const slug = React.useMemo(() => {
    if (!year || !month || !rawSlug) return '';

    try {
      const decodedSlug = decodeURIComponent(rawSlug);
      const cleanSlug = decodedSlug.replace(/\.html$/, '');
      return `${year}/${month}/${cleanSlug}`;
    } catch (e) {
      console.warn('URL decoding failed, using original:', e);
      const cleanSlug = rawSlug.replace(/\.html$/, '');
      return `${year}/${month}/${cleanSlug}`;
    }
  }, [year, month, rawSlug]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await loadPost(slug);
        setPost(found);
        if (!found) setError('Không tìm thấy bài viết');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Lỗi khi tải bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Update document title when post is loaded
  useEffect(() => {
    if (post?.title) {
      document.title = post.title;
    } else {
      document.title = 'Đang tải bài viết...';
    }

    return () => {
      document.title = 'Blog';
    };
  }, [post]);

  return {
    post,
    loading,
    error,
    slug
  };
}; 