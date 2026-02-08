import { useState } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { useSingleOrder } from '../hooks/useOrdersLiveQuery';
import { updateOrder } from '../services/ordersRepository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, IndianRupee, Calendar, Package, Ruler, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { UpdatePaymentDialog } from './UpdatePaymentDialog';
import { notifyHelper } from '../shared/ui/notify';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { writeAuditLog } from '../firebase/auditLogs';

export function OrderDetailsScreen() {
  const { navigateTo, navigationState } = useNavigation();
  const { permissions, role } = useRole();
  const { user } = useFirebaseAuth();
  const orderId = navigationState?.orderId as number | undefined;
  const { data: order, isLoading } = useSingleOrder(orderId || null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!orderId) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Order Details</ScreenTitle>
        <p className="text-destructive">No order ID provided</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Order Details</ScreenTitle>
        <p className="text-destructive">Order not found</p>
      </div>
    );
  }

  const handleEdit = () => {
    navigateTo('edit-order', { orderId: order.id });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Mark order as deleted by updating status
      await updateOrder(order.id!, {
        status: 'Delivered', // Use Delivered as a soft delete marker
        syncStatus: 'pending',
      });

      // Best-effort audit log (non-blocking)
      if (user) {
        await writeAuditLog(
          'order_deleted',
          order.orderId,
          user.uid,
          role,
          {},
          order.id
        );
      }

      notifyHelper.success('Order deleted successfully');
      navigateTo('orders-list');
    } catch (error) {
      console.error('Failed to delete order:', error);
      notifyHelper.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-success text-success-foreground';
      case 'Partial':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <ScreenTitle>Order Details</ScreenTitle>
        <div className="flex gap-2">
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this order? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Order ID & Status */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="text-lg font-semibold text-primary">{order.orderId}</p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{order.customerName}</p>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Booking Date</p>
            <p className="font-medium">
              {format(new Date(parseInt(order.bookingDate)), 'PPP')}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Delivery Date</p>
            <p className="font-medium">
              {format(new Date(parseInt(order.deliveryDate)), 'PPP')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Payment - Only show for ADMIN */}
      {permissions.canViewFinancials && (
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Pricing & Payment
              </CardTitle>
              <Badge className={getPaymentStatusColor(order.paymentStatus || 'Unpaid')}>
                {order.paymentStatus || 'Unpaid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Price:</span>
              <span className="font-medium">₹{order.priceTotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Paid:</span>
              <span className="font-medium">₹{order.advancePaid?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Amount:</span>
              <span className="font-medium">₹{order.balanceAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">{order.paymentMethod || 'N/A'}</span>
            </div>
            
            {permissions.canEditFinancials && (
              <>
                <Separator />
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <IndianRupee className="mr-2 h-4 w-4" />
                  Update Payment
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History - Only show for ADMIN */}
      {permissions.canViewFinancials && order.paymentHistory && order.paymentHistory.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...order.paymentHistory].reverse().map((entry: any, index) => (
                <div key={index} className="rounded-lg border border-border p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {entry.changeType === 'add-payment' ? 'Payment Added' : 'Advance Set'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(parseInt(entry.timestamp)), 'PPp')}
                      </p>
                    </div>
                    <p className="font-semibold">₹{entry.resultingAdvancePaid?.toFixed(2) || '0.00'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Method: {entry.paymentMethod || 'N/A'}
                  </p>
                  {entry.auditNote && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {entry.auditNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Measurements</p>
            </div>
            <p className="whitespace-pre-wrap">{order.measurements}</p>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Product Details</p>
            </div>
            <p className="whitespace-pre-wrap">{order.productDetails}</p>
          </div>
          {order.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Payment Dialog */}
      <UpdatePaymentDialog
        order={order}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
    </div>
  );
}
