import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useAllOrders } from '../hooks/useOrdersLiveQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { filterOrdersForToday, filterOrdersForThisWeek, filterOrdersForAuditWeek, filterOrdersForAuditMonth } from '../services/orderQueries';
import { exportOrdersAsCsv, exportAuditCsv, generateCsvFilename } from '../services/orderCsvExport';
import { Download, FileText, ArrowLeft, Printer, Calculator } from 'lucide-react';
import { notifyHelper } from '../shared/ui/notify';

export function ReportsScreen() {
  const { navigateTo } = useNavigation();
  const { data: orders = [], isLoading } = useAllOrders();

  const handleExportToday = () => {
    const todayOrders = filterOrdersForToday(orders);
    
    if (todayOrders.length === 0) {
      notifyHelper.error('No orders for today', {
        description: 'There are no orders scheduled for delivery today.',
      });
      return;
    }

    exportOrdersAsCsv(todayOrders, generateCsvFilename('today'));
    notifyHelper.success('Export successful', {
      description: `Exported ${todayOrders.length} order${todayOrders.length === 1 ? '' : 's'} for today.`,
    });
  };

  const handleExportWeek = () => {
    const weekOrders = filterOrdersForThisWeek(orders);
    
    if (weekOrders.length === 0) {
      notifyHelper.error('No orders this week', {
        description: 'There are no orders scheduled for delivery in the next 7 days.',
      });
      return;
    }

    exportOrdersAsCsv(weekOrders, generateCsvFilename('week'));
    notifyHelper.success('Export successful', {
      description: `Exported ${weekOrders.length} order${weekOrders.length === 1 ? '' : 's'} for this week.`,
    });
  };

  const handleExportAuditWeek = () => {
    const auditWeekOrders = filterOrdersForAuditWeek(orders);
    
    if (auditWeekOrders.length === 0) {
      notifyHelper.error('No orders for audit week', {
        description: 'There are no orders with delivery dates in the current audit week (Monday-Sunday).',
      });
      return;
    }

    exportAuditCsv(auditWeekOrders, generateCsvFilename('audit-week'));
    notifyHelper.success('Export successful', {
      description: `Exported ${auditWeekOrders.length} order${auditWeekOrders.length === 1 ? '' : 's'} for weekly audit.`,
    });
  };

  const handleExportAuditMonth = () => {
    const auditMonthOrders = filterOrdersForAuditMonth(orders);
    
    if (auditMonthOrders.length === 0) {
      notifyHelper.error('No orders for audit month', {
        description: 'There are no orders with delivery dates in the current audit month.',
      });
      return;
    }

    exportAuditCsv(auditMonthOrders, generateCsvFilename('audit-month'));
    notifyHelper.success('Export successful', {
      description: `Exported ${auditMonthOrders.length} order${auditMonthOrders.length === 1 ? '' : 's'} for monthly audit.`,
    });
  };

  const handleOpenPrintView = () => {
    navigateTo('printable-summary');
  };

  const handleOpenAuditPrintView = () => {
    navigateTo('printable-audit-summary');
  };

  const handleOpenAuditAccounts = () => {
    navigateTo('audit-accounts');
  };

  const todayCount = filterOrdersForToday(orders).length;
  const weekCount = filterOrdersForThisWeek(orders).length;
  const auditWeekCount = filterOrdersForAuditWeek(orders).length;
  const auditMonthCount = filterOrdersForAuditMonth(orders).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('orders-list')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ScreenTitle>Reports & Export</ScreenTitle>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audit & Accounts */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Audit & Accounts
              </CardTitle>
              <CardDescription>
                View financial summaries and payment breakdowns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleOpenAuditAccounts}
                variant="default"
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Open Audit & Accounts
              </Button>
            </CardContent>
          </Card>

          {/* Audit CSV Exports */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Audit CSV Exports
              </CardTitle>
              <CardDescription>
                Download audit data as CSV files for financial reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <p className="font-medium">Weekly Audit CSV</p>
                  <p className="text-sm text-muted-foreground">
                    {auditWeekCount} order{auditWeekCount === 1 ? '' : 's'} in current week (Mon-Sun)
                  </p>
                </div>
                <Button
                  onClick={handleExportAuditWeek}
                  disabled={auditWeekCount === 0}
                  size="sm"
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <p className="font-medium">Monthly Audit CSV</p>
                  <p className="text-sm text-muted-foreground">
                    {auditMonthCount} order{auditMonthCount === 1 ? '' : 's'} in current month
                  </p>
                </div>
                <Button
                  onClick={handleExportAuditMonth}
                  disabled={auditMonthCount === 0}
                  size="sm"
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CSV Exports */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Order CSV Exports
              </CardTitle>
              <CardDescription>
                Download order data as CSV files for offline use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <p className="font-medium">Today's Orders</p>
                  <p className="text-sm text-muted-foreground">
                    {todayCount} order{todayCount === 1 ? '' : 's'} scheduled for delivery today
                  </p>
                </div>
                <Button
                  onClick={handleExportToday}
                  disabled={todayCount === 0}
                  size="sm"
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <p className="font-medium">This Week's Orders</p>
                  <p className="text-sm text-muted-foreground">
                    {weekCount} order{weekCount === 1 ? '' : 's'} in the next 7 days
                  </p>
                </div>
                <Button
                  onClick={handleExportWeek}
                  disabled={weekCount === 0}
                  size="sm"
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Printable Views */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Printable Views
              </CardTitle>
              <CardDescription>
                View and print formatted summaries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleOpenAuditPrintView}
                variant="default"
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Printable Audit Summary
              </Button>
              <Button
                onClick={handleOpenPrintView}
                variant="outline"
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Printable Order Summary
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
