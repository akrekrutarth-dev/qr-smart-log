import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from '@/components/ui/qr-scanner';
import { Scan, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  status: 'present' | 'late' | 'absent';
  marked_at: string;
  students: {
    first_name: string;
    last_name: string;
    student_id: string;
  };
  classes: {
    name: string;
  };
}

export const AttendanceScanner = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch classes and attendance records
  const fetchData = async () => {
    // Fetch classes
    const { data: classesData } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    
    setClasses(classesData || []);

    // Fetch recent attendance records
    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select(`
        *,
        students (first_name, last_name, student_id),
        classes (name)
      `)
      .order('marked_at', { ascending: false })
      .limit(10);

    setAttendanceRecords((attendanceData || []) as AttendanceRecord[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScan = async (result: string) => {
    setIsScanning(false);
    
    try {
      // Parse QR code to determine if it's a student or class QR
      if (result.startsWith('STUDENT:')) {
        // Student QR code scanned
        if (!selectedClass) {
          toast({
            title: "Error",
            description: "Please select a class first",
            variant: "destructive"
          });
          return;
        }

        const [, studentId] = result.split(':');
        
        // Find student by student_id
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', studentId)
          .single();

        if (!student) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive"
          });
          return;
        }

        // Check if already marked attendance
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', student.id)
          .eq('class_id', selectedClass)
          .single();

        if (existingRecord) {
          toast({
            title: "Already Marked",
            description: "Student has already marked attendance for this class",
            variant: "destructive"
          });
          return;
        }

        // Determine status (simulate late if more than 15 minutes past class time)
        const classInfo = classes.find(c => c.id === selectedClass);
        const classDateTime = new Date(`${classInfo?.date} ${classInfo?.time}`);
        const now = new Date();
        const minutesLate = (now.getTime() - classDateTime.getTime()) / (1000 * 60);
        const status = minutesLate > 15 ? 'late' : 'present';

        // Mark attendance
        const { error } = await supabase
          .from('attendance_records')
          .insert([{
            student_id: student.id,
            class_id: selectedClass,
            status
          }]);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to mark attendance",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: `Attendance marked for ${student.first_name} ${student.last_name} - ${status.toUpperCase()}`,
          });
          fetchData();
        }

      } else if (result.startsWith('CLASS:')) {
        // Class QR code scanned - auto select the class
        const [, className, date, time] = result.split(':');
        const classInfo = classes.find(c => 
          c.name === className && c.date === date && c.time === time
        );
        
        if (classInfo) {
          setSelectedClass(classInfo.id);
          toast({
            title: "Class Selected",
            description: `Selected class: ${classInfo.name}`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process QR code",
        variant: "destructive"
      });
    }
  };

  const handleScanError = (error: string) => {
    console.error('QR Scan Error:', error);
    toast({
      title: "Scan Error",
      description: "Failed to scan QR code. Please try again.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <CardDescription>Choose the class session for attendance marking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <Button
                key={classItem.id}
                variant={selectedClass === classItem.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => setSelectedClass(classItem.id)}
              >
                <div className="font-medium">{classItem.name}</div>
                <div className="text-sm opacity-70">{classItem.date} at {classItem.time}</div>
              </Button>
            ))}
          </div>
          {selectedClass && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                Selected: {classes.find(c => c.id === selectedClass)?.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Scan student QR codes or class QR codes to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <Button 
              onClick={() => setIsScanning(true)} 
              className="w-full"
              disabled={!selectedClass}
            >
              <Scan className="h-4 w-4 mr-2" />
              {selectedClass ? 'Start Scanning' : 'Select a class first'}
            </Button>
          ) : (
            <div className="space-y-4">
              <QRScanner 
                onScan={handleScan}
                onError={handleScanError}
              />
              <Button 
                variant="outline"
                onClick={() => setIsScanning(false)}
                className="w-full"
              >
                Stop Scanning
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Latest 10 attendance entries</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records yet. Start scanning to mark attendance.
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {record.students.first_name} {record.students.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.students.student_id} - {record.classes.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                      {record.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(record.marked_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};