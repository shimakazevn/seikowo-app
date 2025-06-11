import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BlogPost, User } from '../types';

interface BlogState {
  posts: BlogPost[];
  currentPost: BlogPost | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setPosts: (posts: BlogPost[]) => void;
  setCurrentPost: (post: BlogPost | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set) => ({
      posts: [],
      currentPost: null,
      loading: false,
      error: null,

      setPosts: (posts) => set({ posts }),
      setCurrentPost: (post) => set({ currentPost: post }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error })
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        posts: state.posts,
        currentPost: state.currentPost
      })
    }
  )
);
