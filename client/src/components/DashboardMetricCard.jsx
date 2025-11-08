import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardMetricCard({ 
  title, 
  value, 
  change, 
  icon 
}) {
  const isPositive = change >= 0;

  return (
    <Card data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold" data-testid="text-metric-value">{value}</div>
          <div className={`flex items-center text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            <span data-testid="text-metric-change">
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
