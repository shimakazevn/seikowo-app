// Thông tin cấu hình blog và OAuth

interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
}

interface BlogConfig {
  title?: string;
  description?: string;
  author?: string;
  social: SocialLinks;
  blogId?: string;
  apiKey?: string;
  clientId: string; // Required for Google OAuth
  clientSecret?: string;
  redirectUri?: string;
}

interface MenuItem {
  to: string;
  label: string;
}

export const blogConfig: BlogConfig = {
  title: import.meta.env.VITE_BLOG_TITLE,
  description: import.meta.env.VITE_BLOG_DESCRIPTION,
  author: import.meta.env.VITE_BLOG_AUTHOR,
  social: {
    twitter: import.meta.env.VITE_SOCIAL_TWITTER,
    github: import.meta.env.VITE_SOCIAL_GITHUB,
    linkedin: import.meta.env.VITE_SOCIAL_LINKEDIN,
  },
  blogId: import.meta.env.VITE_BLOG_ID,
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', // Provide an empty string as fallback
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  // Dynamic redirect URI based on environment
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:80'
      : 'https://seikowo-app.blogspot.com')
};

// Admin configuration
export const adminConfig = {
  // List of admin emails - add your admin emails here
  adminEmails: [
    'shimakazevn@gmail.com',
    'admin@seikowoteam.blogspot.com',
    // Add more admin emails as needed
  ],

  // Check if user is admin
  isAdmin: (userEmail?: string): boolean => {
    if (!userEmail) return false;
    return adminConfig.adminEmails.includes(userEmail.toLowerCase());
  }
};

// Menu chính của ứng dụng
export const mainMenuItems: MenuItem[] = [
  { to: '/p', label: 'Trang' },
  { to: '/tags', label: 'Thể loại' },
  { to: '/search', label: 'Tìm kiếm' },
  { to: '/history', label: 'Lịch sử' },
  // Admin hidden from main menu
  // { to: '/admin', label: 'Quản trị' }
];

// Menu thông tin, cập nhật đúng route cho privacy/terms
export const infoMenuItems: MenuItem[] = [
  { to: '/about', label: 'Giới thiệu' },
  { to: '/contact', label: 'Liên hệ' },
  { to: '/privacy-policy', label: 'Chính sách quyền riêng tư' },
  { to: '/terms-of-service', label: 'Điều khoản dịch vụ' }
]; 