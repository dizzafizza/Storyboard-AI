/**
 * Simple CORS Proxy for Storyboard AI
 * 
 * This script creates a simple proxy endpoint that can be used
 * to avoid CORS issues when making requests to external APIs.
 * It's designed to be used with the service worker.
 */

// Define the proxy endpoints and their target URLs
const PROXY_ROUTES = {
  '/openai-proxy/': 'https://api.openai.com/',
  '/image-proxy/': 'https://oaidalleapiprodscus.blob.core.windows.net/'
};

/**
 * Handle proxy requests
 * @param {Request} request - The original request
 * @returns {Promise<Response>} - The proxied response
 */
async function handleProxyRequest(request) {
  const url = new URL(request.url);
  
  // Check if this is a proxy request
  for (const [proxyPath, targetUrl] of Object.entries(PROXY_ROUTES)) {
    if (url.pathname.startsWith(proxyPath)) {
      // Extract the path after the proxy prefix
      const actualPath = url.pathname.replace(proxyPath, '');
      
      // Create the target URL
      const targetFullUrl = targetUrl + actualPath + url.search;
      console.log(`📡 Proxying request to: ${targetFullUrl}`);
      
      // Create new headers without origin-related headers
      const headers = new Headers();
      for (const [key, value] of request.headers.entries()) {
        // Skip origin-related headers
        if (!['origin', 'referer', 'host'].includes(key.toLowerCase())) {
          headers.append(key, value);
        }
      }
      
      // Create the new request
      const newRequest = new Request(targetFullUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
        mode: 'cors',
        credentials: 'omit' // Don't send cookies
      });
      
      try {
        // Forward the request
        const response = await fetch(newRequest);
        
        // Create a new response with CORS headers
        const newResponse = new Response(response.body, response);
        
        // Add CORS headers
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return newResponse;
      } catch (error) {
        console.error('❌ Proxy error:', error);
        return new Response(
          JSON.stringify({ error: 'Proxy request failed' }), 
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }
  }
  
  // Not a proxy request, return 404
  return new Response(
    JSON.stringify({ error: 'Not a valid proxy endpoint' }), 
    { 
      status: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

// Export the handler for use in service worker
if (typeof self !== 'undefined') {
  self.handleProxyRequest = handleProxyRequest;
} 