-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  max_attendees INTEGER NOT NULL DEFAULT 50,
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for students (public read access for QR scanning)
CREATE POLICY "Students are viewable by everyone" 
ON public.students 
FOR SELECT 
USING (true);

CREATE POLICY "Students can be inserted by everyone" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Students can be updated by everyone" 
ON public.students 
FOR UPDATE 
USING (true);

CREATE POLICY "Students can be deleted by everyone" 
ON public.students 
FOR DELETE 
USING (true);

-- Create policies for classes (public access for scanning)
CREATE POLICY "Classes are viewable by everyone" 
ON public.classes 
FOR SELECT 
USING (true);

CREATE POLICY "Classes can be inserted by everyone" 
ON public.classes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Classes can be updated by everyone" 
ON public.classes 
FOR UPDATE 
USING (true);

CREATE POLICY "Classes can be deleted by everyone" 
ON public.classes 
FOR DELETE 
USING (true);

-- Create policies for attendance records (public access)
CREATE POLICY "Attendance records are viewable by everyone" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "Attendance records can be inserted by everyone" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Attendance records can be updated by everyone" 
ON public.attendance_records 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();