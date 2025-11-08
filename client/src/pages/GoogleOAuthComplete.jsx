import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Briefcase, Shield, CheckCircle2, XCircle, Loader2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const googleOAuthSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'investor', 'vendor', 'broker'], {
    required_error: 'Please select a role',
  }),
  reraId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  // RERA ID is required for vendor and broker
  if ((data.role === 'vendor' || data.role === 'broker') && !data.reraId) {
    return false;
  }
  return true;
}, {
  message: 'RERA ID is required for Vendors and Brokers',
  path: ['reraId'],
});

export default function GoogleOAuthComplete() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [showReraField, setShowReraField] = useState(false);
  const [reraStatus, setReraStatus] = useState('idle');
  const [reraVerificationUrl, setReraVerificationUrl] = useState(null);
  const [isFormatOnly, setIsFormatOnly] = useState(false);
  const reraCheckTimeoutRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(googleOAuthSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      role: undefined,
      reraId: '',
    },
  });

  const selectedRole = form.watch('role');
  const reraId = form.watch('reraId');

  // Fetch Google profile from session
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/google/profile', {
          credentials: 'include'
        });
        if (response.ok) {
          const profile = await response.json();
          setGoogleProfile(profile);
        } else {
          toast({
            title: 'Error',
            description: 'Google profile not found. Please sign in with Google again.',
            variant: 'destructive',
          });
          setTimeout(() => setLocation('/signin'), 2000);
        }
      } catch (error) {
        console.error('Error fetching Google profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Google profile. Please try again.',
          variant: 'destructive',
        });
        setTimeout(() => setLocation('/signin'), 2000);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [toast, setLocation]);

  // Show RERA field when vendor or broker is selected
  useEffect(() => {
    if (selectedRole === 'vendor' || selectedRole === 'broker') {
      setShowReraField(true);
    } else {
      setShowReraField(false);
      form.setValue('reraId', '');
      setReraStatus('idle');
      if (reraCheckTimeoutRef.current) {
        clearTimeout(reraCheckTimeoutRef.current);
        reraCheckTimeoutRef.current = null;
      }
    }
  }, [selectedRole, form]);

  // Real-time RERA verification as user types
  const checkReraId = useCallback(async (reraIdValue) => {
    if (!reraIdValue || reraIdValue.length < 5) {
      setReraStatus('idle');
      setIsFormatOnly(false);
      setReraVerificationUrl(null);
      return;
    }

    setReraStatus('checking');

    // Clear previous timeout
    if (reraCheckTimeoutRef.current) {
      clearTimeout(reraCheckTimeoutRef.current);
    }

    // Debounce the API call
    reraCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/auth/check-rera', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reraId: reraIdValue }),
        });

        const result = await response.json();

        if (result.valid) {
          setReraStatus('valid');
          setIsFormatOnly(result.formatOnly || false);
          setReraVerificationUrl(result.verificationUrl || null);
        } else {
          setReraStatus('invalid');
          setIsFormatOnly(false);
          setReraVerificationUrl(null);
        }
      } catch (error) {
        console.error('RERA check error:', error);
        setReraStatus('idle');
      }
    }, 500);
  }, []);

  // Watch RERA ID field for changes
  useEffect(() => {
    if (showReraField && reraId) {
      checkReraId(reraId);
    } else {
      if (reraCheckTimeoutRef.current) {
        clearTimeout(reraCheckTimeoutRef.current);
        reraCheckTimeoutRef.current = null;
      }
      setReraStatus('idle');
    }
  }, [reraId, showReraField, checkReraId]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        role: data.role,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      // Include RERA ID for vendor/broker
      if (data.role === 'vendor' || data.role === 'broker') {
        payload.reraId = data.reraId;
      }

      const response = await fetch('/api/auth/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.message || 'Failed to complete registration',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // For Customer and Investor: Go to OTP verification
      if (result.requiresOTP) {
        toast({
          title: 'Account created!',
          description: 'Please verify your email to continue',
        });
        localStorage.setItem('pendingVerificationEmail', result.email);
        localStorage.setItem('pendingVerificationRole', data.role);
        setLocation('/verify-otp');
      }
      // For Vendor and Broker: Account pending manual review
      else if (result.requiresManualReview) {
        toast({
          title: 'Account Created - Pending Review',
          description: result.message || 'Your account is pending admin verification. You will be notified via email.',
        });
        setTimeout(() => {
          setLocation('/signin');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your Google profile...</p>
        </div>
      </div>
    );
  }

  if (!googleProfile) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Registration</CardTitle>
          <CardDescription>
            We've retrieved your information from Google. Please complete the form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display Google Profile Info (Read-only) */}
          <div className="mb-6 p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{googleProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{googleProfile.email}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer" data-testid="role-customer">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Customer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="investor" data-testid="role-investor">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>Investor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="vendor" data-testid="role-vendor">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Vendor (Requires RERA)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="broker" data-testid="role-broker">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Broker (Requires RERA)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedRole === 'vendor' || selectedRole === 'broker'
                        ? 'As a verified professional, you will need to provide your RERA ID'
                        : 'Select the role that best describes you'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showReraField && (
                <FormField
                  control={form.control}
                  name="reraId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RERA Registration ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="e.g., PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA07880/070121"
                            className="pl-10 pr-24"
                            data-testid="input-rera-id"
                            {...field}
                          />
                          {reraStatus !== 'idle' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {reraStatus === 'checking' && (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Checking...</span>
                                </>
                              )}
                              {reraStatus === 'valid' && (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-xs font-medium text-green-600" data-testid="text-rera-verified">
                                    {isFormatOnly ? 'Format OK' : 'Verified'}
                                  </span>
                                </>
                              )}
                              {reraStatus === 'invalid' && (
                                <>
                                  <XCircle className="h-4 w-4 text-destructive" />
                                  <span className="text-xs text-destructive">Invalid</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        {isFormatOnly && reraVerificationUrl ? (
                          <span className="flex flex-col gap-1">
                            <span>Format validated. For real verification, check on:</span>
                            <a 
                              href={reraVerificationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm font-medium"
                              data-testid="link-manual-verification"
                            >
                              Gujarat RERA Website →
                            </a>
                          </span>
                        ) : (
                          'Enter your valid RERA registration number for verification'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          data-testid="input-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-10"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-complete-registration"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

