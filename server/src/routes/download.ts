import { Router, Request, Response } from 'express';
import ytdl from 'ytdl-core';
import axios from 'axios';
import { URL } from 'url';

const router = Router();

interface DownloadRequest {
  url: string;
  quality?: string;
  format?: string;
}

// Validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Get video info
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { url }: { url: string } = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // Check if it's a YouTube URL
    if (ytdl.validateURL(url)) {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      return res.json({
        platform: 'youtube',
        title: videoDetails.title,
        description: videoDetails.shortDescription,
        duration: videoDetails.lengthSeconds,
        thumbnail: videoDetails.thumbnails[0]?.url,
        author: videoDetails.author.name,
        formats: info.formats.map(format => ({
          quality: format.qualityLabel,
          container: format.container,
          hasAudio: format.hasAudio,
          hasVideo: format.hasVideo,
          itag: format.itag
        }))
      });
    }

    // For other URLs, try to get basic info
    const response = await axios.head(url, { timeout: 5000 });
    const contentType = response.headers['content-type'] || '';
    const contentLength = response.headers['content-length'];

    return res.json({
      platform: 'direct',
      url,
      contentType,
      size: contentLength ? parseInt(contentLength) : null,
      filename: url.split('/').pop() || 'download'
    });

  } catch (error: any) {
    console.error('Error getting info:', error);
    res.status(500).json({ 
      error: 'Failed to get media info',
      message: error.message 
    });
  }
});

// Download endpoint
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { url, quality = 'highest', format = 'mp4' }: DownloadRequest = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // YouTube download
    if (ytdl.validateURL(url)) {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      // Set response headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${videoDetails.title}.${format}"`);
      res.setHeader('Content-Type', 'video/mp4');

      // Stream the video
      const stream = ytdl(url, {
        quality: quality === 'highest' ? 'highestvideo' : quality,
        filter: format === 'mp3' ? 'audioonly' : 'videoandaudio'
      });

      stream.pipe(res);
      
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      });

      return;
    }

    // Direct file download
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 30000
    });

    const filename = url.split('/').pop() || 'download';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

    response.data.pipe(res);

  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed',
        message: error.message 
      });
    }
  }
});

export { router as downloadRouter };
