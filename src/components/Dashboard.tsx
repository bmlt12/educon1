import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { useFiles } from '@/hooks/useFiles';
import { useDiscussions } from '@/hooks/useDiscussions';
import { useGroups } from '@/hooks/useGroups';
import { 
  BookOpen, 
  MessageSquare, 
  Users, 
  Upload,
  TrendingUp,
  Clock,
  Star,
  Download,
  Plus,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();
  const { stats } = useStats();
  const { files } = useFiles();
  const { discussions } = useDiscussions();
  const { groups } = useGroups();

  // Get recent files (last 3)
  const recentFiles = files.slice(0, 3);

  // Get recent discussions (last 3)
  const recentDiscussions = discussions.slice(0, 3);

  // Get user's groups (last 3)
  const activeGroups = groups.filter(g => g.is_member).slice(0, 3);

  const quickActions = [
    { 
      title: 'Upload Notes', 
      description: 'Share your lecture materials', 
      icon: Upload, 
      to: '/upload',
      color: 'bg-gradient-primary'
    },
    { 
      title: 'Ask Question', 
      description: 'Get help from peers', 
      icon: MessageSquare, 
      to: '/discussions',
      color: 'bg-gradient-accent'
    },
    { 
      title: 'Join Group', 
      description: 'Find study partners', 
      icon: Users, 
      to: '/groups',
      color: 'bg-gradient-success'
    },
    { 
      title: 'Start Chat', 
      description: 'Message other students', 
      icon: MessageSquare, 
      to: '/chat',
      color: 'bg-gradient-secondary'
    }
  ];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActivityBadge = (activity: string) => {
    const variants = {
      high: 'bg-success text-success-foreground',
      medium: 'bg-warning text-warning-foreground',
      low: 'bg-muted text-muted-foreground'
    };
    return variants[activity as keyof typeof variants] || variants.low;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-background rounded-lg p-6 shadow-soft border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Welcome back, {profile?.full_name || 'Student'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to learn and collaborate? Here's what's happening in your academic community.
            </p>
          </div>
          <div className="hidden md:block">
            <TrendingUp className="h-16 w-16 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
                <p className="text-sm text-muted-foreground">Files Shared</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.totalDiscussions}</p>
                <p className="text-sm text-muted-foreground">Discussions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.totalGroups}</p>
                <p className="text-sm text-muted-foreground">Study Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.recentActivity}</p>
                <p className="text-sm text-muted-foreground">Today's Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.to}>
                <Card className="shadow-soft hover:shadow-medium transition-all hover:scale-105 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className={`${action.color} p-3 rounded-full w-fit mx-auto mb-3 shadow-soft`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Files */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Files</span>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Latest materials shared by students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.title}</p>
                  <p className="text-sm text-muted-foreground">
                    by {file.uploader?.full_name || 'Unknown'} • {formatTimeAgo(file.created_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <Badge variant="secondary" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    {file.download_count}
                  </Badge>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link to="/library">
                View All Files <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Discussions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Discussions</span>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Latest questions and conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDiscussions.map((discussion) => (
              <div key={discussion.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">{discussion.title}</h4>
                  {discussion.is_solved && (
                    <Badge className="bg-success text-success-foreground ml-2">
                      <Star className="h-3 w-3 mr-1" />
                      Solved
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>by {discussion.author?.full_name || 'Unknown'}</span>
                  <span>{discussion.reply_count} replies • {formatTimeAgo(discussion.created_at)}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link to="/discussions">
                View All Discussions <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Active Study Groups */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Study Groups</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Collaborative learning communities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(group.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.member_count} members</p>
                  </div>
                </div>
                <Badge className={getActivityBadge('high')}>
                  {group.user_role || 'member'}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link to="/groups">
                <Plus className="h-4 w-4 mr-2" />
                Join More Groups
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;