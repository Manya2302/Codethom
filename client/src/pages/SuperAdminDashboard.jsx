import { useState, useEffect } from 'react';
import { Users, UserCog, Activity, DollarSign, Shield, Building2, Handshake, TrendingUp, UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import RoleBasedUserTable from '@/components/RoleBasedUserTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import AddSuperAdminModal from '@/components/AddSuperAdminModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

export default function SuperAdminDashboard() {
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    revenue: 0,
    growthRate: 0,
    usersByRole: {
      admins: 0,
      vendors: 0,
      customers: 0,
      brokers: 0,
      investors: 0
    }
  });

  useEffect(() => {
    fetchSuperAdminStats();
  }, []);

  const fetchSuperAdminStats = async () => {
    try {
      const statsRes = await fetch('/api/superadmin/stats');
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
      console.error('Error fetching super admin stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load super admin statistics',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Super Admin'}</h1>
            <p className="text-muted-foreground">Manage all users, admins, and monitor system-wide analytics.</p>
          </div>
          <Button onClick={() => setShowAddAdminModal(true)} data-testid="button-open-add-superadmin">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin/SuperAdmin
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
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.usersByRole.admins}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{stats.usersByRole.vendors}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">{stats.usersByRole.customers}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brokers</p>
                <p className="text-2xl font-bold">{stats.usersByRole.brokers}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investors</p>
                <p className="text-2xl font-bold">{stats.usersByRole.investors}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" data-testid="tab-all-users">All Users</TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admins">Admins</TabsTrigger>
            <TabsTrigger value="vendor" data-testid="tab-vendors">Vendors</TabsTrigger>
            <TabsTrigger value="customer" data-testid="tab-customers">Customers</TabsTrigger>
            <TabsTrigger value="broker" data-testid="tab-brokers">Brokers</TabsTrigger>
            <TabsTrigger value="investor" data-testid="tab-investors">Investors</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <RoleBasedUserTable role="all" onRefresh={fetchSuperAdminStats} />
          </TabsContent>
          <TabsContent value="admin">
            <RoleBasedUserTable role="admin" onRefresh={fetchSuperAdminStats} />
          </TabsContent>
          <TabsContent value="vendor">
            <RoleBasedUserTable role="vendor" onRefresh={fetchSuperAdminStats} />
          </TabsContent>
          <TabsContent value="customer">
            <RoleBasedUserTable role="customer" onRefresh={fetchSuperAdminStats} />
          </TabsContent>
          <TabsContent value="broker">
            <RoleBasedUserTable role="broker" onRefresh={fetchSuperAdminStats} />
          </TabsContent>
          <TabsContent value="investor">
            <RoleBasedUserTable role="investor" onRefresh={fetchSuperAdminStats} />
          </TabsContent>
        </Tabs>

        <AnalyticsCharts />
      </div>
      {showAddAdminModal && <AddSuperAdminModal onClose={() => { setShowAddAdminModal(false); fetchSuperAdminStats(); }} />}
    </DashboardLayout>
  );
}
