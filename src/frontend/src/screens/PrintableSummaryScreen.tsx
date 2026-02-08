import { useNavigation } from '../navigation/NavigationProvider';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { filterOrdersForToday, filterOrdersForThisWeek, formatDeliveryDate } from '../services/orderQueries';
import { ArrowLeft, Printer, Package } from 'lucide-react';

export function PrintableSummaryScreen() {
  const { navigateTo } = useNavigation();
  const { data: orders = [], isLoading } = useAllOrders();

  const todayOrders = filterOrdersForToday(orders);
  const weekOrders = filterOrdersForThisWeek(orders);
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

  const getStatusVariant = (status: string): 'default' | 'secondary' => {
    return status === 'Pending' ? 'secondary' : 'default';
  };

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
        <h1 className="text-2xl font-bold text-primary">Printable Summary</h1>
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
            <h2 className="text-xl font-semibold mb-1">Order Summary Report</h2>
            <p className="text-sm text-muted-foreground">Generated on {generatedAt}</p>
          </div>

          {/* Today's Orders Section */}
          <Card className="shadow-soft print:shadow-none print:border-2">
            <CardHeader>
              <CardTitle className="text-xl">Today's Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Orders scheduled for delivery today ({todayOrders.length} total)
              </p>
            </CardHeader>
            <CardContent>
              {todayOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No orders scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayOrders.map((order, index) => (
                    <div key={order.id || index}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-base">{order.orderId}</span>
                              <Badge variant={getStatusVariant(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Booking:</span>{' '}
                            <span className="font-medium">{formatDeliveryDate(order.bookingDate)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>{' '}
                            <span className="font-medium">{formatDeliveryDate(order.deliveryDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* This Week's Orders Section */}
          <Card className="shadow-soft print:shadow-none print:border-2 print:break-before-page">
            <CardHeader>
              <CardTitle className="text-xl">This Week's Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Orders scheduled for delivery in the next 7 days ({weekOrders.length} total)
              </p>
            </CardHeader>
            <CardContent>
              {weekOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No orders scheduled for this week</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weekOrders.map((order, index) => (
                    <div key={order.id || index}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-base">{order.orderId}</span>
                              <Badge variant={getStatusVariant(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Booking:</span>{' '}
                            <span className="font-medium">{formatDeliveryDate(order.bookingDate)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>{' '}
                            <span className="font-medium">{formatDeliveryDate(order.deliveryDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print footer - only visible in print */}
          <div className="hidden print:block text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
            <p>Phoenix Boutique - Order Summary Report</p>
            <p>Generated on {generatedAt}</p>
          </div>
        </div>
      )}
    </div>
  );
}
