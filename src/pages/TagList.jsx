import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogConfig } from '../config';

function TagsList() {
  const [labelsCount, setLabelsCount] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=100`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const counts = {};
        (data.items || []).forEach(post => {
          if (post.labels) {
            post.labels.forEach(label => {
              counts[label] = (counts[label] || 0) + 1;
            });
          }
        });
        setLabelsCount(counts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  document.title = "Danh sách tags";
  if (loading) return <div className="text-center">Đang tải nhãn...</div>;

  const labels = Object.entries(labelsCount).sort((a, b) => b[1] - a[1]);

  if (labels.length === 0) return <div className="text-center">Không có nhãn nào.</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">Thể loại / Tags</h2>
      <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-3">
        {labels.map(([label, count]) => (
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
        ))}
      </div>
    </div>
  );
}

export default TagsList;
