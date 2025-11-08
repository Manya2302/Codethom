import DashboardLayout from '../DashboardLayout';

export default function DashboardLayoutExample() {
  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Content</h1>
        <p>This is where dashboard content goes.</p>
      </div>
    </DashboardLayout>
  );
}
