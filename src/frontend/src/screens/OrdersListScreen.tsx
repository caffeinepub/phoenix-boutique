import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { formatDeliveryDate } from '../services/orderQueries';

export function OrdersListScreen() {
  const { navigateTo } = useNavigation();
  const { permissions } = useRole();
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
    navigateTo('order-details', { orderId });
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <ScreenTitle>All Orders</ScreenTitle>
        {permissions.canViewReports && (
          <Button
            onClick={() => navigateTo('reports')}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No orders yet. Create your first order to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              onClick={() => order.id && handleOrderClick(order.id)}
              className="shadow-soft cursor-pointer hover:bg-accent/5 transition-all duration-200 hover:shadow-soft-lg"
            >
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-primary">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.orderId}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery: {formatDeliveryDate(order.deliveryDate)}
                    </span>
                    {permissions.canViewFinancials && (
                      <div className="flex items-center gap-2">
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                        <span className="font-semibold">₹{order.priceTotal?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
