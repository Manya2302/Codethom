import AuthLayout from '../AuthLayout';
import { Button } from '@/components/ui/button';

export default function AuthLayoutExample() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue to your account">
      <div className="space-y-4">
        <Button className="w-full">Example Content</Button>
      </div>
    </AuthLayout>
  );
}
