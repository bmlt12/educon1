import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFiles } from '@/hooks/useFiles';
import Navigation from '@/components/Navigation';
import { Upload as UploadIcon, FileText, Image, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const Upload = () => {
  const { user } = useAuth();
  const { files, uploadFile } = useFiles();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile || !formData.title) return;

    setUploading(true);
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const result = await uploadFile({
        title: formData.title,
        description: formData.description || undefined,
        course: formData.course || undefined,
        tags: tags.length > 0 ? tags : undefined,
        file: selectedFile
      });

      if (result.success) {
        // Reset form
        setFormData({ title: '', description: '', course: '', tags: '' });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center space-x-3 mb-8">
          <UploadIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Upload Files</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload New File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter file title..." 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your file..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="course">Course</Label>
                <Input 
                  id="course" 
                  placeholder="e.g., Computer Science 101"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input 
                  id="tags" 
                  placeholder="e.g., algorithms, midterm, notes"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {selectedFile ? selectedFile.name : 'Drag and drop files here or'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Choose Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported: PDF, DOC, PPT, JPG, PNG, MP4 (Max 50MB)
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !formData.title}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-medium">Documents</p>
                    <p className="text-sm text-muted-foreground">PDF, DOC, PPT files</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Image className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium">Images</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, GIF files</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Video className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="font-medium">Videos</p>
                    <p className="text-sm text-muted-foreground">MP4, AVI, MOV files</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{file.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {file.download_count}
                      </Badge>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent uploads
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;