"use client";

import { useState } from 'react';
import { Download, Link, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface MediaInfo {
  platform: string;
  title?: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
  author?: string;
  formats?: Array<{
    quality: string;
    container: string;
    hasAudio: boolean;
    hasVideo: boolean;
    itag: number;
  }>;
  contentType?: string;
  size?: number;
  filename?: string;
}

export function DownloadForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  const handleGetInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setMediaInfo(null);

    try {
      const response = await fetch('http://localhost:5000/api/download/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get media information');
      }

      const data = await response.json();
      setMediaInfo(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get media information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;

    setDownloadStatus('downloading');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/download/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = mediaInfo?.title || mediaInfo?.filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed');
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaInfo) {
      handleGetInfo();
    } else {
      handleDownload();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Link className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your link here (YouTube, Instagram, TikTok, etc.)"
            className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            disabled={isLoading || downloadStatus === 'downloading'}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {mediaInfo && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 space-y-4">
            <div className="flex items-start space-x-4">
              {mediaInfo.thumbnail && (
                <img
                  src={mediaInfo.thumbnail}
                  alt="Thumbnail"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {mediaInfo.title || mediaInfo.filename || 'Media File'}
                </h3>
                {mediaInfo.author && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    by {mediaInfo.author}
                  </p>
                )}
                {mediaInfo.duration && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Duration: {Math.floor(parseInt(mediaInfo.duration) / 60)}:{(parseInt(mediaInfo.duration) % 60).toString().padStart(2, '0')}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {mediaInfo.platform}
                  </span>
                  {mediaInfo.size && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {(mediaInfo.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || downloadStatus === 'downloading' || !url.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Getting Info...</span>
            </>
          ) : downloadStatus === 'downloading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : downloadStatus === 'success' ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>{mediaInfo ? 'Download' : 'Get Info & Download'}</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Supported platforms:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['YouTube', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 'Direct Links'].map((platform) => (
            <span
              key={platform}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            >
              {platform}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
