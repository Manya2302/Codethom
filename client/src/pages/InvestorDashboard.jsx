import { useState, useEffect } from 'react';
import { TrendingUp, FileText, CreditCard, BarChart3 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function InvestorDashboard() {
  const { user } = useUser();
  const [documents, setDocuments] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [docsRes, txnsRes] = await Promise.all([
        fetch(`/api/documents/${user.id}`),
        fetch(`/api/transactions/${user.id}`)
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }

      if (txnsRes.ok) {
        const txnsData = await txnsRes.json();
        setTransactions(txnsData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const totalInvested = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout role="investor">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
            Welcome, {user?.name || 'Investor'}!
          </h1>
          <p className="text-muted-foreground">
            Track your investments and discover new opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Active Investments"
            value="0"
            change={0}
            icon={<TrendingUp className="h-4 w-4" />}
            data-testid="card-investments"
          />
          <DashboardMetricCard
            title="Portfolio Value"
            value={`$${totalInvested.toFixed(2)}`}
            change={12.5}
            icon={<BarChart3 className="h-4 w-4" />}
            data-testid="card-portfolio"
          />
          <DashboardMetricCard
            title="Documents"
            value={documents.length.toString()}
            change={5.1}
            icon={<FileText className="h-4 w-4" />}
            data-testid="card-documents"
          />
          <DashboardMetricCard
            title="ROI"
            value="0%"
            change={0}
            icon={<TrendingUp className="h-4 w-4" />}
            data-testid="card-roi"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Investor Features</CardTitle>
            <CardDescription>
              Your investment management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a verified investor, you have access to exclusive investment opportunities, 
              detailed analytics, and portfolio management tools. Start building your real estate 
              portfolio today!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
