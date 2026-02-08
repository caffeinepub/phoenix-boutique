import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer } from 'lucide-react';
import { filterOrdersForAuditWeek, filterOrdersForAuditMonth, formatDeliveryDate } from '../services/orderQueries';
import { calculateAuditMetrics } from '../services/auditCalculations';
import { formatINR } from '../services/currencyFormat';
import { AccessDeniedScreen } from '../shared/ui/AccessDeniedScreen';

export function PrintableAuditSummaryScreen() {
  const { navigateTo } = useNavigation();
  const { permissions } = useRole();
  const { data: orders = [] } = useAllOrders();

  // Guard: only ADMIN can view printable audit reports
  if (!permissions.canViewReports) {
    return <AccessDeniedScreen title="Audit Print Access Denied" message="Printable audit reports are restricted to administrators only." />;
  }

  const weekOrders = filterOrdersForAuditWeek(orders);
  const monthOrders = filterOrdersForAuditMonth(orders);

  const weekMetrics = calculateAuditMetrics(weekOrders);
  const monthMetrics = calculateAuditMetrics(monthOrders);

  const handlePrint = () => {
    window.print();
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
          <ScreenTitle>Audit Summary</ScreenTitle>
        </div>
        <Button onClick={handlePrint} variant="default" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Weekly Audit */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Audit (Monday-Sunday)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="font-semibold">{formatINR(weekMetrics.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Collected</p>
              <p className="font-semibold text-green-600">{formatINR(weekMetrics.totalCollected)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Outstanding</p>
              <p className="font-semibold text-orange-600">{formatINR(weekMetrics.totalOutstanding)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Orders</p>
              <p className="font-semibold">{weekMetrics.ordersCount}</p>
            </div>
          </div>

          {weekOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No orders for this week</p>
          ) : (
            <div className="space-y-2">
              {weekOrders.map((order) => (
                <div key={order.id} className="border rounded p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{order.orderId}</span>
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs">
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(order.priceTotal)}</p>
                      <p className="text-xs text-muted-foreground">Paid: {formatINR(order.advancePaid)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Audit */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="font-semibold">{formatINR(monthMetrics.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Collected</p>
              <p className="font-semibold text-green-600">{formatINR(monthMetrics.totalCollected)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Outstanding</p>
              <p className="font-semibold text-orange-600">{formatINR(monthMetrics.totalOutstanding)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Orders</p>
              <p className="font-semibold">{monthMetrics.ordersCount}</p>
            </div>
          </div>

          {monthOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No orders for this month</p>
          ) : (
            <div className="space-y-2">
              {monthOrders.map((order) => (
                <div key={order.id} className="border rounded p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{order.orderId}</span>
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs">
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(order.priceTotal)}</p>
                      <p className="text-xs text-muted-foreground">Paid: {formatINR(order.advancePaid)}</p>
                    </div>
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
