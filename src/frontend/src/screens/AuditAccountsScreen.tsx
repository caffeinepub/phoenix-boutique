import { useState } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, TrendingUp, Wallet, AlertCircle, FileText } from 'lucide-react';
import { calculateAuditMetrics, type DateFilterMode } from '../services/auditCalculations';
import { formatINR } from '../services/currencyFormat';

export function AuditAccountsScreen() {
  const { navigateTo } = useNavigation();
  const { data: orders = [], isLoading } = useAllOrders();

  const [filterMode, setFilterMode] = useState<DateFilterMode>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate metrics based on current filter
  const metrics = calculateAuditMetrics(
    orders,
    filterMode === 'custom' && customStartDate && customEndDate
      ? {
          mode: 'custom',
          dateBasis: 'bookingDate',
          customRange: {
            startDate: new Date(customStartDate),
            endDate: new Date(customEndDate),
          },
        }
      : {
          mode: filterMode,
          dateBasis: 'bookingDate',
        }
  );

  const handleFilterChange = (mode: DateFilterMode) => {
    setFilterMode(mode);
    if (mode !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Time Filters */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Time Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Filter Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={filterMode === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('today')}
                  className="w-full"
                >
                  Today
                </Button>
                <Button
                  variant={filterMode === 'thisWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('thisWeek')}
                  className="w-full"
                >
                  This Week
                </Button>
                <Button
                  variant={filterMode === 'thisMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('thisMonth')}
                  className="w-full"
                >
                  This Month
                </Button>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-3 pt-2 border-t">
                <Button
                  variant={filterMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('custom')}
                  className="w-full"
                >
                  Custom Date Range
                </Button>

                {filterMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-xs">
                        Start Date
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-xs">
                        End Date
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatINR(metrics.totalRevenue)}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Amount Collected</p>
                    <p className="text-2xl font-bold text-success">
                      {formatINR(metrics.totalCollected)}
                    </p>
                  </div>
                  <Wallet className="h-5 w-5 text-success opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Pending Balance</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatINR(metrics.totalOutstanding)}
                    </p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-destructive opacity-70" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-foreground">
                      {metrics.ordersCount}
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-foreground opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-primary" />
                Payment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-success/5 border-success/20">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="font-medium">Paid Orders</span>
                  </div>
                  <span className="text-lg font-bold text-success">
                    {metrics.paidCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="font-medium">Partial Orders</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {metrics.partialCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <span className="font-medium">Unpaid Orders</span>
                  </div>
                  <span className="text-lg font-bold text-destructive">
                    {metrics.unpaidCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {metrics.ordersCount === 0 && (
            <Card className="shadow-soft border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  No orders found for the selected period
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
