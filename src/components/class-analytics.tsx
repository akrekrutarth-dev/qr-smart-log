import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  attendanceCount: number;
  attendanceRate: number;
  lateArrivals: number;
  onTimeArrivals: number;
  averageArrivalTime: string;
  classDate: string;
  classTime: string;
}

interface ClassAnalyticsProps {
  classId?: string;
  showSummary?: boolean;
}

export const ClassAnalytics = ({ classId, showSummary = false }: ClassAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<ClassAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      // Fetch classes with attendance data
      let classQuery = supabase
        .from('classes')
        .select(`
          id,
          name,
          date,
          time,
          max_attendees,
          attendance_records (
            id,
            marked_at,
            status,
            student_id
          )
        `)
        .order('created_at', { ascending: false });

      if (classId) {
        classQuery = classQuery.eq('id', classId);
      }

      const { data: classesData, error: classesError } = await classQuery;

      if (classesError) throw classesError;

      // Get total student count
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      const analyticsData: ClassAnalytics[] = (classesData || []).map((classItem) => {
        const attendanceRecords = classItem.attendance_records || [];
        const attendanceCount = attendanceRecords.length;
        const attendanceRate = totalStudents ? (attendanceCount / totalStudents) * 100 : 0;

        // Calculate late arrivals (more than 10 minutes after class start)
        const classDateTime = new Date(`${classItem.date} ${classItem.time}`);
        const lateThreshold = new Date(classDateTime.getTime() + 10 * 60 * 1000); // 10 minutes

        let lateArrivals = 0;
        let onTimeArrivals = 0;
        let totalArrivalTime = 0;

        attendanceRecords.forEach((record) => {
          const arrivalTime = new Date(record.marked_at);
          if (arrivalTime > lateThreshold) {
            lateArrivals++;
          } else {
            onTimeArrivals++;
          }
          totalArrivalTime += arrivalTime.getTime() - classDateTime.getTime();
        });

        const averageArrivalDelay = attendanceCount > 0 ? totalArrivalTime / attendanceCount : 0;
        const averageArrivalTime = averageArrivalDelay > 0 
          ? `+${Math.round(averageArrivalDelay / (1000 * 60))}m` 
          : 'On time';

        return {
          classId: classItem.id,
          className: classItem.name,
          totalStudents: totalStudents || 0,
          attendanceCount,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          lateArrivals,
          onTimeArrivals,
          averageArrivalTime,
          classDate: classItem.date,
          classTime: classItem.time
        };
      });

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [classId]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showSummary && analytics.length > 0) {
    const averageAttendanceRate = analytics.reduce((sum, a) => sum + a.attendanceRate, 0) / analytics.length;
    const totalLateArrivals = analytics.reduce((sum, a) => sum + a.lateArrivals, 0);
    const totalAttendance = analytics.reduce((sum, a) => sum + a.attendanceCount, 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendanceRate.toFixed(1)}%</div>
            <Progress value={averageAttendanceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLateArrivals}</div>
            <p className="text-xs text-muted-foreground">
              {totalAttendance > 0 ? `${((totalLateArrivals / totalAttendance) * 100).toFixed(1)}% of attendees` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
            <p className="text-xs text-muted-foreground">Classes analyzed</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analytics.map((classAnalytics) => (
        <Card key={classAnalytics.classId} className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {classAnalytics.className} Analytics
                </CardTitle>
                <CardDescription>
                  {classAnalytics.classDate} at {classAnalytics.classTime}
                </CardDescription>
              </div>
              <Badge 
                variant={classAnalytics.attendanceRate >= 80 ? "default" : classAnalytics.attendanceRate >= 60 ? "secondary" : "destructive"}
              >
                {classAnalytics.attendanceRate}% Attendance
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Attendance Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Attendance</span>
                </div>
                <div className="text-2xl font-bold">
                  {classAnalytics.attendanceCount}/{classAnalytics.totalStudents}
                </div>
                <Progress value={classAnalytics.attendanceRate} className="h-2" />
              </div>

              {/* On-time Arrivals */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">On Time</span>
                </div>
                <div className="text-2xl font-bold text-success">
                  {classAnalytics.onTimeArrivals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {classAnalytics.attendanceCount > 0 
                    ? `${((classAnalytics.onTimeArrivals / classAnalytics.attendanceCount) * 100).toFixed(1)}% punctual`
                    : 'No data'
                  }
                </p>
              </div>

              {/* Late Arrivals */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Late</span>
                </div>
                <div className="text-2xl font-bold text-warning">
                  {classAnalytics.lateArrivals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {classAnalytics.attendanceCount > 0 
                    ? `${((classAnalytics.lateArrivals / classAnalytics.attendanceCount) * 100).toFixed(1)}% late`
                    : 'No data'
                  }
                </p>
              </div>

              {/* Average Arrival */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avg Arrival</span>
                </div>
                <div className="text-lg font-bold">
                  {classAnalytics.averageArrivalTime}
                </div>
                <p className="text-xs text-muted-foreground">
                  From class start
                </p>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Performance Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  {classAnalytics.attendanceRate >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : classAnalytics.attendanceRate >= 70 ? (
                    <Clock className="h-4 w-4 text-warning" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span>
                    {classAnalytics.attendanceRate >= 90 
                      ? "Excellent attendance rate"
                      : classAnalytics.attendanceRate >= 70 
                      ? "Good attendance, room for improvement"
                      : "Low attendance - consider engagement strategies"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {classAnalytics.lateArrivals <= 2 ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : classAnalytics.lateArrivals <= 5 ? (
                    <Clock className="h-4 w-4 text-warning" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span>
                    {classAnalytics.lateArrivals <= 2 
                      ? "Great punctuality"
                      : classAnalytics.lateArrivals <= 5 
                      ? "Some late arrivals"
                      : "High number of late arrivals"
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};