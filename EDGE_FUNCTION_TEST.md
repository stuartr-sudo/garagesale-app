# Edge Function Deployment Test

## 🧪 How to Test if send-gmail Function is Deployed

### Method 1: Browser Console Test
1. Open your GarageSale app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Paste and run this code:

```javascript
// Test if the send-gmail Edge Function is deployed
async function testEdgeFunction() {
  try {
    console.log('🧪 Testing send-gmail Edge Function...')
    
    const { data, error } = await supabase.functions.invoke('send-gmail', {
      body: {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<h1>Test Email</h1>',
        text: 'Test Email'
      }
    })
    
    if (error) {
      console.log('❌ Function Error:', error.message)
      
      if (error.message.includes('Function not found') || error.message.includes('404')) {
        console.log('🚨 The send-gmail function is NOT deployed yet.')
        console.log('📋 To deploy it, run: supabase functions deploy send-gmail')
      } else if (error.message.includes('Gmail OAuth credentials not configured')) {
        console.log('✅ Function is deployed but Gmail OAuth credentials need to be configured.')
        console.log('📋 Set environment variables in Supabase Dashboard → Settings → Edge Functions')
      } else {
        console.log('⚠️ Function is deployed but has configuration issues.')
        console.log('🔍 Error details:', error)
      }
    } else {
      console.log('✅ Function is deployed and working!')
      console.log('📧 Response:', data)
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

// Run the test
testEdgeFunction()
```

### Method 2: Supabase Dashboard Check
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Look for `send-gmail` in the list
4. Check the status - it should show "Deployed" with a green indicator

### Method 3: Direct URL Test
Try accessing the function directly:
```
https://your-project-ref.supabase.co/functions/v1/send-gmail
```

If you get a 404 error, the function is not deployed.
If you get a different error (like authentication or configuration), the function is deployed but needs configuration.

## 📋 Expected Results

### If Function is NOT Deployed:
- Error: "Function not found" or 404
- Solution: Run `supabase functions deploy send-gmail`

### If Function is Deployed but NOT Configured:
- Error: "Gmail OAuth credentials not configured"
- Solution: Set environment variables in Supabase Dashboard

### If Function is Working:
- Success response with email details
- Ready to use!

## 🚀 Next Steps Based on Results

### If NOT Deployed:
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Deploy: `supabase functions deploy send-gmail`

### If Deployed but NOT Configured:
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add these environment variables:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_FROM_EMAIL`

### If Working:
1. Run the database migration: `supabase/migrations/021_email_system.sql`
2. Test email functionality
3. Configure Gmail OAuth credentials
