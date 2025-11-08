import DashboardLayout from '@/components/DashboardLayout';
import PaymentCheckout from '@/components/PaymentCheckout';
import TransactionHistory from '@/components/TransactionHistory';

export default function Payment() {
  return (
    <DashboardLayout role="user">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payments</h1>
          <p className="text-muted-foreground">Manage your subscription and view transaction history.</p>
        </div>
        <PaymentCheckout />
        <TransactionHistory />
      </div>
    </DashboardLayout>
  );
}
