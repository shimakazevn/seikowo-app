export function extractSlug(pathname) {
  const match = pathname.match(/\/\d{4}\/\d{2}\/(.+)\.html$/);
  return match ? match[1] : null;
}