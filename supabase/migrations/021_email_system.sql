-- ============================================
-- EMAIL SYSTEM MIGRATION
-- ============================================
-- This migration adds email logging and tracking capabilities
-- for the Gmail OAuth integration

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'failed', 'pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  template_name TEXT,
  error_message TEXT,
  message_id TEXT, -- Gmail message ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON email_logs(template_name);

-- Add email verification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER DEFAULT 0;

-- Create index for email verification
CREATE INDEX IF NOT EXISTS idx_profiles_email_verification_token ON profiles(email_verification_token);

-- Create email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  welcome_emails BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  order_updates BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  account_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email preferences
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Create email templates table for dynamic templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content) VALUES
(
  'welcome',
  'Welcome to GarageSale! 🎉',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #06b6d4;">Welcome to GarageSale!</h1><p>Thanks for joining our community marketplace!</p></div>',
  'Welcome to GarageSale!\n\nThanks for joining our community marketplace!'
),
(
  'payment_confirmation',
  '💰 Payment Confirmation Required - Action Needed',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #dc2626;">Payment Confirmation Required</h1><p>A buyer has confirmed payment for your item.</p></div>',
  'Payment Confirmation Required\n\nA buyer has confirmed payment for your item.'
),
(
  'order_confirmation',
  '✅ Order Confirmed - Payment Details',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #10b981;">Order Confirmed!</h1><p>Your order has been confirmed.</p></div>',
  'Order Confirmed!\n\nYour order has been confirmed.'
),
(
  'account_restriction',
  '⚠️ Account Restricted - Payment Confirmations Required',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #dc2626;">Account Restricted</h1><p>Your account has been restricted due to pending payment confirmations.</p></div>',
  'Account Restricted\n\nYour account has been restricted due to pending payment confirmations.'
)
ON CONFLICT (name) DO NOTHING;

-- Create function to update email_logs updated_at
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_logs updated_at
DROP TRIGGER IF EXISTS trigger_update_email_logs_updated_at ON email_logs;
CREATE TRIGGER trigger_update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- Create function to update email_preferences updated_at
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_preferences updated_at
DROP TRIGGER IF EXISTS trigger_update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER trigger_update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Create function to update email_templates updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_templates updated_at
DROP TRIGGER IF EXISTS trigger_update_email_templates_updated_at ON email_templates;
CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Create function to get email statistics
CREATE OR REPLACE FUNCTION get_email_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_emails', COUNT(*),
    'sent_emails', COUNT(*) FILTER (WHERE status = 'sent'),
    'failed_emails', COUNT(*) FILTER (WHERE status = 'failed'),
    'delivered_emails', COUNT(*) FILTER (WHERE status = 'delivered'),
    'bounced_emails', COUNT(*) FILTER (WHERE status = 'bounced'),
    'emails_today', COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE),
    'emails_this_week', COUNT(*) FILTER (WHERE sent_at >= DATE_TRUNC('week', CURRENT_DATE)),
    'emails_this_month', COUNT(*) FILTER (WHERE sent_at >= DATE_TRUNC('month', CURRENT_DATE))
  ) INTO result
  FROM email_logs;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user email preferences
CREATE OR REPLACE FUNCTION get_user_email_preferences(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(
    json_build_object(
      'welcome_emails', welcome_emails,
      'payment_notifications', payment_notifications,
      'order_updates', order_updates,
      'marketing_emails', marketing_emails,
      'account_notifications', account_notifications
    ),
    json_build_object(
      'welcome_emails', true,
      'payment_notifications', true,
      'order_updates', true,
      'marketing_emails', false,
      'account_notifications', true
    )
  ) INTO result
  FROM email_preferences
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user email preferences
CREATE OR REPLACE FUNCTION update_user_email_preferences(
  p_user_id UUID,
  p_welcome_emails BOOLEAN DEFAULT NULL,
  p_payment_notifications BOOLEAN DEFAULT NULL,
  p_order_updates BOOLEAN DEFAULT NULL,
  p_marketing_emails BOOLEAN DEFAULT NULL,
  p_account_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO email_preferences (
    user_id,
    welcome_emails,
    payment_notifications,
    order_updates,
    marketing_emails,
    account_notifications
  ) VALUES (
    p_user_id,
    COALESCE(p_welcome_emails, true),
    COALESCE(p_payment_notifications, true),
    COALESCE(p_order_updates, true),
    COALESCE(p_marketing_emails, false),
    COALESCE(p_account_notifications, true)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    welcome_emails = COALESCE(p_welcome_emails, email_preferences.welcome_emails),
    payment_notifications = COALESCE(p_payment_notifications, email_preferences.payment_notifications),
    order_updates = COALESCE(p_order_updates, email_preferences.order_updates),
    marketing_emails = COALESCE(p_marketing_emails, email_preferences.marketing_emails),
    account_notifications = COALESCE(p_account_notifications, email_preferences.account_notifications),
    updated_at = NOW();
  
  SELECT get_user_email_preferences(p_user_id) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own email logs
CREATE POLICY "Users can insert their own email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create RLS policies for email_preferences
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own email preferences
CREATE POLICY "Users can view their own email preferences" ON email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" ON email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email templates
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Everyone can view active email templates
CREATE POLICY "Everyone can view active email templates" ON email_templates
  FOR SELECT USING (is_active = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON email_logs TO anon, authenticated;
GRANT ALL ON email_preferences TO anon, authenticated;
GRANT ALL ON email_templates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_email_statistics() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_email_preferences(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_email_preferences(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO anon, authenticated;
