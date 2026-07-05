'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Zap, Loader2, AlertCircle } from 'lucide-react';

import { useAuth } from '../../providers/AuthProvider';

export default function Signup() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/auth/signup', formData);
      const { accessToken, user } = response.data;
      
      // Save session using context
      login(accessToken, user);
      
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'An error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Servify</span>
          </Link>
        </div>

        <Card className="border-slate-850 bg-slate-900/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
              Create an account
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Enter your details below to create your marketplace account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{Array.isArray(error) ? error.join(', ') : error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-slate-300">Join as</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-white shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="customer" className="bg-slate-950 text-white">Customer (Buyer)</option>
                  <option value="freelancer" className="bg-slate-950 text-white">Freelancer (Seller)</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="mt-2 text-xs text-center text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
