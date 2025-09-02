import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFiles } from '@/hooks/useFiles';
import Navigation from '@/components/Navigation';
import { BookOpen, Search, Filter, Download, Clock, Trash2, FileText, Image, Video, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Library = () => {
  const { user } = useAuth();
  const { files, loading, downloadFile, deleteFile } = useFiles();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const handleDownload = async (file: any) => {
    const result = await downloadFile(file.id, file.file_name, file.file_path);
    if (result?.success) {
      toast({
        title: "Download started",
        description: `${file.file_name} is being downloaded.`
      });
    }
  };

  const handleDelete = async (file: any) => {
    if (file.user_id !== user?.id) {
      toast({
        title: "Error",
        description: "You can only delete your own files.",
        variant: "destructive"
      });
      return;
    }
    
    const result = await deleteFile(file.id, file.file_path);
    if (result?.success) {
      toast({
        title: "File deleted",
        description: `${file.file_name} has been deleted.`
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Library</h1>
          </div>
          <Button asChild>
            <Link to="/upload">Upload File</Link>
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search files, courses, or topics..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading files...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files
              .filter(file => 
                file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((file) => (
                <Card key={file.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(file.file_type)}
                        <CardTitle className="text-lg truncate">{file.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {file.user_id === user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(file)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {file.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {file.description}
                        </p>
                      )}
                      <p className="text-muted-foreground text-sm">
                        {file.course || 'General'} • {file.file_type}
                      </p>
                      <p className="text-sm">
                        Uploaded by {file.uploader?.full_name || 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          <Download className="h-3 w-3 mr-1" />
                          {file.download_count}
                        </Badge>
                      </div>
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
        
        {!loading && files.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">Be the first to share resources with your community!</p>
            <Button asChild>
              <Link to="/upload">Upload First File</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;