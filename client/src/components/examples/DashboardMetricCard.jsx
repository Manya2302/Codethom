import { Users } from 'lucide-react';
import DashboardMetricCard from '../DashboardMetricCard';

export default function DashboardMetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <DashboardMetricCard
        title="Total Users"
        value="2,543"
        change={12.5}
        icon={<Users className="h-4 w-4" />}
      />
    </div>
  );
}
