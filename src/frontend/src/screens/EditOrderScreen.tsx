import { useState, useEffect } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { useSingleOrder } from '../hooks/useOrdersLiveQuery';
import { updateOrder } from '../services/ordersRepository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, IndianRupee } from 'lucide-react';
import { calculateBalance, derivePaymentStatus, validatePricing, PAYMENT_METHODS, type PaymentMethod } from '../services/paymentCalculations';
import { notifyHelper } from '../shared/ui/notify';

export function EditOrderScreen() {
  const { navigateTo, selectedOrderId } = useNavigation();
  const { data: order, isLoading } = useSingleOrder(selectedOrderId);
  
  // Form state
  const [orderId, setOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Delivered'>('Pending');
  
  // Pricing fields
  const [priceTotal, setPriceTotal] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  
  // Derived fields
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');
  
  // Validation errors
  const [priceTotalError, setPriceTotalError] = useState<string | null>(null);
  const [advancePaidError, setAdvancePaidError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when order loads
  useEffect(() => {
    if (order) {
      setOrderId(order.orderId);
      setCustomerName(order.customerName);
      setBookingDate(order.bookingDate);
      setDeliveryDate(order.deliveryDate);
      setMeasurements(order.measurements);
      setProductDetails(order.productDetails);
      setNotes(order.notes || '');
      setStatus(order.status);
      setPriceTotal(order.priceTotal.toString());
      setAdvancePaid(order.advancePaid.toString());
      setPaymentMethod(order.paymentMethod);
    }
  }, [order]);

  // Update derived fields and validate whenever pricing changes
  useEffect(() => {
    const total = parseFloat(priceTotal) || 0;
    const advance = parseFloat(advancePaid) || 0;
    
    // Calculate derived values
    const balance = calculateBalance(total, advance);
    const status = derivePaymentStatus(total, advance);
    
    setBalanceAmount(balance);
    setPaymentStatus(status);
    
    // Validate
    const { priceTotalError: totalErr, advancePaidError: advanceErr } = validatePricing(total, advance);
    setPriceTotalError(totalErr);
    setAdvancePaidError(advanceErr);
  }, [priceTotal, advancePaid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order?.id) {
      notifyHelper.error('No order selected');
      return;
    }
    
    // Basic validation
    if (!orderId.trim() || !customerName.trim() || !bookingDate || !deliveryDate || !measurements.trim() || !productDetails.trim()) {
      notifyHelper.error('Please fill in all required fields');
      return;
    }
    
    // Pricing validation
    const total = parseFloat(priceTotal) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const { priceTotalError: totalErr, advancePaidError: advanceErr } = validatePricing(total, advance);
    
    if (totalErr || advanceErr) {
      notifyHelper.error('Please fix pricing validation errors');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateOrder(order.id, {
        orderId: orderId.trim(),
        customerName: customerName.trim(),
        bookingDate,
        deliveryDate,
        measurements: measurements.trim(),
        productDetails: productDetails.trim(),
        status,
        priceTotal: total,
        advancePaid: advance,
        balanceAmount,
        paymentStatus,
        paymentMethod,
        notes: notes.trim(),
      });
      
      notifyHelper.success('Order updated successfully');
      navigateTo('order-details');
    } catch (error) {
      notifyHelper.error('Failed to update order');
      console.error('Update order error:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('order-details')}
            className="transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ScreenTitle>Edit Order</ScreenTitle>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Loading order...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('orders-list')}
            className="transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ScreenTitle>Edit Order</ScreenTitle>
        </div>
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No order selected. Please select an order to edit.
            </p>
            <Button
              onClick={() => navigateTo('orders-list')}
              className="mt-4"
              variant="outline"
            >
              Go to Orders List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFormValid = orderId.trim() && customerName.trim() && bookingDate && deliveryDate && 
                      measurements.trim() && productDetails.trim() && 
                      !priceTotalError && !advancePaidError;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('order-details')}
          className="transition-all duration-200 hover:scale-110"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ScreenTitle>Edit Order</ScreenTitle>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID *</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-001"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookingDate">Booking Date *</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'Pending' | 'Delivered')}>
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

        {/* Pricing & Payment */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Pricing & Payment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priceTotal">Total Price (₹) *</Label>
              <Input
                id="priceTotal"
                type="number"
                min="0"
                step="0.01"
                value={priceTotal}
                onChange={(e) => setPriceTotal(e.target.value)}
                placeholder="0.00"
                required
              />
              {priceTotalError && (
                <p className="text-sm text-destructive">{priceTotalError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="advancePaid">Advance Paid (₹)</Label>
              <Input
                id="advancePaid"
                type="number"
                min="0"
                step="0.01"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                placeholder="0.00"
              />
              {advancePaidError && (
                <p className="text-sm text-destructive">{advancePaidError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="balanceAmount">Balance Amount (₹)</Label>
              <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted">
                <span className="text-lg font-bold text-primary">₹{balanceAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Auto-calculated</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger id="paymentMethod">
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
            
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <div className="flex items-center h-10">
                <Badge variant={getPaymentStatusVariant(paymentStatus)}>
                  {paymentStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Auto-derived</p>
            </div>
          </CardContent>
        </Card>

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
              <Label htmlFor="productDetails">Product Details *</Label>
              <Textarea
                id="productDetails"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                placeholder="Enter product details"
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>Saving Changes...</>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
