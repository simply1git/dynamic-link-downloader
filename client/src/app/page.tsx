"use client";
import { DownloadForm } from '@/components/DownloadForm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        <main className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Link Downloader
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                Download content from YouTube, social media, and direct links with ease
              </p>
            </div>
            
            <DownloadForm />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
