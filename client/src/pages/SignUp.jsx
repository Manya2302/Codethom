import AuthLayout from '@/components/AuthLayout';
import SignUpForm from '@/components/SignUpForm';
import signupImage from '@assets/generated_images/Territory_planning_signup_image_f50fb0d4.png';

export default function SignUp() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to get started with TerriSmart"
      image={signupImage}
    >
      <SignUpForm />
    </AuthLayout>
  );
}
