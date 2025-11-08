import OTPVerification from '../OTPVerification';

export default function OTPVerificationExample() {
  return (
    <OTPVerification
      email="user@example.com"
      onVerify={(otp) => console.log('OTP verified:', otp)}
      onResend={() => console.log('OTP resent')}
    />
  );
}
