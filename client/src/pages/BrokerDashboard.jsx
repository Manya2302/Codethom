import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, Home, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BrokerDashboard() {
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

  const totalCommission = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout role="broker">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="text-welcome">
            Welcome, {user?.name || 'Broker'}!
            {user?.isReraVerified && (
              <Badge variant="default" className="gap-1" data-testid="badge-rera-verified">
                <CheckCircle2 className="h-3 w-3" />
                RERA Verified
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your clients and close deals with confidence.
          </p>
          {user?.reraId && (
            <p className="text-sm text-muted-foreground mt-1">
              RERA ID: <span className="font-mono">{user.reraId}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Active Clients"
            value="0"
            change={0}
            icon={<Users className="h-4 w-4" />}
            data-testid="card-clients"
          />
          <DashboardMetricCard
            title="Properties Managed"
            value="0"
            change={0}
            icon={<Home className="h-4 w-4" />}
            data-testid="card-properties"
          />
          <DashboardMetricCard
            title="Commission Earned"
            value={`$${totalCommission.toFixed(2)}`}
            change={15.7}
            icon={<TrendingUp className="h-4 w-4" />}
            data-testid="card-commission"
          />
          <DashboardMetricCard
            title="Documents"
            value={documents.length.toString()}
            change={3.4}
            icon={<FileText className="h-4 w-4" />}
            data-testid="card-documents"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Broker Features</CardTitle>
            <CardDescription>
              Your professional brokerage dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a RERA-verified broker, you have access to client management tools, 
              property listings, commission tracking, and professional networking features. 
              Your verified status builds trust with clients and partners.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
