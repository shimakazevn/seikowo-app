import React from 'react';
import { Skeleton } from '../atoms';

interface PostSkeletonProps {
  count?: number;
}

export const PostSkeleton: React.FC<PostSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="post-skeleton">
          <Skeleton style={{ width: '100%', height: '200px', marginBottom: '1rem' }} />
          <Skeleton style={{ width: '80%', height: '24px', marginBottom: '0.5rem' }} />
          <Skeleton style={{ width: '60%', height: '18px' }} />
        </div>
      ))}
    </>
  );
};

export default PostSkeleton;
