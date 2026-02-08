import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer } from 'lucide-react';
import { filterOrdersForToday, filterOrdersForThisWeek, formatDeliveryDate } from '../services/orderQueries';
import { AccessDeniedScreen } from '../shared/ui/AccessDeniedScreen';

export function PrintableSummaryScreen() {
  const { navigateTo } = useNavigation();
  const { permissions } = useRole();
  const { data: orders = [] } = useAllOrders();

  // Guard: only ADMIN can view printable reports
  if (!permissions.canViewReports) {
    return <AccessDeniedScreen title="Print Access Denied" message="Printable reports are restricted to administrators only." />;
  }

  const todayOrders = filterOrdersForToday(orders);
  const weekOrders = filterOrdersForThisWeek(orders);

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('reports')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ScreenTitle>Printable Summary</ScreenTitle>
        </div>
        <Button onClick={handlePrint} variant="default" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Today's Orders */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Today's Orders ({todayOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {todayOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No orders for today</p>
          ) : (
            <div className="space-y-3">
              {todayOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{order.orderId}</span>
                        <Badge variant={getStatusVariant(order.status)} className="text-xs">
                          {order.status}
                        </Badge>
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs">
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-sm">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">₹{order.priceTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Delivery: {formatDeliveryDate(order.deliveryDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* This Week's Orders */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">This Week's Orders ({weekOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {weekOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No orders for this week</p>
          ) : (
            <div className="space-y-3">
              {weekOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{order.orderId}</span>
                        <Badge variant={getStatusVariant(order.status)} className="text-xs">
                          {order.status}
                        </Badge>
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs">
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-sm">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">₹{order.priceTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Delivery: {formatDeliveryDate(order.deliveryDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
