import { useAuth } from '@/hooks/useAuth';
import { useDiscussions } from '@/hooks/useDiscussions';
import Navigation from '@/components/Navigation';
import CreateDiscussion from '@/components/CreateDiscussion';
import DiscussionCard from '@/components/DiscussionCard';
import { MessageSquare, Plus, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const Discussions = () => {
  const { user } = useAuth();
  const { discussions, loading, refetch } = useDiscussions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredDiscussions = discussions?.filter(discussion =>
    discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navigation />
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Discussions</h1>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search discussions..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-8">
            <CreateDiscussion
              onCancel={() => setShowCreateForm(false)}
              onSuccess={handleCreateSuccess}
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDiscussions.length > 0 ? (
              filteredDiscussions.map((discussion) => (
                <DiscussionCard key={discussion.id} discussion={discussion} />
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {searchTerm ? 'No discussions found matching your search.' : 'No discussions yet'}
                </p>
                <p className="text-muted-foreground mb-4">
                  Start the conversation by creating the first discussion!
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Discussion
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussions;