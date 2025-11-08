import AuthLayout from '@/components/AuthLayout';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a verification code"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
