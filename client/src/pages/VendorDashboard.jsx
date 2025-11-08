import { useState, useEffect } from 'react';
import { Building2, FileText, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VendorDashboard() {
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

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout role="vendor">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="text-welcome">
            Welcome, {user?.name || 'Vendor'}!
            {user?.isReraVerified && (
              <Badge variant="default" className="gap-1" data-testid="badge-rera-verified">
                <CheckCircle2 className="h-3 w-3" />
                RERA Verified
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your properties and connect with potential buyers.
          </p>
          {user?.reraId && (
            <p className="text-sm text-muted-foreground mt-1">
              RERA ID: <span className="font-mono">{user.reraId}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Active Listings"
            value="0"
            change={0}
            icon={<Building2 className="h-4 w-4" />}
            data-testid="card-listings"
          />
          <DashboardMetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            change={8.3}
            icon={<TrendingUp className="h-4 w-4" />}
            data-testid="card-revenue"
          />
          <DashboardMetricCard
            title="Inquiries"
            value="0"
            change={0}
            icon={<Users className="h-4 w-4" />}
            data-testid="card-inquiries"
          />
          <DashboardMetricCard
            title="Documents"
            value={documents.length.toString()}
            change={5.2}
            icon={<FileText className="h-4 w-4" />}
            data-testid="card-documents"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Features</CardTitle>
            <CardDescription>
              Your property management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a RERA-verified vendor, you can list properties, manage inquiries, 
              and connect with potential buyers. Your verified status gives customers 
              confidence in your listings.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
