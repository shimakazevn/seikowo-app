import React from 'react';
import { Helmet } from 'react-helmet-async';
import { blogConfig } from '../config';

export const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author = blogConfig.author,
  publishedTime,
  modifiedTime,
  tags = []
}) => {
  const siteTitle = blogConfig.title;
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = blogConfig.description;
  const defaultImage = blogConfig.defaultImage;
  const siteUrl = blogConfig.url;

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />

      {/* Open Graph meta tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={url || siteUrl} />
    </Helmet>
  );
};

export default SEO; 