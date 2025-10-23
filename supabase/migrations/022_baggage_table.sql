-- Create baggage table for admin/super admin baggage management
CREATE TABLE IF NOT EXISTS baggage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  contents TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_baggage_created_at ON baggage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baggage_color ON baggage(color);
CREATE INDEX IF NOT EXISTS idx_baggage_weight ON baggage(weight);

-- Enable Row Level Security
ALTER TABLE baggage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admin and super_admin users can access baggage table
CREATE POLICY "Only admin and super_admin can view baggage" ON baggage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admin and super_admin can insert baggage" ON baggage
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admin and super_admin can update baggage" ON baggage
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admin and super_admin can delete baggage" ON baggage
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_baggage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_baggage_updated_at
  BEFORE UPDATE ON baggage
  FOR EACH ROW
  EXECUTE FUNCTION update_baggage_updated_at();
