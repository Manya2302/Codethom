import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsCharts from '@/components/AnalyticsCharts';

export default function AdminAnalytics() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-muted-foreground">View detailed analytics and data visualizations.</p>
        </div>
        <AnalyticsCharts />
      </div>
    </DashboardLayout>
  );
}

