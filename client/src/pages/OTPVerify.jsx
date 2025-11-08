import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import OTPVerification from '@/components/OTPVerification';
import { useToast } from '@/hooks/use-toast';

export default function OTPVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    if (!pendingEmail) {
      setLocation('/signup');
      return;
    }
    setEmail(pendingEmail);
  }, [setLocation]);

  const handleVerify = async (otp) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.redirect) {
          localStorage.removeItem('pendingVerificationEmail');
          toast({
            title: 'Maximum Attempts Exceeded',
            description: result.message,
            variant: 'destructive',
          });
          setTimeout(() => {
            setLocation('/');
          }, 2000);
          return false;
        }
        
        toast({
          title: 'Error',
          description: result.message || 'Invalid verification code',
          variant: 'destructive',
        });
        return false;
      }

      localStorage.removeItem('pendingVerificationEmail');
      const userRole = localStorage.getItem('pendingVerificationRole') || 'customer';
      localStorage.removeItem('pendingVerificationRole');
      
      toast({
        title: 'Success!',
        description: 'Your email has been verified',
      });
      
      // Redirect to role-specific dashboard
      const dashboardPath = `/dashboard/${userRole}`;
      setLocation(dashboardPath);
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend code');
      }

      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend code. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the verification code we sent to your email"
    >
      <OTPVerification
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
      />
    </AuthLayout>
  );
}
