import { useState, useEffect } from 'react';
import { Post, MangaDetectionResult, TitleAnalysisResult } from '../types/post';

export const useMangaDetection = (post: Post | null) => {
  const [mangaImages, setMangaImages] = useState<string[]>([]);
  const [isMangaPost, setIsMangaPost] = useState<boolean>(false);
  const [hasDetectedManga, setHasDetectedManga] = useState<boolean>(false);

  // Helper function to analyze URL structure
  const analyzeUrlStructure = (url: string): MangaDetectionResult => {
    const analysis: MangaDetectionResult = {
      isMangaUrl: false,
      hasDateStructure: false,
      urlPattern: '',
      confidence: 0
    };

    if (!url) return analysis;

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);

      if (pathParts.length >= 3) {
        const [year, month, slug] = pathParts;
        const isValidYear = /^20\d{2}$/.test(year);
        const isValidMonth = /^(0[1-9]|1[0-2])$/.test(month);

        if (isValidYear && isValidMonth) {
          analysis.hasDateStructure = true;
          analysis.confidence += 20;

          const slugLower = slug.toLowerCase();
          const mangaPatterns = [
            /chapter[-_]?\d+/,
            /ch[-_]?\d+/,
            /vol[-_]?\d+/,
            /volume[-_]?\d+/,
            /part[-_]?\d+/,
            /page[-_]?\d+/,
            /doujin/,
            /hentai/,
            /manga/,
            /comic/,
            /oneshot/,
            /\[.*\]/,
            /\(.*\)/
          ];

          const matchedPatterns = mangaPatterns.filter(pattern => pattern.test(slugLower));
          if (matchedPatterns.length > 0) {
            analysis.isMangaUrl = true;
            analysis.confidence += matchedPatterns.length * 10;
            analysis.urlPattern = `Date structure + ${matchedPatterns.length} manga patterns`;
          }
        }
      }

      const fullUrl = url.toLowerCase();
      if (fullUrl.includes('manga') || fullUrl.includes('doujin') || fullUrl.includes('comic')) {
        analysis.isMangaUrl = true;
        analysis.confidence += 15;
      }

    } catch (error) {
      console.warn('URL analysis failed:', error);
    }

    return analysis;
  };

  // Helper function to analyze title patterns
  const analyzeTitlePatterns = (title: string): TitleAnalysisResult => {
    const analysis: TitleAnalysisResult = {
      isMangaTitle: false,
      patterns: [],
      confidence: 0
    };

    if (!title) return analysis;

    const titleLower = title.toLowerCase();
    const patterns = [
      { regex: /\[.*?\]/, name: 'brackets', weight: 15 },
      { regex: /\(.*?\)/, name: 'parentheses', weight: 10 },
      { regex: /chapter\s*\d+/i, name: 'chapter', weight: 25 },
      { regex: /ch\.?\s*\d+/i, name: 'ch_short', weight: 25 },
      { regex: /vol\.?\s*\d+/i, name: 'volume', weight: 20 },
      { regex: /part\s*\d+/i, name: 'part', weight: 15 },
      { regex: /page\s*\d+/i, name: 'page', weight: 10 },
      { regex: /oneshot/i, name: 'oneshot', weight: 20 },
      { regex: /doujinshi/i, name: 'doujinshi', weight: 30 },
      { regex: /hentai/i, name: 'hentai', weight: 30 },
      { regex: /english|japanese|chinese|korean|vietnamese/i, name: 'language', weight: 10 },
      { regex: /ongoing|completed|finished/i, name: 'status', weight: 5 },
      { regex: /\d+p\b/i, name: 'pages', weight: 15 },
      { regex: /full\s*color/i, name: 'full_color', weight: 10 },
      { regex: /manga/i, name: 'manga', weight: 20 },
      { regex: /comic/i, name: 'comic', weight: 20 },
      { regex: /\|\s*ch\s*\d+/i, name: 'pipe_chapter', weight: 25 }
    ];

    patterns.forEach(pattern => {
      if (pattern.regex.test(title)) {
        analysis.patterns.push(pattern.name);
        analysis.confidence += pattern.weight;
      }
    });

    analysis.isMangaTitle = analysis.confidence >= 20;
    return analysis;
  };

  useEffect(() => {
    if (post?.content) {
      console.log('Checking post for manga detection:', {
        title: post.title,
        labels: post.labels,
        hasContent: !!post.content
      });

      const detectMangaPost = () => {
        // Check for explicit manga tags
        const mangaTags = post.labels?.some(label => {
          const lowerLabel = label.toLowerCase();
          return ['manga', 'doujinshi', 'comic', 'CG'].some(tag =>
            lowerLabel.includes(tag)
          );
        });

        // Collect image URLs
        const imageUrls: string[] = [];
        const imgRegex = /<img[^>]+src="(.*?)"[^>]*>/g;
        let match;

        while ((match = imgRegex.exec(post.content)) !== null) {
          const src = match[1];
          if (src && !src.includes('data:image')) {
            imageUrls.push(src);
          }
        }

        // Analyze URL and title
        const urlAnalysis = analyzeUrlStructure(post.url || '');
        const titleAnalysis = analyzeTitlePatterns(post.title);

        // Determine if it's a manga post
        const isManga = mangaTags || 
                       imageUrls.length >= 5 || 
                       urlAnalysis.isMangaUrl || 
                       titleAnalysis.isMangaTitle;

        console.log('Manga Detection Result:', {
          title: post.title,
          labels: post.labels,
          mangaTags,
          collectedImages: imageUrls.length,
          urlAnalysis,
          titleAnalysis,
          isManga
        });

        return { isManga, imageUrls };
      };

      const result = detectMangaPost();

      if (result.isManga) {
        console.log('Setting as manga post with', result.imageUrls.length, 'images');
        setMangaImages(result.imageUrls);
        setIsMangaPost(true);
      } else {
        console.log('Setting as regular post');
        setMangaImages([]);
        setIsMangaPost(false);
      }
      setHasDetectedManga(true);
    }
  }, [post]);

  return {
    mangaImages,
    isMangaPost,
    hasDetectedManga,
    getCoverImage: () => mangaImages.length > 0 ? mangaImages[0] : '',
    extractLanguage: () => {
      const langTags = post?.labels?.find(label =>
        ['english', 'japanese', 'chinese', 'korean', 'vietnamese'].some(lang =>
          label.toLowerCase().includes(lang)
        )
      );
      return langTags || 'Unknown';
    }
  };
}; 