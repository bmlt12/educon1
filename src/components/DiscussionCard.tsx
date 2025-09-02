import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDiscussions } from '@/hooks/useDiscussions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share, ChevronUp, ChevronDown, Image, FileText, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DiscussionData, DiscussionReply } from '@/hooks/useDiscussions';

interface DiscussionCardProps {
  discussion: DiscussionData;
}

const DiscussionCard = ({ discussion }: DiscussionCardProps) => {
  const { user } = useAuth();
  const { voteOnDiscussion, fetchReplies, createReply } = useDiscussions();
  const { toast } = useToast();
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleVote = async (voteType: 1 | -1) => {
    if (!user) return;
    await voteOnDiscussion(discussion.id, voteType);
  };

  const handleShowReplies = async () => {
    if (!showReplies && replies.length === 0) {
      setLoadingReplies(true);
      const fetchedReplies = await fetchReplies(discussion.id);
      setReplies(fetchedReplies);
      setLoadingReplies(false);
    }
    setShowReplies(!showReplies);
  };

  const handleSubmitReply = async () => {
    if (!user || !newReply.trim()) return;

    setSubmittingReply(true);
    try {
      const result = await createReply(discussion.id, newReply.trim());
      if (result?.success) {
        setNewReply('');
        // Refresh replies
        const fetchedReplies = await fetchReplies(discussion.id);
        setReplies(fetchedReplies);
        toast({
          title: "Reply posted",
          description: "Your reply has been added successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={discussion.author?.full_name} />
            <AvatarFallback>
              {discussion.author?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{discussion.author?.full_name || 'Anonymous'}</span>
              <span className="text-sm text-muted-foreground">
                • {new Date(discussion.created_at).toLocaleDateString()}
              </span>
              {discussion.is_solved && (
                <Badge variant="default" className="text-xs">Solved</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2">{discussion.title}</h3>
            <p className="text-muted-foreground">{discussion.content}</p>
            
            {discussion.course && (
              <Badge variant="outline" className="mt-2 text-xs">
                {discussion.course}
              </Badge>
            )}

            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {discussion.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {discussion.attachment_urls && discussion.attachment_urls.length > 0 && (
              <div className="mt-3 space-y-2">
                {discussion.attachment_urls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {url.includes('.pdf') ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <Image className="h-4 w-4" />
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View attachment {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(1)}
                className="flex items-center gap-1 hover:text-primary"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="text-sm">{discussion.vote_count}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(-1)}
                className="hover:text-destructive"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowReplies}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{discussion.reply_count} replies</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Share className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
        </div>

        {showReplies && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="resize-none text-sm"
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim() || submittingReply}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loadingReplies ? (
              <div className="text-center py-4">
                <span className="text-sm text-muted-foreground">Loading replies...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {reply.author?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {reply.author?.full_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                          {reply.is_solution && (
                            <Badge variant="default" className="text-xs">Solution</Badge>
                          )}
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          <ChevronUp className="h-3 w-3 mr-1" />
                          {reply.vote_count}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscussionCard;