import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDiscussions } from '@/hooks/useDiscussions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateDiscussionProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateDiscussion = ({ onCancel, onSuccess }: CreateDiscussionProps) => {
  const { user } = useAuth();
  const { createDiscussion } = useDiscussions();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    course: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.content.trim()) return;

    setLoading(true);
    try {
      const result = await createDiscussion({
        ...formData,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      if (result?.success) {
        toast({
          title: "Discussion created",
          description: "Your discussion has been posted successfully."
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create discussion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only images and PDF files are allowed.",
        variant: "destructive"
      });
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Discussion</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Discussion title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg font-medium"
            />
          </div>

          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Course (optional)"
              value={formData.course}
              onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Attach files (images or PDFs)</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Attachments:</p>
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    {file.type.startsWith('image/') ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.content.trim()}>
              {loading ? "Posting..." : "Post Discussion"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateDiscussion;