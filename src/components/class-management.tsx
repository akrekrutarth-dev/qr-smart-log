import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QRCodeGenerator } from '@/components/ui/qr-code-generator';
import { Calendar, Clock, Users, Plus, QrCode, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClassAnalytics } from './class-analytics';

interface AttendanceClass {
  id: string;
  name: string;
  date: string;
  time: string;
  qr_code: string;
  max_attendees: number;
  created_at: string;
  currentAttendees?: number;
}

interface ClassManagementProps {
  onClassSelect?: (classItem: AttendanceClass) => void;
}

export const ClassManagement = ({ onClassSelect }: ClassManagementProps) => {
  const [classes, setClasses] = useState<AttendanceClass[]>([]);
  const [newClass, setNewClass] = useState({
    name: '',
    date: '',
    time: '',
    maxAttendees: 30
  });
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch classes from database
  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive"
      });
    } else {
      // Get attendance count for each class
      const classesWithAttendance = await Promise.all(
        (data || []).map(async (classItem) => {
          const { count } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id);
          
          return {
            ...classItem,
            currentAttendees: count || 0
          };
        })
      );
      setClasses(classesWithAttendance);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.date || !newClass.time) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const qrCode = `CLASS:${newClass.name}:${newClass.date}:${newClass.time}:${Date.now()}`;

    const { data, error } = await supabase
      .from('classes')
      .insert([{
        name: newClass.name,
        date: newClass.date,
        time: newClass.time,
        max_attendees: newClass.maxAttendees,
        qr_code: qrCode
      }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      setNewClass({ name: '', date: '', time: '', maxAttendees: 30 });
      fetchClasses();
    }
  };

  const toggleQrCode = (classId: string) => {
    setShowQrCode(showQrCode === classId ? null : classId);
  };

  const toggleAnalytics = (classId: string) => {
    setShowAnalytics(showAnalytics === classId ? null : classId);
  };

  return (
    <div className="space-y-6">
      {/* Create Class Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Class Session
          </CardTitle>
          <CardDescription>Set up a new class session and generate QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="e.g., Computer Science 101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={newClass.maxAttendees}
                onChange={(e) => setNewClass({ ...newClass, maxAttendees: parseInt(e.target.value) || 30 })}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newClass.date}
                onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={newClass.time}
                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateClass} 
            className="w-full"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Class Session'}
          </Button>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Class Sessions ({classes.length})
          </CardTitle>
          <CardDescription>Manage your class sessions and QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No classes created yet. Create your first class above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-medium">{classItem.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      {classItem.date} at {classItem.time}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">
                          {classItem.currentAttendees || 0}/{classItem.max_attendees} attendees
                        </span>
                      </div>
                      <Badge variant={(classItem.currentAttendees || 0) >= classItem.max_attendees ? "destructive" : "secondary"}>
                        {(classItem.currentAttendees || 0) >= classItem.max_attendees ? 'Full' : 'Open'}
                      </Badge>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {showQrCode === classItem.id && (
                    <div className="mt-4 p-4 bg-background/50 rounded-lg">
                      <div className="flex flex-col items-center space-y-2">
                        <QRCodeGenerator 
                          value={classItem.qr_code} 
                          size={150}
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Scan this QR code to mark attendance for this class
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Analytics Display */}
                  {showAnalytics === classItem.id && (
                    <div className="mt-4">
                      <ClassAnalytics classId={classItem.id} />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleQrCode(classItem.id)}
                    >
                      {showQrCode === classItem.id ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> Hide QR</>
                      ) : (
                        <><QrCode className="h-4 w-4 mr-1" /> Show QR</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleAnalytics(classItem.id)}
                    >
                      {showAnalytics === classItem.id ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> Hide Stats</>
                      ) : (
                        <><BarChart3 className="h-4 w-4 mr-1" /> Analytics</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onClassSelect?.(classItem)}
                    >
                      Select
                    </Button>
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