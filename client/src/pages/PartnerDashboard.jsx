import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, FileText } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { useUser } from '@/contexts/UserContext';

export default function PartnerDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    revenue: 0,
    growth: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchPartnerStats();
    }
  }, [user]);

  const fetchPartnerStats = async () => {
    try {
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const users = await usersRes.json();
        const clients = users.filter(u => u.role === 'user');
        setStats({
          totalClients: clients.length,
          activeProjects: clients.filter(c => c.status === 'active').length,
          revenue: 0,
          growth: 0
        });
      }
    } catch (error) {
      console.error('Error fetching partner stats:', error);
    }
  };

  return (
    <DashboardLayout role="partner">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Partner'}</h1>
          <p className="text-muted-foreground">Track your clients, revenue, and performance metrics.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Total Clients"
            value={stats.totalClients.toString()}
            change={12.5}
            icon={<Users className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Active Projects"
            value={stats.activeProjects.toString()}
            change={8.2}
            icon={<FileText className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
            change={15.3}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Growth"
            value={`${stats.growth}%`}
            change={5.7}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>
        <AnalyticsCharts />
      </div>
    </DashboardLayout>
  );
}
