import { Router } from 'itty-router';

// Create a new router
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check endpoint
router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Link Downloader API',
    version: '1.0.0'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    }
  });
});

// Download info endpoint
router.post('/api/download/info', async (request) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

    // Check if it's a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // For now, return mock YouTube data
      // Note: ytdl-core doesn't work in Workers, you'd need to use YouTube API
      return new Response(JSON.stringify({
        platform: 'youtube',
        title: 'YouTube Video',
        description: 'This is a YouTube video',
        duration: '120',
        thumbnail: 'https://via.placeholder.com/320x180',
        author: 'YouTube Channel',
        url: url
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

    // For other URLs, try to get basic info
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');

      return new Response(JSON.stringify({
        platform: 'direct',
        url,
        contentType,
        size: contentLength ? parseInt(contentLength) : null,
        filename: url.split('/').pop() || 'download'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to get media info',
        message: error.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get media info',
      message: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
});

// Download start endpoint
router.post('/api/download/start', async (request) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

    // For direct file downloads
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        return new Response(blob, {
          headers: {
            'Content-Disposition': `attachment; filename="${url.split('/').pop() || 'download'}"`,
            'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
            ...corsHeaders
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Download failed',
          message: error.message
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }
    }

    // For YouTube downloads, return a message about limitations
    return new Response(JSON.stringify({
      message: 'YouTube downloads require additional setup with YouTube API in Cloudflare Workers',
      url: url
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Download failed',
      message: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
});

// 404 handler
router.all('*', () => new Response('Not Found', { 
  status: 404,
  headers: corsHeaders 
}));

// Main worker event listener
export default {
  async fetch(request, env, ctx) {
    return router.handle(request);
  }
};
