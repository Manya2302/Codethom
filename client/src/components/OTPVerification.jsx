import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

export default function OTPVerification({ email, onVerify, onResend }) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter all 6 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await onVerify(otp);
    setIsLoading(false);
    if (!success) {
      setOtp('');
    }
  };

  const handleResend = async () => {
    const success = await onResend();
    if (success) {
      toast({
        title: 'Code sent',
        description: 'A new verification code has been sent to your email',
      });
      setOtp('');
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          We sent a verification code to
        </p>
        <p className="font-medium" data-testid="text-email">
          {email}
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          data-testid="input-otp"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={handleVerify}
        className="w-full"
        disabled={isLoading || otp.length !== 6}
        data-testid="button-verify"
      >
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Didn't receive the code?
        </p>
        <Button
          variant="ghost"
          onClick={handleResend}
          className="text-sm"
          data-testid="button-resend"
        >
          Resend Code
        </Button>
      </div>
    </div>
  );
}
