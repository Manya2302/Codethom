import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TransactionHistory() {
  const transactions= [
    { id: 'TXN-001', date: '2025-01-15', amount: 99.00, status, method, description: 'Pro Plan Subscription' },
    { id: 'TXN-002', date: '2025-01-10', amount: 49.00, status, method, description: 'Starter Plan' },
    { id: 'TXN-003', date: '2025-01-05', amount: 199.00, status, method, description: 'Enterprise Plan' },
    { id: 'TXN-004', date: '2025-01-01', amount: 29.00, status, method, description: 'Basic Plan' },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      completed: { label, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      pending: { label, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      failed: { label, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button variant="outline" size="sm" data-testid="button-export-transactions">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Transaction ID</th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Description</th>
                <th className="text-left py-3 px-4 font-medium">Method</th>
                <th className="text-left py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border hover-elevate" data-testid={`transaction-${txn.id}`}>
                  <td className="py-3 px-4 font-mono text-sm">{txn.id}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{txn.date}</td>
                  <td className="py-3 px-4 text-sm">{txn.description}</td>
                  <td className="py-3 px-4 text-sm">{txn.method}</td>
                  <td className="py-3 px-4 font-semibold">${txn.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">{getStatusBadge(txn.status)}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" data-testid={`button-view-${txn.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
