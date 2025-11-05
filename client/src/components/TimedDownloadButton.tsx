import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimedDownloadButtonProps {
  downloadLink: string | null;
  fileName?: string;
  className?: string;
}

export default function TimedDownloadButton({ 
  downloadLink, 
  fileName = 'EA File',
  className 
}: TimedDownloadButtonProps) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [canDownload, setCanDownload] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isWaiting && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isWaiting && timeLeft === 0) {
      setCanDownload(true);
      setIsWaiting(false);
      // Automatically start download
      handleDownload();
    }

    return () => clearTimeout(timer);
  }, [isWaiting, timeLeft]);

  const handleStartWaiting = () => {
    setIsWaiting(true);
    setTimeLeft(20);
    setCanDownload(false);
  };

  const handleDownload = () => {
    if (!downloadLink) return;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!downloadLink) {
    return null;
  }

  const progress = ((20 - timeLeft) / 20) * 100;

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Download className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-1">Download {fileName}</h3>
            <p className="text-sm text-muted-foreground">
              Click below to start your download
            </p>
          </div>

          {isWaiting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-lg font-semibold tabular-nums">
                  {timeLeft}s
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Please wait while we prepare your download...
              </p>
            </div>
          ) : canDownload ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Download Started!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your download should begin automatically. If not, 
                <button 
                  onClick={handleDownload}
                  className="text-primary hover:underline ml-1"
                >
                  click here
                </button>
              </p>
            </div>
          ) : (
            <Button 
              size="lg"
              className="w-full"
              onClick={handleStartWaiting}
              data-testid="button-start-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Now
            </Button>
          )}
        </div>
      </div>
      
      {/* Additional Information */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          By downloading, you agree to our terms of use for trading software.
        </p>
      </div>
    </div>
  );
}