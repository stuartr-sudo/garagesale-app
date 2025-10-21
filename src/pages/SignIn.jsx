import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SignIn() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Removed auto-redirect - let users actually sign in

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        await User.signUp(email, password, { full_name: fullName });
        setMessage('Check your email for the confirmation link!');
      } else {
        await User.signIn(email, password);
        navigate(createPageUrl('Marketplace'));
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await User.signInWithGoogle();
      navigate(createPageUrl('Marketplace'));
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-bold text-3xl text-white">GarageSale</h1>
        </div>

        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isSignUp
                ? 'Sign up to start selling and buying'
                : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="bg-green-900/20 border-green-800 text-green-300">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="••••••••"
                  minLength={6}
                />
                {isSignUp && (
                  <p className="text-xs text-gray-400">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : isSignUp ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full h-12 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                }}
                className="text-pink-400 hover:text-pink-300"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="text-center">
              <Link
                to={createPageUrl('Home')}
                className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-400 mt-4">
          By signing up, you agree to our{' '}
          <Link to={createPageUrl('Terms')} className="text-pink-400 hover:text-pink-300">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to={createPageUrl('Privacy')} className="text-pink-400 hover:text-pink-300">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

