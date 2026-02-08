import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { updateOrderPayment, type Order } from '../services/ordersRepository';
import { calculateBalance, derivePaymentStatus, validatePricing, PAYMENT_METHODS, type PaymentMethod } from '../services/paymentCalculations';
import { notifyHelper } from '../shared/ui/notify';

interface UpdatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export function UpdatePaymentDialog({ open, onOpenChange, order }: UpdatePaymentDialogProps) {
  const [mode, setMode] = useState<'add-payment' | 'set-advance'>('add-payment');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [newAdvancePaid, setNewAdvancePaid] = useState(order.advancePaid.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [auditNote, setAuditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleReset = () => {
    setMode('add-payment');
    setAdditionalAmount('');
    setNewAdvancePaid(order.advancePaid.toString());
    setPaymentMethod(order.paymentMethod);
    setAuditNote('');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!order.id) {
      notifyHelper.error('Order ID is missing');
      return;
    }

    let resultingAdvancePaid = 0;
    let amountChanged: number | undefined;

    if (mode === 'add-payment') {
      const additional = parseFloat(additionalAmount) || 0;
      if (additional <= 0) {
        notifyHelper.error('Additional payment must be greater than 0');
        return;
      }
      resultingAdvancePaid = order.advancePaid + additional;
      amountChanged = additional;
    } else {
      resultingAdvancePaid = parseFloat(newAdvancePaid) || 0;
    }

    // Validate
    const validation = validatePricing(order.priceTotal, resultingAdvancePaid);
    if (validation.advancePaidError) {
      notifyHelper.error(validation.advancePaidError);
      return;
    }

    // Calculate derived fields
    const balanceAmount = calculateBalance(order.priceTotal, resultingAdvancePaid);
    const paymentStatus = derivePaymentStatus(order.priceTotal, resultingAdvancePaid);

    // Create history entry
    const historyEntry = {
      timestamp: Date.now().toString(),
      changeType: mode,
      amountChanged: mode === 'add-payment' ? amountChanged : undefined,
      resultingAdvancePaid,
      paymentMethod,
      auditNote: auditNote.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await updateOrderPayment(order.id, {
        advancePaid: resultingAdvancePaid,
        balanceAmount,
        paymentStatus,
        paymentMethod,
        historyEntry,
      });
      notifyHelper.success('Payment updated successfully');
      handleClose();
    } catch (error) {
      console.error('Failed to update payment:', error);
      notifyHelper.error('Failed to update payment');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate preview values
  const previewAdvancePaid = mode === 'add-payment'
    ? order.advancePaid + (parseFloat(additionalAmount) || 0)
    : parseFloat(newAdvancePaid) || 0;
  const previewBalance = calculateBalance(order.priceTotal, previewAdvancePaid);
  const previewStatus = derivePaymentStatus(order.priceTotal, previewAdvancePaid);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Payment</DialogTitle>
          <DialogDescription>
            Update payment details for order {order.orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Payment Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Price:</span>
                <span className="font-semibold">₹{order.priceTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Advance:</span>
                <span className="font-semibold">₹{order.advancePaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-semibold text-primary">₹{order.balanceAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Update Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as 'add-payment' | 'set-advance')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add-payment">Add Additional Payment</SelectItem>
                <SelectItem value="set-advance">Set New Advance Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Input based on mode */}
          {mode === 'add-payment' ? (
            <div className="space-y-2">
              <Label htmlFor="additional-amount">Additional Payment Amount</Label>
              <Input
                id="additional-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="new-advance">New Advance Paid</Label>
              <Input
                id="new-advance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newAdvancePaid}
                onChange={(e) => setNewAdvancePaid(e.target.value)}
              />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger>
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

          {/* Audit Note */}
          <div className="space-y-2">
            <Label htmlFor="audit-note">Audit Note (Optional)</Label>
            <Textarea
              id="audit-note"
              placeholder="Add a note about this payment update..."
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Preview After Update
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Advance Paid:</span>
                <span className="font-semibold">₹{previewAdvancePaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Balance:</span>
                <span className="font-semibold text-primary">₹{previewBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className="font-semibold">{previewStatus}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Payment Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
