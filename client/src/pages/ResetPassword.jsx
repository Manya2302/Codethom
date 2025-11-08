import AuthLayout from '@/components/AuthLayout';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter the verification code and your new password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
