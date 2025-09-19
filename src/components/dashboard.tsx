import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClassManagement } from './class-management';
import { AttendanceScanner } from './attendance-scanner';
import { StudentManagement } from './student-management';
import { ClassAnalytics } from './class-analytics';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  QrCode, 
  GraduationCap,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  LineChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendanceStats {
  totalClasses: number;
  totalStudents: number;
  attendanceRate: number;
  activeClasses: number;
}

interface RecentClass {
  id: string;
  name: string;
  date: string;
  time: string;
  attendanceCount: number;
  maxAttendees: number;
  created_at: string;
}

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    totalStudents: 0,
    attendanceRate: 0,
    activeClasses: 0
  });
  const [recentClasses, setRecentClasses] = useState<RecentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total classes
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // Fetch total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch recent classes with attendance data
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          date,
          time,
          max_attendees,
          created_at,
          attendance_records(count)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (classesError) throw classesError;

      // Calculate attendance rate
      let totalAttendanceRecords = 0;
      let totalPossibleAttendance = 0;

      const recentClassesData: RecentClass[] = (classesData || []).map((classItem) => {
        const attendanceCount = classItem.attendance_records?.[0]?.count || 0;
        totalAttendanceRecords += attendanceCount;
        totalPossibleAttendance += classItem.max_attendees;

        return {
          id: classItem.id,
          name: classItem.name,
          date: classItem.date,
          time: classItem.time,
          attendanceCount,
          maxAttendees: classItem.max_attendees,
          created_at: classItem.created_at
        };
      });

      const attendanceRate = totalPossibleAttendance > 0 
        ? (totalAttendanceRecords / totalPossibleAttendance) * 100 
        : 0;

      // Check for active classes (today's classes)
      const today = new Date().toISOString().split('T')[0];
      const { count: activeClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      setStats({
        totalClasses: totalClasses || 0,
        totalStudents: totalStudents || 0,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        activeClasses: activeClasses || 0
      });

      setRecentClasses(recentClassesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time updates for classes
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Attendance</h1>
              <p className="text-muted-foreground">QR Code-based attendance management system</p>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Manage Students</TabsTrigger>
            <TabsTrigger value="classes">Manage Classes</TabsTrigger>
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">This semester</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                  <p className="text-xs text-success">+2.3% from last week</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeClasses}</div>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest class sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentClasses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No classes created yet</p>
                      <p className="text-sm">Create your first class to see activity here</p>
                    </div>
                  ) : (
                    recentClasses.map((classItem) => (
                      <div key={classItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {isToday(classItem.date) ? (
                          <Clock className="h-5 w-5 text-warning" />
                        ) : classItem.attendanceCount > 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{classItem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {classItem.attendanceCount > 0 
                              ? `${classItem.attendanceCount}/${classItem.maxAttendees} students attended`
                              : `Scheduled for ${formatDate(classItem.date)}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={isToday(classItem.date) ? "default" : "secondary"}>
                            {isToday(classItem.date) ? "Today" : formatTime(classItem.time)}
                          </Badge>
                          {isToday(classItem.date) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(classItem.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("students")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Student
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("classes")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Class Session
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("attendance")}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("analytics")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <StudentManagement />
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <ClassManagement />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceScanner />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <LineChart className="h-6 w-6" />
                <div>
                  <h2 className="text-2xl font-bold">Smart Analytics</h2>
                  <p className="text-muted-foreground">Detailed insights into class performance and attendance patterns</p>
                </div>
              </div>
              
              <ClassAnalytics showSummary />
              <ClassAnalytics />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};