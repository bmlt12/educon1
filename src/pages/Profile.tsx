import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { User, Edit, Camera, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, profile } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully."
      });

      // Refresh the page to show the new avatar
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Upload failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center space-x-3 mb-8">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 transition-all duration-200 group-hover:scale-105">
                      <AvatarImage 
                        src={profile?.avatar_url || ''} 
                        alt={profile?.full_name || 'User'}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">{profile?.full_name || 'User'}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">{profile?.role || 'Student'}</Badge>
                    {profile?.department && <Badge variant="outline">{profile.department}</Badge>}
                    {profile?.level && <Badge variant="outline">{profile.level}</Badge>}
                  </div>
                  
                  <Button className="w-full" onClick={() => navigate('/profile/edit')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {profile?.bio || 'No bio available. Click edit to add a bio.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.userStats?.filesUploaded || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Files Uploaded</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.userStats?.questionsAsked || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Questions Asked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.userStats?.answersGiven || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Answers Given</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.userStats?.groupsJoined || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Groups Joined</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">
                        Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Member since
                      </p>
                    </div>
                  </div>
                  {stats.userStats && stats.userStats.filesUploaded > 0 && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-2 w-2 bg-success rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">
                          Uploaded {stats.userStats.filesUploaded} files
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contributing to the community
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.userStats && stats.userStats.groupsJoined > 0 && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-2 w-2 bg-accent rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">
                          Active in {stats.userStats.groupsJoined} study groups
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Collaborating with peers
                        </p>
                      </div>
                    </div>
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

export default Profile;