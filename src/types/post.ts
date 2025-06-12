export interface Post {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  labels?: string[];
  data?: Post;
}

export interface PostContentProps {
  post: Post;
}

export interface ErrorAlertProps {
  error: string;
}

export interface MangaDetectionResult {
  isMangaUrl: boolean;
  hasDateStructure: boolean;
  urlPattern: string;
  confidence: number;
}

export interface TitleAnalysisResult {
  isMangaTitle: boolean;
  patterns: string[];
  confidence: number;
}

export interface PostStats {
  likes: number;
  comments: number;
  bookmarks: number;
  readingTime: number;
  publishedDate: string;
}

export interface PostHeaderProps {
  title: string;
  publishedDate: string;
  author: string;
  showTagFilter?: boolean;
  onTagSelect?: (tag: string) => void;
}

export interface PostSidebarProps {
  stats: PostStats;
  tags: string[];
  author: string;
  onBookmark: () => void;
}

export interface MangaPostViewProps {
  title: string;
  coverImage: string;
  images: string[];
  publishedDate: string;
  tags: string[];
  language: string;
  author: string;
  postId: string;
  url: string;
  onRead: (startPage?: number) => void;
  onBookmark: () => void;
} 