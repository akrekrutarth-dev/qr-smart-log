import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from '@/components/ui/qr-scanner';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  studentName: string;
  timestamp: Date;
  classCode: string;
  status: 'present' | 'late' | 'absent';
}

export const AttendanceScanner = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (result: string) => {
    // Simulate student identification (in real app, this would be from a database)
    const studentName = `Student ${Math.floor(Math.random() * 100) + 1}`;
    const currentTime = new Date();
    
    // Check if already marked present
    const existingRecord = attendanceRecords.find(
      record => record.classCode === result && record.studentName === studentName
    );

    if (existingRecord) {
      toast({
        title: "Already Marked",
        description: "Attendance has already been recorded for this session.",
        variant: "destructive"
      });
      return;
    }

    // Determine status based on time (simplified logic)
    const status: 'present' | 'late' = currentTime.getMinutes() > 10 ? 'late' : 'present';

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      studentName,
      timestamp: currentTime,
      classCode: result,
      status
    };

    setAttendanceRecords([newRecord, ...attendanceRecords]);
    
    toast({
      title: "Attendance Marked",
      description: `${studentName} marked as ${status}`,
      variant: status === 'present' ? "default" : "destructive"
    });
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scan Error",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Mark Your Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {!isScanning ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Scan the QR code displayed by your instructor to mark your attendance
              </p>
              <Button 
                onClick={() => setIsScanning(true)}
                size="lg"
                className="w-full max-w-md"
              >
                Start Scanning
              </Button>
            </div>
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

      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {record.status === 'present' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : record.status === 'late' ? (
                        <Clock className="h-5 w-5 text-warning" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{record.studentName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {record.classCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}>
                      {record.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {record.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};