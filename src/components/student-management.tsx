import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QRCodeGenerator } from '@/components/ui/qr-code-generator';
import { Users, UserPlus, QrCode, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  qr_code: string;
  created_at: string;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch students from database
  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } else {
      setStudents(data || []);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `STU${year}${random}`;
  };

  const handleCreateStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const studentId = newStudent.student_id || generateStudentId();
    const qrCode = `STUDENT:${studentId}:${Date.now()}`;

    const { data, error } = await supabase
      .from('students')
      .insert([{
        student_id: studentId,
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        email: newStudent.email || null,
        qr_code: qrCode
      }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create student",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      setNewStudent({ student_id: '', first_name: '', last_name: '', email: '' });
      fetchStudents();
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      fetchStudents();
    }
  };

  const toggleQrCode = (studentId: string) => {
    setShowQrCode(showQrCode === studentId ? null : studentId);
  };

  return (
    <div className="space-y-6">
      {/* Create Student Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Student
          </CardTitle>
          <CardDescription>Register a new student and generate their QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID (optional)</Label>
              <Input
                id="student_id"
                value={newStudent.student_id}
                onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                placeholder="student@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={newStudent.first_name}
                onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={newStudent.last_name}
                onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateStudent} 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Student'}
          </Button>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Students ({students.length})
          </CardTitle>
          <CardDescription>Manage student records and QR codes</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students registered yet. Create your first student above.
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">
                          {student.first_name} {student.last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{student.student_id}</Badge>
                          {student.email && (
                            <span className="text-sm text-muted-foreground">{student.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* QR Code Display */}
                    {showQrCode === student.id && (
                      <div className="mt-4 p-4 bg-background/50 rounded-lg">
                        <div className="flex flex-col items-center space-y-2">
                          <QRCodeGenerator 
                            value={student.qr_code} 
                            size={150}
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            Student QR Code for Attendance
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQrCode(student.id)}
                    >
                      {showQrCode === student.id ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> Hide QR</>
                      ) : (
                        <><QrCode className="h-4 w-4 mr-1" /> Show QR</>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      Delete
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