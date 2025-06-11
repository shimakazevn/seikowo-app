import React, { useEffect, useRef } from 'react';
import Glide from '@glidejs/glide';
import PostCard from './PostCard';
import '@glidejs/glide/dist/css/glide.core.min.css';
import './PopularSlider.css';

interface Post {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MangaGlideSliderProps {
  posts: any[];
  title?: string;
  sliderId?: string;
  onLoadMore?: () => void;
}

const MangaGlideSlider: React.FC<MangaGlideSliderProps> = ({ 
  posts, 
  title, 
  sliderId = "main-glide", 
  onLoadMore 
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const glideInstance = useRef<Glide | null>(null);

  // Destroy Glide before post count changes
  useEffect(() => {
    return () => {
      if (glideInstance.current) {
        glideInstance.current.destroy();
        glideInstance.current = null;
      }
    };
  }, [posts.length, sliderId]);

  useEffect(() => {
    if (posts.length > 0 && sliderRef.current) {
      if (glideInstance.current) {
        glideInstance.current.destroy();
      }
      const glide = new Glide(`.${sliderId}`, {
        type: 'carousel',
        animationDuration: 800,
        animationTimingFunc: 'ease-in-out',
        perView: 5,
        gap: 24,
        focusAt: 'center',
        swipeThreshold: 40,
        dragThreshold: 60,
        autoplay: 3500,
        hoverpause: true,
        breakpoints: {
          1200: { perView: 4 },
          992: { perView: 3 },
          768: { perView: 2 },
          480: { perView: 1 }
        }
      });
      glide.on('run.after', () => {
        // If at the end of slider, call onLoadMore
        if (glide.index === posts.length - glide.settings.perView && typeof onLoadMore === 'function') {
          onLoadMore();
        }
      });
      glide.mount();
      glideInstance.current = glide;
      return () => glide.destroy();
    }
  }, [posts, sliderId, onLoadMore]);

  return (
    <div className={`glide ${sliderId}`} ref={sliderRef} style={{ width: '100%' }} key={posts.length}>
      {title && <h3 className="mb-3" style={{ color: '#23272A', fontWeight: 700 }}>{title}</h3>}
      <div className="glide__track" data-glide-el="track">
        <ul className="glide__slides">
          {posts.map((post, idx: number) => (
            <li className="glide__slide" key={post.id || idx} style={{ height: '100%' }}>
              <PostCard post={post} index={idx} />
            </li>
          ))} </ul>
      </div>
      <div className="glide__arrows" data-glide-el="controls">
        <button className="glide__arrow glide__arrow--left" data-glide-dir="<">&#8592;</button>
        <button className="glide__arrow glide__arrow--right" data-glide-dir=">">&#8594;</button>
      </div>
    </div>
  );
};

export default MangaGlideSlider; 