import { useState, useEffect } from 'react';
import { Home, FileText, CreditCard, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CustomerDashboard() {
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

  const verifiedDocs = documents.filter(doc => doc.status === 'verified').length;
  const totalSpent = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout role="customer">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
            Welcome, {user?.name || 'Customer'}!
          </h1>
          <p className="text-muted-foreground">
            Explore properties and manage your real estate journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Properties Viewed"
            value="0"
            change={0}
            icon={<Home className="h-4 w-4" />}
            data-testid="card-properties"
          />
          <DashboardMetricCard
            title="Documents"
            value={documents.length.toString()}
            change={8.2}
            icon={<FileText className="h-4 w-4" />}
            data-testid="card-documents"
          />
          <DashboardMetricCard
            title="Verified Docs"
            value={verifiedDocs.toString()}
            change={15.3}
            icon={<FileText className="h-4 w-4" />}
            data-testid="card-verified"
          />
          <DashboardMetricCard
            title="Total Spent"
            value={`$${totalSpent.toFixed(2)}`}
            change={0}
            icon={<CreditCard className="h-4 w-4" />}
            data-testid="card-spent"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Features</CardTitle>
            <CardDescription>
              Your dashboard for property search and management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a verified customer, you can browse properties, save favorites, 
              and manage your documentation. Start exploring properties in your area today!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
