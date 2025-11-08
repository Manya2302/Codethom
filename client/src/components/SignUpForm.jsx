import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Briefcase, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
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

export default function SignUpForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showReraField, setShowReraField] = useState(false);
  const [reraStatus, setReraStatus] = useState('idle');
  const [reraVerificationUrl, setReraVerificationUrl] = useState(null);
  const [isFormatOnly, setIsFormatOnly] = useState(false);
  const reraCheckTimeoutRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      reraId: '',
    },
  });

  const selectedRole = form.watch('role');
  const reraId = form.watch('reraId');

  // Show RERA field when vendor or broker is selected
  useEffect(() => {
    if (selectedRole === 'vendor' || selectedRole === 'broker') {
      setShowReraField(true);
    } else {
      setShowReraField(false);
      form.setValue('reraId', '');
      setReraStatus('idle');
      // Clear any pending RERA check timeout when role changes
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

    try {
      const response = await fetch('/api/auth/check-rera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reraId: reraIdValue }),
      });

      const result = await response.json();

      if (result.valid && result.formatValid) {
        setReraStatus('valid');
        setIsFormatOnly(!result.realVerification);
        setReraVerificationUrl(result.verificationUrl || null);
      } else {
        setReraStatus('invalid');
        setIsFormatOnly(false);
        setReraVerificationUrl(null);
      }
    } catch (error) {
      setReraStatus('invalid');
      setIsFormatOnly(false);
      setReraVerificationUrl(null);
    }
  }, []);

  // Debounced RERA check
  useEffect(() => {
    if (showReraField && reraId) {
      // Clear any pending timeout
      if (reraCheckTimeoutRef.current) {
        clearTimeout(reraCheckTimeoutRef.current);
      }

      const timeout = setTimeout(() => {
        checkReraId(reraId);
      }, 800);

      reraCheckTimeoutRef.current = timeout;

      return () => {
        if (reraCheckTimeoutRef.current) {
          clearTimeout(reraCheckTimeoutRef.current);
        }
      };
    } else if (showReraField && !reraId) {
      // Clear timeout and reset status when RERA field is empty
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
      const signupPayload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };

      // Include RERA ID for vendor/broker
      if (data.role === 'vendor' || data.role === 'broker') {
        signupPayload.reraId = data.reraId;
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create account',
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
        localStorage.setItem('pendingVerificationEmail', data.email);
        localStorage.setItem('pendingVerificationRole', data.role);
        setLocation('/verify-otp');
      }
      // For Vendor and Broker: Account created with RERA verification
      else if (result.requiresLogin) {
        toast({
          title: 'Success!',
          description: 'Account created and RERA verified! Please sign in to continue.',
        });
        setTimeout(() => {
          setLocation('/signin');
        }, 1500);
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

  return (
    <div className="w-full max-w-md space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your name"
                      className="pl-10"
                      data-testid="input-name"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your email"
                      className="pl-10"
                      data-testid="input-email"
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
                      placeholder="Create a password"
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
            disabled={
              isLoading || 
              (showReraField && reraStatus !== 'valid')
            }
            data-testid="button-sign-up"
          >
            {isLoading
              ? 'Creating account...'
              : showReraField && reraStatus !== 'valid'
                ? 'Verify RERA ID to Continue'
                : 'Create Account'}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = '/api/auth/google'}
          data-testid="button-google-signin"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/signin">
            <Button variant="link" className="px-0" data-testid="link-sign-in">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
