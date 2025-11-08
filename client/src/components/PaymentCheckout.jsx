import { CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PaymentCheckout() {
  const orderSummary = {
    subtotal: 99.00,
    tax: 8.91,
    total: 107.91,
  };

  const handlePayPalCheckout = () => {
    console.log('PayPal checkout initiated');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={handlePayPalCheckout}
              data-testid="button-paypal-checkout"
            >
              <DollarSign className="mr-3 h-6 w-6 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold">PayPal</p>
                <p className="text-sm text-muted-foreground">Pay securely with PayPal</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              data-testid="button-card-checkout"
            >
              <CreditCard className="mr-3 h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Credit Card</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${orderSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${orderSummary.tax.toFixed(2)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span data-testid="text-total-amount">${orderSummary.total.toFixed(2)}</span>
            </div>
            <Button className="w-full" size="lg" data-testid="button-complete-purchase">
              Complete Purchase
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
