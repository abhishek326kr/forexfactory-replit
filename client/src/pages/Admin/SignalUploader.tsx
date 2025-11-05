import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Upload, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { Editor } from '@/components/Editor';

export default function SignalUploader() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch recent signals
  const { data: recentSignals } = useQuery({
    queryKey: ["/api/admin/signals"],
    queryFn: async () => {
      const response = await fetch("/api/admin/signals?limit=3");
      if (!response.ok) throw new Error("Failed to fetch signals");
      const data = await response.json();
      return data.data || [];
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview("");
    setDescription("");
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please add both a screenshot and description",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64 for simple upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Create signal with auto-generated fields
        const response = await apiRequest("POST", "/api/admin/signals/simple", {
          screenshot: base64,
          description: description
        });

        toast({
          title: "Success!",
          description: "Signal uploaded successfully",
        });

        // Reset form
        handleReset();
        
        // Refresh signals list
        queryClient.invalidateQueries({ queryKey: ["/api/admin/signals"] });
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload signal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      title="Signal Uploader"
      description="Upload trading signals"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Upload Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Screenshot
                </label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                  {!preview ? (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary hover:underline font-medium">
                          Click to choose an image 
                        </span>
                        <span className="text-muted-foreground"> (JPG, PNG, WEBP + max 8MB)</span>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="input-signal-screenshot"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <img 
                        src={preview} 
                        alt="Signal preview" 
                        className="mx-auto max-h-64 rounded-lg shadow-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview("");
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Description
                </label>
                <Editor
                  content={description}
                  onChange={setDescription}
                  placeholder="Describe what this screenshot shows: steps to reproduce, etc."
                  className="min-h-[200px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={uploading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !description.trim()}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Signals */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentSignals && recentSignals.length > 0 ? (
              recentSignals.map((signal: any) => (
                <Card key={signal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    {signal.screenshots ? (
                      <img 
                        src={JSON.parse(signal.screenshots)[0] || signal.file_path} 
                        alt={signal.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (signal.file_path) {
                            target.src = signal.file_path;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ) : signal.file_path ? (
                      <img 
                        src={signal.file_path} 
                        alt={signal.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">{signal.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {signal.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No signals uploaded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}