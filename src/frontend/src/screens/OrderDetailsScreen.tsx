import { useState } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useSingleOrder } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, IndianRupee, Edit, Wallet } from 'lucide-react';
import { formatDeliveryDate } from '../services/orderQueries';
import { UpdatePaymentDialog } from './UpdatePaymentDialog';

export function OrderDetailsScreen() {
  const { navigateTo, selectedOrderId } = useNavigation();
  const { data: order, isLoading } = useSingleOrder(selectedOrderId);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    return status === 'Pending' ? 'secondary' : 'default';
  };

  const getPaymentStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Partial':
        return 'secondary';
      case 'Unpaid':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp, 10));
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('orders-list')}
            className="transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ScreenTitle>Order Details</ScreenTitle>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('orders-list')}
            className="transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ScreenTitle>Order Details</ScreenTitle>
        </div>
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No order selected. Please select an order from the Orders list to view its details.
            </p>
            <Button
              onClick={() => navigateTo('orders-list')}
              className="mt-4"
              variant="outline"
            >
              Go to Orders List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('orders-list')}
            className="transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ScreenTitle>Order Details</ScreenTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTo('edit-order')}
          className="shrink-0"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Order Header */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{order.orderId}</CardTitle>
            <Badge variant={getStatusVariant(order.status)} className="text-sm">
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="text-base font-medium">{order.customerName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Booking Date</p>
              <p className="text-sm font-medium">{formatDeliveryDate(order.bookingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Date</p>
              <p className="text-sm font-medium">{formatDeliveryDate(order.deliveryDate)}</p>
            </div>
          </div>
          {order.deliveredAt && (
            <div>
              <p className="text-sm text-muted-foreground">Delivered At</p>
              <p className="text-sm font-medium">{formatDeliveryDate(order.deliveredAt)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing & Payment */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Pricing & Payment</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentDialogOpen(true)}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Update Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Price Total</p>
              <p className="text-base font-semibold">₹{order.priceTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Advance Paid</p>
              <p className="text-base font-semibold">₹{order.advancePaid.toFixed(2)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance Amount</p>
            <p className="text-lg font-bold text-primary">₹{order.balanceAmount.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="mt-1">
                {order.paymentStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="text-sm font-medium mt-1">{order.paymentMethod}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {!order.paymentHistory || order.paymentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No payment updates yet</p>
          ) : (
            <div className="space-y-3">
              {[...order.paymentHistory].reverse().map((entry, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 space-y-2 bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.changeType === 'add-payment' ? 'Additional Payment' : 'Advance Updated'}
                        </Badge>
                        {entry.paymentMethod && (
                          <span className="text-xs text-muted-foreground">
                            via {entry.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.changeType === 'add-payment' && entry.amountChanged && (
                        <p className="text-sm font-semibold text-green-600">
                          +₹{entry.amountChanged.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Total: ₹{entry.resultingAdvancePaid.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {entry.auditNote && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Note:</p>
                      <p className="text-sm">{entry.auditNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {order.notes && order.notes.trim() !== '' ? (
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No notes</p>
          )}
        </CardContent>
      </Card>

      {/* Measurements */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{order.measurements}</p>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{order.productDetails}</p>
        </CardContent>
      </Card>

      {/* Images */}
      {order.images && order.images.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {order.images.map((imageUri, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden border shadow-soft"
                >
                  <img
                    src={imageUri}
                    alt={`Order image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Payment Dialog */}
      <UpdatePaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        order={order}
      />
    </div>
  );
}
