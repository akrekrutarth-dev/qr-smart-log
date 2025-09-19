import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClassManagement } from './class-management';
import { AttendanceScanner } from './attendance-scanner';
import { StudentManagement } from './student-management';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  QrCode, 
  GraduationCap,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserPlus
} from 'lucide-react';

interface AttendanceStats {
  totalClasses: number;
  totalStudents: number;
  attendanceRate: number;
  activeClasses: number;
}

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const stats: AttendanceStats = {
    totalClasses: 12,
    totalStudents: 245,
    attendanceRate: 87.5,
    activeClasses: 3
  };

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Manage Students</TabsTrigger>
            <TabsTrigger value="classes">Manage Classes</TabsTrigger>
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
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
                  <CardDescription>Latest attendance sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div className="flex-1">
                      <p className="font-medium">Computer Science 101</p>
                      <p className="text-sm text-muted-foreground">28/30 students attended</p>
                    </div>
                    <Badge variant="secondary">09:00 AM</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div className="flex-1">
                      <p className="font-medium">Mathematics Advanced</p>
                      <p className="text-sm text-muted-foreground">22/25 students attended</p>
                    </div>
                    <Badge variant="secondary">11:00 AM</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Clock className="h-5 w-5 text-warning" />
                    <div className="flex-1">
                      <p className="font-medium">Physics Lab</p>
                      <p className="text-sm text-muted-foreground">In progress</p>
                    </div>
                    <Badge>Live</Badge>
                  </div>
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
                  
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
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
        </Tabs>
      </div>
    </div>
  );
};