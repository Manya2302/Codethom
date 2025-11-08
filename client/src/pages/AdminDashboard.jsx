import { useState, useEffect } from 'react';
import { Users, UserPlus, Activity, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import UserManagementTable from '@/components/UserManagementTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import AddAdminModal from '@/components/AddAdminModal';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    revenue: 0,
    growthRate: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      } else {
        const errorData = await statsRes.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to load statistics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin statistics',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Admin'}</h1>
            <p className="text-muted-foreground">Manage users, view analytics, and monitor system health.</p>
          </div>
          <Button onClick={() => setShowAddAdminModal(true)} data-testid="button-open-add-admin">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Total Users"
            value={stats.totalUsers.toString()}
            change={12.5}
            icon={<Users className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Active Users"
            value={stats.activeUsers.toString()}
            change={8.2}
            icon={<Activity className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
            change={15.3}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Growth Rate"
            value={`${stats.growthRate}%`}
            change={5.7}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
        <UserManagementTable onRefresh={fetchAdminStats} />
        <AnalyticsCharts />
      </div>
      {showAddAdminModal && <AddAdminModal onClose={() => { setShowAddAdminModal(false); fetchAdminStats(); }} />}
    </DashboardLayout>
  );
}
