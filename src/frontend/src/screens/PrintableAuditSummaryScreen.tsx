import { useNavigation } from '../navigation/NavigationProvider';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { filterOrdersForAuditWeek, filterOrdersForAuditMonth, formatDeliveryDate } from '../services/orderQueries';
import { formatINR } from '../services/currencyFormat';
import { ArrowLeft, Printer } from 'lucide-react';

export function PrintableAuditSummaryScreen() {
  const { navigateTo } = useNavigation();
  const { data: orders = [], isLoading } = useAllOrders();

  const weekOrders = filterOrdersForAuditWeek(orders);
  const monthOrders = filterOrdersForAuditMonth(orders);
  
  const generatedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const getPaymentStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    if (status === 'Paid') return 'default';
    if (status === 'Partial') return 'secondary';
    return 'outline';
  };

  // Calculate weekly totals
  const weekTotalRevenue = weekOrders.reduce((sum, order) => sum + (Number(order.priceTotal) || 0), 0);
  const weekTotalCollected = weekOrders.reduce((sum, order) => sum + (Number(order.advancePaid) || 0), 0);
  const weekTotalPending = weekOrders.reduce((sum, order) => sum + (Number(order.balanceAmount) || 0), 0);

  // Calculate monthly totals
  const monthTotalRevenue = monthOrders.reduce((sum, order) => sum + (Number(order.priceTotal) || 0), 0);
  const monthTotalCollected = monthOrders.reduce((sum, order) => sum + (Number(order.advancePaid) || 0), 0);
  const monthTotalPending = monthOrders.reduce((sum, order) => sum + (Number(order.balanceAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Screen controls - hidden in print */}
      <div className="print:hidden flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('reports')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">Printable Audit Summary</h1>
        <Button
          onClick={handlePrint}
          className="ml-auto"
          size="sm"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : (
        <div className="space-y-8 print:space-y-6">
          {/* Print header - only visible in print */}
          <div className="hidden print:block text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Phoenix Boutique</h1>
            <h2 className="text-xl font-semibold mb-1">Audit Summary Report</h2>
            <p className="text-sm text-muted-foreground">Generated on {generatedAt}</p>
          </div>

          {/* Weekly Audit Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">Weekly Audit</h2>
              <p className="text-sm text-muted-foreground">Current week (Monday - Sunday)</p>
            </div>

            {weekOrders.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No orders for the current audit week
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Weekly Summary Totals */}
                <div className="grid grid-cols-3 gap-4 print:gap-3">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatINR(weekTotalRevenue)}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-success">{formatINR(weekTotalCollected)}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-destructive">{formatINR(weekTotalPending)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Weekly Orders List */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base">Orders ({weekOrders.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {weekOrders.map((order, index) => (
                      <div key={order.id || index}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-primary">{order.orderId}</p>
                              <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            </div>
                            <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total:</span>{' '}
                              <span className="font-medium">{formatINR(order.priceTotal)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Paid:</span>{' '}
                              <span className="font-medium">{formatINR(order.advancePaid)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Balance:</span>{' '}
                              <span className="font-medium">{formatINR(order.balanceAmount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Method:</span>{' '}
                              <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Delivery: {formatDeliveryDate(order.deliveryDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          <Separator className="my-8 print:my-6" />

          {/* Monthly Audit Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">Monthly Audit</h2>
              <p className="text-sm text-muted-foreground">Current month</p>
            </div>

            {monthOrders.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No orders for the current audit month
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Monthly Summary Totals */}
                <div className="grid grid-cols-3 gap-4 print:gap-3">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{formatINR(monthTotalRevenue)}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-success">{formatINR(monthTotalCollected)}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-destructive">{formatINR(monthTotalPending)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Orders List */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base">Orders ({monthOrders.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {monthOrders.map((order, index) => (
                      <div key={order.id || index}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-primary">{order.orderId}</p>
                              <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            </div>
                            <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total:</span>{' '}
                              <span className="font-medium">{formatINR(order.priceTotal)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Paid:</span>{' '}
                              <span className="font-medium">{formatINR(order.advancePaid)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Balance:</span>{' '}
                              <span className="font-medium">{formatINR(order.balanceAmount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Method:</span>{' '}
                              <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Delivery: {formatDeliveryDate(order.deliveryDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          {/* Print footer */}
          <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
            <p>Phoenix Boutique - Audit Summary Report</p>
            <p>Generated on {generatedAt}</p>
          </div>
        </div>
      )}
    </div>
  );
}
