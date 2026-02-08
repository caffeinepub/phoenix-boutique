import { useAllOrders, useRecentOrders } from '../hooks/useOrdersLiveQuery';
import { computeDashboardMetrics, formatDeliveryDate } from '../services/orderQueries';
import { useNavigation } from '../navigation/NavigationProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, Clock, Calendar, ShoppingBag } from 'lucide-react';

export function DashboardScreen() {
  const { navigateTo } = useNavigation();
  const { data: allOrders = [], isLoading: isLoadingAll } = useAllOrders();
  const { data: recentOrders = [], isLoading: isLoadingRecent } = useRecentOrders(5);

  const metrics = computeDashboardMetrics(allOrders);

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
    <div className="space-y-6">
      {/* Metrics Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Deliver Today */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-soft transition-all duration-200 hover:shadow-soft-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliver Today</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoadingAll ? '...' : metrics.deliverToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending deliveries
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 shadow-soft transition-all duration-200 hover:shadow-soft-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">
              {isLoadingAll ? '...' : metrics.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>

        {/* This Week's Deliveries */}
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 shadow-soft transition-all duration-200 hover:shadow-soft-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">
              {isLoadingAll ? '...' : metrics.thisWeekDeliveries}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-muted/30 shadow-soft transition-all duration-200 hover:shadow-soft-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAll ? '...' : metrics.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet. Create your first order to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => order.id && handleOrderClick(order.id)}
                  className="w-full flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-all duration-200 hover:shadow-soft text-left"
                >
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
                    <div className="flex items-center gap-2">
                      <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                      <span className="font-semibold">₹{order.priceTotal?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button
          onClick={() => navigateTo('new-order')}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
