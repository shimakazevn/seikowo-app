// Vite proxy plugin for ATOM feeds and Blogger API
export function atomProxyPlugin() {
  return {
    name: 'blogger-proxy',
    configureServer(server) {
      // ATOM feed proxy
      server.middlewares.use('/api/atom-proxy', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = url.searchParams.get('url');
          
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          console.log(`🔄 Proxying ATOM request to: ${targetUrl}`);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
              'Accept': 'application/atom+xml, application/xml, text/xml, */*'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Proxy error: ${response.statusText}`);
            return;
          }

          const xmlText = await response.text();
          
          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.setHeader('Content-Type', 'application/xml');
          
          res.end(xmlText);
          console.log(`✅ Proxied ATOM feed successfully`);
        } catch (error) {
          console.error('❌ ATOM Proxy error:', error);
          res.statusCode = 500;
          res.end(`Proxy error: ${error.message}`);
        }
      });

      // Comments ATOM feed proxy
      server.middlewares.use('/api/atom-comments', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const maxResults = url.searchParams.get('max-results') || '200';
          const orderby = url.searchParams.get('orderby') || 'published';
          const reverse = url.searchParams.get('reverse') || 'false';

          const targetUrl = `https://seikowo-app.blogspot.com/feeds/comments/default?max-results=${maxResults}&orderby=${orderby}&reverse=${reverse}`;

          console.log(`🔄 Proxying comments ATOM request to: ${targetUrl}`);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
              'Accept': 'application/atom+xml, application/xml, text/xml, */*'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Proxy error: ${response.statusText}`);
            return;
          }

          const xmlText = await response.text();

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.setHeader('Content-Type', 'application/xml');

          res.end(xmlText);
          console.log(`✅ Proxied comments ATOM feed successfully`);
        } catch (error) {
          console.error('❌ Comments ATOM Proxy error:', error);
          res.statusCode = 500;
          res.end(`Proxy error: ${error.message}`);
        }
      });

      // Generic proxy for any URL (development only)
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = url.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          console.log(`🔄 Generic proxy request to: ${targetUrl}`);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
              'Accept': 'application/atom+xml, application/xml, text/xml, application/json, */*'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Proxy error: ${response.statusText}`);
            return;
          }

          const contentType = response.headers.get('content-type') || '';
          let responseData;

          if (contentType.includes('json')) {
            responseData = await response.text(); // Return as text to avoid double parsing
            res.setHeader('Content-Type', 'application/json');
          } else {
            responseData = await response.text();
            res.setHeader('Content-Type', 'application/xml');
          }

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          res.end(responseData);
          console.log(`✅ Generic proxy successful`);
        } catch (error) {
          console.error('❌ Generic Proxy error:', error);
          res.statusCode = 500;
          res.end(`Proxy error: ${error.message}`);
        }
      });

      // Blogger JSON API proxy
      server.middlewares.use('/api/blogger-json', async (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = url.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          console.log(`🔄 Proxying Blogger JSON request to: ${targetUrl}`);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
              'Accept': 'application/json, */*'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Proxy error: ${response.statusText}`);
            return;
          }

          const jsonData = await response.json();

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.setHeader('Content-Type', 'application/json');

          res.end(JSON.stringify(jsonData));
          console.log(`✅ Proxied Blogger JSON successfully`);
        } catch (error) {
          console.error('❌ Blogger JSON Proxy error:', error);
          res.statusCode = 500;
          res.end(`Proxy error: ${error.message}`);
        }
      });
    }
  };
}
