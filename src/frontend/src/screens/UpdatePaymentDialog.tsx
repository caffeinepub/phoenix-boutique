import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IndianRupee } from 'lucide-react';
import { Order, updateOrder, type PaymentHistoryEntry } from '../services/ordersRepository';
import { calculateBalance, derivePaymentStatus, PAYMENT_METHODS, type PaymentMethod } from '../services/paymentCalculations';
import { notifyHelper } from '../shared/ui/notify';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { useRole } from '../rbac/useRole';
import { writeAuditLog } from '../firebase/auditLogs';

interface UpdatePaymentDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type PaymentMode = 'add-payment' | 'set-advance';

export function UpdatePaymentDialog({ order, open, onOpenChange, onSuccess }: UpdatePaymentDialogProps) {
  const { user } = useFirebaseAuth();
  const { role } = useRole();
  const [mode, setMode] = useState<PaymentMode>('add-payment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod || 'Cash');
  const [auditNote, setAuditNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const currentAdvance = order.advancePaid || 0;
  const totalPrice = order.priceTotal || 0;

  // Calculate preview values
  const previewAdvance = mode === 'add-payment' 
    ? currentAdvance + amountNum 
    : amountNum;
  const previewBalance = calculateBalance(totalPrice, previewAdvance);
  const previewStatus = derivePaymentStatus(totalPrice, previewAdvance);

  // Validation
  const isValid = mode === 'add-payment' 
    ? amountNum > 0 && (currentAdvance + amountNum) <= totalPrice
    : amountNum >= 0 && amountNum <= totalPrice;

  const handleSubmit = async () => {
    if (!isValid) {
      notifyHelper.error('Invalid payment amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const newAdvancePaid = mode === 'add-payment' 
        ? currentAdvance + amountNum 
        : amountNum;

      const newBalanceAmount = calculateBalance(totalPrice, newAdvancePaid);
      const newPaymentStatus = derivePaymentStatus(totalPrice, newAdvancePaid);

      // Create payment history entry matching PaymentHistoryEntry interface
      const paymentHistoryEntry: PaymentHistoryEntry = {
        timestamp: Date.now().toString(),
        changeType: mode,
        amountChanged: mode === 'add-payment' ? amountNum : undefined,
        resultingAdvancePaid: newAdvancePaid,
        paymentMethod,
        auditNote: auditNote.trim() || undefined,
      };

      const updatedPaymentHistory = [
        ...(order.paymentHistory || []),
        paymentHistoryEntry,
      ];

      await updateOrder(order.id!, {
        advancePaid: newAdvancePaid,
        balanceAmount: newBalanceAmount,
        paymentStatus: newPaymentStatus,
        paymentMethod,
        paymentHistory: updatedPaymentHistory,
        syncStatus: 'pending',
      });

      // Best-effort audit log (non-blocking)
      if (user) {
        await writeAuditLog(
          'payment_updated',
          order.orderId,
          user.uid,
          role,
          {
            mode,
            resultingAdvancePaid: newAdvancePaid,
            paymentMethod,
            ...(mode === 'add-payment' && { amountChanged: amountNum }),
            ...(auditNote.trim() && { auditNote: auditNote.trim() }),
          },
          order.id
        );
      }

      notifyHelper.success('Payment updated successfully');
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setAmount('');
      setAuditNote('');
      setMode('add-payment');
    } catch (error) {
      console.error('Failed to update payment:', error);
      notifyHelper.error('Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Update Payment
          </DialogTitle>
          <DialogDescription>
            Current advance: ₹{currentAdvance.toFixed(2)} | Balance: ₹{order.balanceAmount?.toFixed(2) || '0.00'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as PaymentMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add-payment" id="add-payment" />
                <Label htmlFor="add-payment" className="font-normal cursor-pointer">
                  Add Payment (increase advance)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set-advance" id="set-advance" />
                <Label htmlFor="set-advance" className="font-normal cursor-pointer">
                  Set Advance (replace current value)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {mode === 'add-payment' ? 'Payment Amount' : 'New Advance Amount'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {!isValid && amountNum > 0 && (
              <p className="text-sm text-destructive">
                {mode === 'add-payment' 
                  ? 'Payment would exceed total price'
                  : 'Advance cannot exceed total price'}
              </p>
            )}
          </div>

          {/* Payment Method */}
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

          {/* Audit Note */}
          <div className="space-y-2">
            <Label htmlFor="audit-note">Note (Optional)</Label>
            <Textarea
              id="audit-note"
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Add a note about this payment"
              rows={2}
            />
          </div>

          {/* Preview */}
          {amountNum > 0 && isValid && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Preview:</p>
              <div className="flex justify-between text-sm">
                <span>New Advance:</span>
                <span className="font-medium">₹{previewAdvance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Balance:</span>
                <span className="font-medium">₹{previewBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="font-medium">{previewStatus}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || amountNum === 0}
          >
            {isSubmitting ? 'Updating...' : 'Update Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
