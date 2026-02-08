import { useState } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, TrendingUp, Wallet, Clock, Package } from 'lucide-react';
import { format } from 'date-fns';
import { filterOrdersForToday, filterOrdersForThisWeek, filterOrdersForAuditMonth } from '../services/orderQueries';
import { calculateAuditMetrics } from '../services/auditCalculations';
import { formatINR } from '../services/currencyFormat';
import { AccessDeniedScreen } from '../shared/ui/AccessDeniedScreen';
import type { Order } from '../services/ordersRepository';

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export function AuditAccountsScreen() {
  const { navigateTo } = useNavigation();
  const { permissions } = useRole();
  const { data: orders = [], isLoading } = useAllOrders();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Guard: only ADMIN can view audit
  if (!permissions.canViewAudit) {
    return <AccessDeniedScreen title="Audit Access Denied" message="Audit & Accounts is restricted to administrators only." />;
  }

  const getFilteredOrders = () => {
    switch (timeFilter) {
      case 'today':
        return filterOrdersForToday(orders);
      case 'week':
        return filterOrdersForThisWeek(orders);
      case 'month':
        return filterOrdersForAuditMonth(orders);
      case 'custom':
        if (!customStartDate || !customEndDate) return [];
        const startTime = customStartDate.getTime();
        const endTime = customEndDate.getTime();
        return orders.filter((order) => {
          const deliveryTime = parseInt(order.deliveryDate, 10);
          return deliveryTime >= startTime && deliveryTime <= endTime;
        });
      default:
        return [];
    }
  };

  const filteredOrders = getFilteredOrders();
  const metrics = calculateAuditMetrics(filteredOrders);

  // Calculate revenue by payment status
  const calculateRevenueByStatus = (orders: Order[], status: string) => {
    return orders
      .filter(order => order.paymentStatus === status)
      .reduce((sum, order) => sum + (Number(order.priceTotal) || 0), 0);
  };

  const paidRevenue = calculateRevenueByStatus(filteredOrders, 'Paid');
  const partialRevenue = calculateRevenueByStatus(filteredOrders, 'Partial');
  const unpaidRevenue = calculateRevenueByStatus(filteredOrders, 'Unpaid');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('reports')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ScreenTitle>Audit & Accounts</ScreenTitle>
      </div>

      {/* Time Filter */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Time Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {timeFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold">{formatINR(metrics.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-bold text-green-600">{formatINR(metrics.totalCollected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold text-orange-600">{formatINR(metrics.totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-lg font-bold">{metrics.ordersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default">Paid</Badge>
              <span className="text-sm text-muted-foreground">{metrics.paidCount} orders</span>
            </div>
            <span className="text-sm font-semibold">{formatINR(paidRevenue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Partial</Badge>
              <span className="text-sm text-muted-foreground">{metrics.partialCount} orders</span>
            </div>
            <span className="text-sm font-semibold">{formatINR(partialRevenue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Unpaid</Badge>
              <span className="text-sm text-muted-foreground">{metrics.unpaidCount} orders</span>
            </div>
            <span className="text-sm font-semibold">{formatINR(unpaidRevenue)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
