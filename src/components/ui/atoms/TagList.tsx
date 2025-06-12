import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogConfig } from '@config';
import { fetchPosts } from '@api';

interface Post {
  labels?: string[];
}

interface PostResponse {
  items: any[];
}

interface LabelsCount {
  [key: string]: number;
}

const TagsList: React.FC = () => {
  const [labelsCount, setLabelsCount] = useState<LabelsCount>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await fetchPosts(100) as PostResponse;
        const counts: LabelsCount = {};
        (data.items || []).forEach(post => {
          if (post.labels) {
            post.labels.forEach((label: string) => {
              counts[label] = (counts[label] || 0) + 1;
            });
          }
        });
        setLabelsCount(counts);
      } catch (error: any) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  document.title = "Danh sách tags";
  if (loading) return <div className="text-center">Đang tải nhãn...</div>;

  const labels = Object.entries(labelsCount).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);

  if (labels.length === 0) return <div className="text-center">Không có nhãn nào.</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">Thể loại / Tags</h2>
      <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-3">
        {labels.map(([label, count]: [string, number]) => (
          <div className="col" key={label}>
            <Link to={`/tag/${encodeURIComponent(label)}`} className="text-decoration-none">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center">
                  <h6 className="card-title mb-1 text-primary text-truncate">{label}</h6>
                  <span className="badge bg-dark">{count} bài</span>
                </div>
              </div>
            </Link>
          </div>
        ))} </div>
    </div>
  );
};

export default TagsList; 