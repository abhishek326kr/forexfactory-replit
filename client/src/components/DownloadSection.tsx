import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  FileDown, 
  BarChart, 
  FileText, 
  Wrench,
  Download,
  Lock,
  Loader2,
  CheckCircle,
  Package
} from 'lucide-react';
import { Link } from 'wouter';

interface DownloadSectionProps {
  hasDownload?: boolean;
  downloadTitle?: string;
  downloadDescription?: string;
  downloadType?: string;
  downloadVersion?: string;
  downloadFileUrl?: string;
  downloadFileName?: string;
  downloadFileSize?: string;
  downloadCount?: number;
  requiresLogin?: boolean;
  blogId: string | number;
}

export default function DownloadSection({
  hasDownload,
  downloadTitle,
  downloadDescription,
  downloadType = 'Other',
  downloadVersion,
  downloadFileUrl,
  downloadFileName,
  downloadFileSize,
  downloadCount = 0,
  requiresLogin = true,
  blogId
}: DownloadSectionProps) {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Don't render if there's no download
  if (!hasDownload || !downloadFileUrl) {
    return null;
  }

  // Get the appropriate icon based on download type
  const getIcon = () => {
    switch (downloadType) {
      case 'EA':
      case 'Expert Advisor':
        return <FileDown className="h-8 w-8" />;
      case 'Indicator':
        return <BarChart className="h-8 w-8" />;
      case 'Template':
        return <FileText className="h-8 w-8" />;
      case 'Tool':
      case 'Trading Tool':
        return <Wrench className="h-8 w-8" />;
      default:
        return <Package className="h-8 w-8" />;
    }
  };

  // Track download mutation
  const trackDownloadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/blogs/${blogId}/download`);
    },
    onSuccess: () => {
      // Invalidate blog query to update download count
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/slug'] });
    }
  });

  const performDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Track the download
      await trackDownloadMutation.mutateAsync();
      
      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = downloadFileUrl;
      link.download = downloadFileName || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadComplete(true);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${downloadFileName || 'file'}...`,
      });
      
      // Reset download complete state after 3 seconds
      setTimeout(() => {
        setDownloadComplete(false);
      }, 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading the file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = async () => {
    // Check if login is required
    if (requiresLogin && !isAuthenticated) {
      // Open login modal with download intent
      openLoginModal('login', {
        type: 'download',
        postId: blogId,
        payload: {
          downloadTitle,
          downloadFileName,
          downloadFileUrl
        },
        callback: performDownload
      });
      return;
    }

    // User is authenticated, proceed with download
    await performDownload();
  };

  const formatDownloadCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="my-8">
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-1" />
        <CardContent className="p-6 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Icon and Info Section */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-blue-600 dark:text-blue-400">
                  {getIcon()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-testid="download-title">
                    {downloadTitle || 'Download Available'}
                  </h3>
                  {downloadDescription && (
                    <p className="text-gray-600 dark:text-gray-300" data-testid="download-description">
                      {downloadDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap gap-2 items-center">
                {downloadType && (
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50">
                    {downloadType}
                  </Badge>
                )}
                {downloadVersion && (
                  <Badge variant="outline" className="border-blue-300 dark:border-blue-600">
                    {downloadVersion}
                  </Badge>
                )}
                {downloadFileSize && (
                  <Badge variant="outline">
                    {downloadFileSize}
                  </Badge>
                )}
                {downloadCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Download className="h-3 w-3" />
                    <span data-testid="download-count">
                      {formatDownloadCount(downloadCount)} downloads
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button Section */}
            <div className="flex items-center">
              <Button 
                size="lg"
                onClick={handleDownload}
                disabled={isDownloading}
                className={`w-full md:w-auto shadow-lg disabled:opacity-50 ${
                  requiresLogin && !isAuthenticated
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                }`}
                data-testid={requiresLogin && !isAuthenticated ? "button-login-to-download" : "button-download"}
              >
                {requiresLogin && !isAuthenticated ? (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Login to Download
                  </>
                ) : isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : downloadComplete ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Additional Info for Non-logged-in Users */}
          {requiresLogin && !isAuthenticated && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔐 <strong>Free account required:</strong> Sign up for free to download this file and get access to all our trading tools.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}