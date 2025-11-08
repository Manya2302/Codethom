import { useState, useEffect } from 'react';
import { Users, FileText, CreditCard, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import UserProfileForm from '@/components/UserProfileForm';
import DocumentUpload from '@/components/DocumentUpload';
import { useUser } from '@/contexts/UserContext';

export default function UserDashboard() {
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
  const activityScore = documents.length > 0 
    ? Math.min(100, Math.round((verifiedDocs / documents.length) * 100))
    : 0;

  return (
    <DashboardLayout role="user">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your account today.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardMetricCard
            title="Total Documents"
            value={documents.length.toString()}
            change={8.2}
            icon={<FileText className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Verified Docs"
            value={verifiedDocs.toString()}
            change={15.3}
            icon={<FileText className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Total Spent"
            value={`$${totalSpent.toFixed(2)}`}
            change={-3.1}
            icon={<CreditCard className="h-4 w-4" />}
          />
          <DashboardMetricCard
            title="Activity Score"
            value={`${activityScore}%`}
            change={12.5}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserProfileForm />
          <DocumentUpload />
        </div>
      </div>
    </DashboardLayout>
  );
}
