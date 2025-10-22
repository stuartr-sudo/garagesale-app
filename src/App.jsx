import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react'
import { startReservationCleanup } from '@/api/functions'

function App() {
  // TEMPORARY FIX: Redirect any OAuth callback URLs to home
  useEffect(() => {
    const url = window.location.href;
    if (url.includes('supabase.co/auth') || url.includes('provider=') || url.includes('access_token=')) {
      console.log('Detected OAuth URL, redirecting to marketplace...');
      window.location.href = '/marketplace';
    }
  }, []);

  // Start automatic cleanup of expired reservations
  useEffect(() => {
    const cleanupInterval = startReservationCleanup();
    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App 