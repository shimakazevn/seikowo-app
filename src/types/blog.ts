import { User } from './common';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  publishDate: string;
  modifiedDate?: string;
  author: User;
  tags: string[];
  comments: Comment[];
  status: 'draft' | 'published' | 'archived';
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
  likes: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  posts: number;
}
