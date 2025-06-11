export interface UserSettings {
  readPosts: ReadPost[];
  favoritePosts: FavoritePost[];
  mangaBookmarks: MangaBookmark[];
}

export interface ReadPost {
  id: string;
  title: string;
  lastReadAt: string;
  progress?: number;
}

export interface FavoritePost {
  id: string;
  title: string;
  addedAt: string;
}

export interface MangaBookmark {
  id: string;
  title: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
  coverImage?: string;
}
