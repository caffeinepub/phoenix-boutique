import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDeliveryDate } from '../services/orderQueries';
import { Package, FileText } from 'lucide-react';

export function OrdersListScreen() {
  const { navigateTo, setSelectedOrderId } = useNavigation();
  const { data: orders = [], isLoading } = useAllOrders();

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    return status === 'Pending' ? 'secondary' : 'default';
  };

  const getPaymentStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
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

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    navigateTo('order-details');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <ScreenTitle>Orders List</ScreenTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTo('reports')}
          className="shrink-0"
        >
          <FileText className="h-4 w-4 mr-2" />
          Reports
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No orders yet. Create your first order from the Dashboard or New Order tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => order.id && handleOrderClick(order.id)}
              className="w-full flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-all duration-200 hover:shadow-soft text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{order.orderId}</span>
                    <Badge variant={getStatusVariant(order.status)} className="text-xs">
                      {order.status}
                    </Badge>
                    <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <div className="text-muted-foreground">
                  <span className="font-medium">Delivery:</span>{' '}
                  {formatDeliveryDate(order.deliveryDate)}
                </div>
                <div className="text-primary font-semibold">
                  ₹{order.priceTotal.toFixed(2)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
