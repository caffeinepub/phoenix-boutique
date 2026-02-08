import { useState } from 'react';
import { ScreenTitle } from '../shared/ui/ScreenTitle';
import { useNavigation } from '../navigation/NavigationProvider';
import { createOrder } from '../services/ordersRepository';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { calculateBalance, derivePaymentStatus, validatePricing, PAYMENT_METHODS, type PaymentMethod } from '../services/paymentCalculations';
import { notifyHelper } from '../shared/ui/notify';

export function NewOrderScreen() {
  const { navigateTo } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [measurements, setMeasurements] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [priceTotal, setPriceTotal] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');

  // Derived fields
  const priceTotalNum = parseFloat(priceTotal) || 0;
  const advancePaidNum = parseFloat(advancePaid) || 0;
  const balanceAmount = calculateBalance(priceTotalNum, advancePaidNum);
  const paymentStatus = derivePaymentStatus(priceTotalNum, advancePaidNum);

  // Validation
  const validation = validatePricing(priceTotalNum, advancePaidNum);

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

    // Validate pricing
    if (validation.priceTotalError || validation.advancePaidError) {
      notifyHelper.error('Please fix pricing errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = `ORD-${Date.now()}`;
      await createOrder({
        orderId,
        customerName: customerName.trim(),
        bookingDate: bookingDate.getTime().toString(),
        deliveryDate: deliveryDate.getTime().toString(),
        measurements: measurements.trim(),
        productDetails: productDetails.trim(),
        images: [],
        status: 'Pending',
        deliveredAt: null,
        createdAt: Date.now().toString(),
        priceTotal: priceTotalNum,
        advancePaid: advancePaidNum,
        balanceAmount,
        paymentStatus,
        paymentMethod,
        notes: notes.trim(),
        paymentHistory: [],
      });

      notifyHelper.success('Order created successfully');
      navigateTo('dashboard');
    } catch (error) {
      console.error('Failed to create order:', error);
      notifyHelper.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ScreenTitle>New Order</ScreenTitle>

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
              <Label htmlFor="balance-amount">Balance Amount (Auto-calculated)</Label>
              <Input
                id="balance-amount"
                type="text"
                value={`₹${balanceAmount.toFixed(2)}`}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status (Auto-calculated)</Label>
              <Input
                id="payment-status"
                type="text"
                value={paymentStatus}
                readOnly
                className="bg-muted"
              />
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
                rows={4}
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
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pb-20">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigateTo('dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
