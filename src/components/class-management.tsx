import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, QrCode } from 'lucide-react';
import { QRCodeGenerator } from '@/components/ui/qr-code-generator';

interface AttendanceClass {
  id: string;
  name: string;
  date: string;
  time: string;
  qrCode: string;
  attendees: number;
  maxAttendees: number;
}

interface ClassManagementProps {
  onClassSelect?: (classItem: AttendanceClass) => void;
}

export const ClassManagement = ({ onClassSelect }: ClassManagementProps) => {
  const [classes, setClasses] = useState<AttendanceClass[]>([
    {
      id: '1',
      name: 'Computer Science 101',
      date: '2024-01-15',
      time: '09:00',
      qrCode: 'CS101-2024-01-15-09:00',
      attendees: 28,
      maxAttendees: 30
    },
    {
      id: '2',
      name: 'Mathematics Advanced',
      date: '2024-01-15',
      time: '11:00',
      qrCode: 'MATH-ADV-2024-01-15-11:00',
      attendees: 22,
      maxAttendees: 25
    }
  ]);

  const [newClass, setNewClass] = useState({
    name: '',
    date: '',
    time: '',
    maxAttendees: ''
  });

  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  const handleCreateClass = () => {
    if (!newClass.name || !newClass.date || !newClass.time || !newClass.maxAttendees) return;

    const classId = Date.now().toString();
    const qrCode = `${newClass.name.replace(/\s+/g, '-').toUpperCase()}-${newClass.date}-${newClass.time}`;
    
    const attendanceClass: AttendanceClass = {
      id: classId,
      name: newClass.name,
      date: newClass.date,
      time: newClass.time,
      qrCode,
      attendees: 0,
      maxAttendees: parseInt(newClass.maxAttendees)
    };

    setClasses([...classes, attendanceClass]);
    setNewClass({ name: '', date: '', time: '', maxAttendees: '' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Class Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="e.g., Computer Science 101"
              />
            </div>
            <div>
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={newClass.maxAttendees}
                onChange={(e) => setNewClass({ ...newClass, maxAttendees: e.target.value })}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="classDate">Date</Label>
              <Input
                id="classDate"
                type="date"
                value={newClass.date}
                onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="classTime">Time</Label>
              <Input
                id="classTime"
                type="time"
                value={newClass.time}
                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleCreateClass} className="w-full">
            Create Class Session
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{classItem.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {classItem.date} at {classItem.time}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {classItem.attendees} / {classItem.maxAttendees}
                  </span>
                </div>
                <Badge 
                  variant={classItem.attendees < classItem.maxAttendees ? "secondary" : "destructive"}
                >
                  {classItem.attendees < classItem.maxAttendees ? "Open" : "Full"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowQRCode(showQRCode === classItem.id ? null : classItem.id)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {showQRCode === classItem.id ? "Hide QR Code" : "Show QR Code"}
                </Button>
                
                {showQRCode === classItem.id && (
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <QRCodeGenerator value={classItem.qrCode} size={150} />
                  </div>
                )}
                
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onClassSelect?.(classItem)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};