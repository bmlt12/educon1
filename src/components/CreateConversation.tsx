import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  department?: string;
}

interface CreateConversationProps {
  onConversationCreated: (conversationId: string) => void;
  onCancel: () => void;
}

const CreateConversation = ({ onConversationCreated, onCancel }: CreateConversationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, department')
        .ilike('full_name', `%${query}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchUsers(query);
  };

  const addUser = (profile: Profile) => {
    if (!selectedUsers.find(u => u.user_id === profile.user_id)) {
      setSelectedUsers([...selectedUsers, profile]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.user_id !== userId));
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    if (isGroupChat && !groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          created_by: user?.id,
          is_group: isGroupChat,
          name: isGroupChat ? groupName : null
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [
        { conversation_id: conversation.id, user_id: user?.id },
        ...selectedUsers.map(u => ({
          conversation_id: conversation.id,
          user_id: u.user_id
        }))
      ];

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) throw participantError;

      toast({
        title: "Success",
        description: isGroupChat ? "Group chat created!" : "Conversation started!"
      });

      onConversationCreated(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Start New Chat</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Type Toggle */}
        <div className="flex gap-2">
          <Button
            variant={!isGroupChat ? "default" : "outline"}
            size="sm"
            onClick={() => setIsGroupChat(false)}
            className="flex-1"
          >
            Direct Chat
          </Button>
          <Button
            variant={isGroupChat ? "default" : "outline"}
            size="sm"
            onClick={() => setIsGroupChat(true)}
            className="flex-1"
          >
            Group Chat
          </Button>
        </div>

        {/* Group Name Input */}
        {isGroupChat && (
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        {/* User Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
            {searchResults.map((profile) => (
              <div
                key={profile.user_id}
                className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => addUser(profile)}
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{profile.full_name}</p>
                    {profile.department && (
                      <p className="text-xs text-muted-foreground">{profile.department}</p>
                    )}
                  </div>
                </div>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Users ({selectedUsers.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((profile) => (
                <Badge
                  key={profile.user_id}
                  variant="secondary"
                  className="flex items-center space-x-1 pr-1"
                >
                  <span className="text-xs">{profile.full_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUser(profile.user_id)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={createConversation}
            disabled={loading || selectedUsers.length === 0 || (isGroupChat && !groupName.trim())}
            className="flex-1"
          >
            {loading ? 'Creating...' : isGroupChat ? 'Create Group' : 'Start Chat'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateConversation;