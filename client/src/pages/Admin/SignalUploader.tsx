import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { AdminLayout } from "@/components/AdminLayout";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { ObjectStorageService } from "@/lib/objectStorage";

// Simple schema - only screenshot and description required
const signalUploadSchema = z.object({
  screenshot: z.string().min(1, "Screenshot is required"),
  description: z.string().min(10, "Description must be at least 10 characters")
});

type SignalUploadForm = z.infer<typeof signalUploadSchema>;

export default function SignalUploader() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const form = useForm<SignalUploadForm>({
    resolver: zodResolver(signalUploadSchema),
    defaultValues: {
      screenshot: "",
      description: ""
    }
  });

  const uploadSignal = useMutation({
    mutationFn: async (data: SignalUploadForm) => {
      return apiRequest("/api/admin/signals/simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Signal uploaded successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/signals"] });
      
      // Reset form
      form.reset();
      setUploadedImageUrl("");
      
      // Navigate to signals list
      setTimeout(() => {
        setLocation("/admin/signals");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload signal",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SignalUploadForm) => {
    uploadSignal.mutate(data);
  };

  const onReset = () => {
    form.reset();
    setUploadedImageUrl("");
  };

  const objectStorageService = new ObjectStorageService();

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add New Signal</h1>
          <p className="text-muted-foreground">Upload a new trading signal with screenshot and description</p>
        </div>

        {/* Upload Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Signal Details</CardTitle>
            <CardDescription>
              Upload a screenshot and provide a description for your trading signal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Screenshot Upload Field */}
                <FormField
                  control={form.control}
                  name="screenshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal Screenshot</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <ObjectUploader
                            onGetUploadParameters={async () => {
                              const response = await fetch("/api/admin/upload", {
                                method: "POST"
                              });
                              const { uploadURL } = await response.json();
                              return {
                                method: "PUT",
                                url: uploadURL.url
                              };
                            }}
                            onComplete={async (result) => {
                              const uploadedFile = result.successful[0];
                              if (uploadedFile) {
                                // Get the URL from the upload response
                                const fileUrl = uploadedFile.uploadURL.split("?")[0];
                                const fileName = fileUrl.split("/").pop();
                                
                                // Set ACL for the uploaded file
                                await objectStorageService.setObjectAcl(
                                  fileName!,
                                  "public-read"
                                );
                                
                                // Update form field and preview
                                field.onChange(fileUrl);
                                setUploadedImageUrl(fileUrl);
                                
                                toast({
                                  title: "Screenshot Uploaded",
                                  description: "Image uploaded successfully"
                                });
                              }
                            }}
                            maxFileSize={5242880} // 5MB
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Screenshot
                          </ObjectUploader>
                          
                          {/* Preview uploaded image */}
                          {uploadedImageUrl && (
                            <div className="relative">
                              <img 
                                src={uploadedImageUrl} 
                                alt="Signal screenshot" 
                                className="w-full max-w-md rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  field.onChange("");
                                  setUploadedImageUrl("");
                                }}
                                data-testid="button-remove-screenshot"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a screenshot of your trading signal (max 5MB, images only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your trading signal, including entry/exit points, timeframe, and any important details..."
                          rows={6}
                          className="resize-none"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of the signal (minimum 10 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={onReset}
                    disabled={uploadSignal.isPending}
                    data-testid="button-reset"
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit"
                    disabled={uploadSignal.isPending || !uploadedImageUrl}
                    data-testid="button-submit"
                  >
                    {uploadSignal.isPending ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Upload Signal
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Success State */}
        {uploadSignal.isSuccess && (
          <Card className="mt-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-700 dark:text-green-300">
                  Signal uploaded successfully! Redirecting to signals list...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}