import { useState, useEffect } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useRole } from '../rbac/useRole';
import { useSingleOrder } from '../hooks/useOrdersLiveQuery';
import { updateOrder } from '../services/ordersRepository';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { calculateBalance, derivePaymentStatus, validatePricing, PAYMENT_METHODS, type PaymentMethod } from '../services/paymentCalculations';
import { notifyHelper } from '../shared/ui/notify';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { writeAuditLog } from '../firebase/auditLogs';

export function EditOrderScreen() {
  const { navigateTo, navigationState } = useNavigation();
  const { permissions, role } = useRole();
  const { user } = useFirebaseAuth();
  const orderId = navigationState?.orderId as number | undefined;
  const { data: order, isLoading } = useSingleOrder(orderId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [measurements, setMeasurements] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [priceTotal, setPriceTotal] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Delivered'>('Pending');

  // Pre-fill form when order loads
  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName);
      setBookingDate(new Date(parseInt(order.bookingDate)));
      setDeliveryDate(new Date(parseInt(order.deliveryDate)));
      setMeasurements(order.measurements);
      setProductDetails(order.productDetails);
      setPriceTotal(order.priceTotal?.toString() || '');
      setAdvancePaid(order.advancePaid?.toString() || '');
      setPaymentMethod(order.paymentMethod || 'Cash');
      setNotes(order.notes || '');
      setStatus(order.status as any);
    }
  }, [order]);

  // Derived fields (only calculate if user can view financials)
  const priceTotalNum = permissions.canEditFinancials ? (parseFloat(priceTotal) || 0) : (order?.priceTotal || 0);
  const advancePaidNum = permissions.canEditFinancials ? (parseFloat(advancePaid) || 0) : (order?.advancePaid || 0);
  const balanceAmount = calculateBalance(priceTotalNum, advancePaidNum);
  const paymentStatus = derivePaymentStatus(priceTotalNum, advancePaidNum);

  // Validation
  const validation = validatePricing(priceTotalNum, advancePaidNum);

  if (!orderId) {
    return (
      <div className="space-y-4">
        <ScreenTitle>Edit Order</ScreenTitle>
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
        <ScreenTitle>Edit Order</ScreenTitle>
        <p className="text-destructive">Order not found</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!customerName.trim()) {
      notifyHelper.error('Customer name is required');
      return;
    }
    if (!bookingDate) {
      notifyHelper.error('Booking date is required');
      return;
    }
    if (!deliveryDate) {
      notifyHelper.error('Delivery date is required');
      return;
    }
    if (!measurements.trim()) {
      notifyHelper.error('Measurements are required');
      return;
    }
    if (!productDetails.trim()) {
      notifyHelper.error('Product details are required');
      return;
    }

    // Validate pricing (only if user can edit financials)
    if (permissions.canEditFinancials && (validation.priceTotalError || validation.advancePaidError)) {
      notifyHelper.error('Please fix pricing errors');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateOrder(order.id!, {
        ...order,
        customerName: customerName.trim(),
        bookingDate: bookingDate.getTime().toString(),
        deliveryDate: deliveryDate.getTime().toString(),
        measurements: measurements.trim(),
        productDetails: productDetails.trim(),
        status,
        priceTotal: priceTotalNum,
        advancePaid: advancePaidNum,
        balanceAmount,
        paymentStatus,
        paymentMethod,
        notes: notes.trim(),
        // Mark as pending sync
        syncStatus: 'pending',
      });

      // Best-effort audit log (non-blocking)
      if (user) {
        await writeAuditLog(
          'order_updated',
          order.orderId,
          user.uid,
          role,
          {},
          order.id
        );
      }

      notifyHelper.success('Order updated successfully');
      navigateTo('order-details', { orderId: order.id });
    } catch (error) {
      console.error('Failed to update order:', error);
      notifyHelper.error('Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ScreenTitle>Edit Order</ScreenTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Booking Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bookingDate ? format(bookingDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bookingDate}
                    onSelect={setBookingDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Delivery Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deliveryDate ? format(deliveryDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deliveryDate}
                    onSelect={setDeliveryDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Payment - Only show for ADMIN */}
        {permissions.canEditFinancials && (
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Pricing & Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price-total">Total Price *</Label>
                <Input
                  id="price-total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceTotal}
                  onChange={(e) => setPriceTotal(e.target.value)}
                  placeholder="0.00"
                />
                {validation.priceTotalError && (
                  <p className="text-sm text-destructive">{validation.priceTotalError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="advance-paid">Advance Paid</Label>
                <Input
                  id="advance-paid"
                  type="number"
                  step="0.01"
                  min="0"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  placeholder="0.00"
                />
                {validation.advancePaidError && (
                  <p className="text-sm text-destructive">{validation.advancePaidError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Read-only derived fields */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Amount:</span>
                  <span className="font-medium">₹{balanceAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className="font-medium">{paymentStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="measurements">Measurements *</Label>
              <Textarea
                id="measurements"
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
                placeholder="Enter measurements"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-details">Product Details *</Label>
              <Textarea
                id="product-details"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                placeholder="Enter product details"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigateTo('order-details', { orderId: order.id })}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
