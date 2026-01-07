import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/custom-toast';
import { DollarSign } from 'lucide-react';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: number;
    balanceDue: number;
    currency?: string;
}

export function RecordPaymentModal({ isOpen, onClose, invoiceId, balanceDue, currency = 'USD' }: RecordPaymentModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        amount: balanceDue.toString(),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        payment_reference: '',
        notes: ''
    });

    const paymentMethods = [
        { value: 'cheque', label: 'Cheque' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'ach_credit', label: 'ACH Credit' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'cash', label: 'Cash' },
        { value: 'wire', label: 'Wire Transfer' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.payment_method) {
            toast.error(t('Please select a payment method'));
            return;
        }

        setIsSubmitting(true);

        router.post(route('invoices.record-payment', invoiceId), formData, {
            onSuccess: () => {
                toast.success(t('Payment recorded successfully!'));
                onClose();
                // Reset form
                setFormData({
                    amount: balanceDue.toString(),
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: '',
                    payment_reference: '',
                    notes: ''
                });
            },
            onError: (errors) => {
                const errorMessage = errors.amount || errors.payment_date || errors.payment_method || Object.values(errors)[0] || t('Failed to record payment');
                toast.error(errorMessage as string);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        {t('Record Payment')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('Record a payment received for this invoice. Balance Due')}: {currency} {balanceDue.toFixed(2)}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">{t('Amount')} *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={balanceDue}
                                value={formData.amount}
                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_date">{t('Payment Date')} *</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.payment_date}
                                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_method">{t('Payment Method')} *</Label>
                        <Select
                            value={formData.payment_method}
                            onValueChange={(value) => handleInputChange('payment_method', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select payment method')} />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_reference">
                            {t('Payment Reference')}
                            <span className="text-xs text-gray-500 ml-2">
                                ({t('Cheque number, Transaction ID, etc.')})
                            </span>
                        </Label>
                        <Input
                            id="payment_reference"
                            type="text"
                            value={formData.payment_reference}
                            onChange={(e) => handleInputChange('payment_reference', e.target.value)}
                            placeholder={t('Enter payment reference')}
                            maxLength={255}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">{t('Notes')} ({t('Optional')})</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder={t('Add any additional notes about this payment')}
                            rows={3}
                            maxLength={1000}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('Recording...') : t('Record Payment')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
