import AuthLayout from '@/components/AuthLayout';
import SignInForm from '@/components/SignInForm';
import loginImage from '@assets/generated_images/Territory_management_workspace_login_fd621cc1.png';

export default function SignIn() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your account"
      image={loginImage}
    >
      <SignInForm />
    </AuthLayout>
  );
}
