import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/custom-toast';
import { DollarSign, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface UnpaidInvoice {
    id: number;
    invoice_number: string;
    title: string;
    project?: { id: number; title: string };
    client?: { id: number; name: string };
    invoice_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    status: string;
    is_overdue: boolean;
}

interface InvoiceApplication {
    invoice_id: number;
    amount: string;
}

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId?: number;
    projectId?: number;
}

export function RecordPaymentModal({ isOpen, onClose, clientId, projectId }: RecordPaymentModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
    const [applications, setApplications] = useState<Record<number, string>>({});

    const [formData, setFormData] = useState({
        amount: '',
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

    // Fetch unpaid invoices when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchUnpaidInvoices();
        } else {
            // Reset state when modal closes
            setUnpaidInvoices([]);
            setSelectedInvoices(new Set());
            setApplications({});
            setFormData({
                amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: '',
                payment_reference: '',
                notes: ''
            });
        }
    }, [isOpen, clientId, projectId]);

    const fetchUnpaidInvoices = async () => {
        setIsLoadingInvoices(true);
        try {
            const params = new URLSearchParams();
            if (clientId) params.append('client_id', clientId.toString());
            if (projectId) params.append('project_id', projectId.toString());

            const response = await fetch(route('api.invoices.unpaid') + '?' + params.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch invoices');

            const data = await response.json();
            setUnpaidInvoices(data);
        } catch (error) {
            console.error('Failed to fetch unpaid invoices:', error);
            toast.error(t('Failed to load unpaid invoices'));
        } finally {
            setIsLoadingInvoices(false);
        }
    };

    const handleInvoiceToggle = (invoiceId: number) => {
        const newSelected = new Set(selectedInvoices);
        if (newSelected.has(invoiceId)) {
            newSelected.delete(invoiceId);
            const newApplications = { ...applications };
            delete newApplications[invoiceId];
            setApplications(newApplications);
        } else {
            newSelected.add(invoiceId);
            // Auto-fill with balance due
            const invoice = unpaidInvoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                setApplications({
                    ...applications,
                    [invoiceId]: invoice.balance_due.toString()
                });
            }
        }
        setSelectedInvoices(newSelected);
    };

    const handleApplicationAmountChange = (invoiceId: number, value: string) => {
        setApplications({
            ...applications,
            [invoiceId]: value
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Calculate totals
    const paymentAmount = parseFloat(formData.amount) || 0;
    const totalApplied = Object.values(applications).reduce((sum, amount) => {
        return sum + (parseFloat(amount) || 0);
    }, 0);
    const remainingUnapplied = paymentAmount - totalApplied;

    // Calculate total available balance from all unpaid invoices
    const totalAvailableBalance = unpaidInvoices.reduce((sum, invoice) => {
        return sum + invoice.balance_due;
    }, 0);

    // Calculate total balance of SELECTED invoices only
    const totalSelectedBalance = Array.from(selectedInvoices).reduce((sum, invoiceId) => {
        const invoice = unpaidInvoices.find(inv => inv.id === invoiceId);
        return sum + (invoice?.balance_due || 0);
    }, 0);

    // Validation
    const hasErrors = () => {
        if (!formData.amount || paymentAmount <= 0) return true;
        if (!formData.payment_method) return true;
        if (selectedInvoices.size === 0) return true;
        if (totalApplied > paymentAmount) return true;

        // Check if payment amount exceeds total available balance (all invoices)
        if (paymentAmount > totalAvailableBalance) return true;

        // Check if payment amount exceeds total balance of SELECTED invoices
        if (selectedInvoices.size > 0 && paymentAmount > totalSelectedBalance) return true;

        // Require full application - no unapplied amounts allowed
        if (totalApplied < paymentAmount) return true;

        // Check each invoice application
        for (const invoiceId of selectedInvoices) {
            const applicationAmount = parseFloat(applications[invoiceId] || '0');
            const invoice = unpaidInvoices.find(inv => inv.id === invoiceId);
            if (!invoice) continue;
            if (applicationAmount <= 0 || applicationAmount > invoice.balance_due) {
                return true;
            }
        }

        return false;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (hasErrors()) {
            toast.error(t('Please fix validation errors'));
            return;
        }

        setIsSubmitting(true);

        const applicationsArray: InvoiceApplication[] = Array.from(selectedInvoices).map(invoiceId => ({
            invoice_id: invoiceId,
            amount: parseFloat(applications[invoiceId] || '0').toString()
        }));

        router.post(route('invoices.record-payment'), {
            ...formData,
            amount: paymentAmount,
            applications: applicationsArray
        }, {
            onSuccess: () => {
                toast.success(t('Payment recorded and applied successfully!'));
                onClose();
            },
            onError: (errors) => {
                const errorMessage = errors.applications || errors.amount || errors.payment_date || errors.payment_method || Object.values(errors)[0] || t('Failed to record payment');
                toast.error(errorMessage as string);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        {t('Record Payment')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('Record a payment and apply it to one or more invoices')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payment Details */}
                    <Card>
                        <CardContent className="pt-4 space-y-4">
                            <h3 className="font-medium text-sm">{t('Payment Details')}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">{t('Payment Amount')} *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
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
                                    rows={2}
                                    maxLength={1000}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Selection */}
                    <Card>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm">{t('Apply to Invoices')} *</h3>
                                {isLoadingInvoices && (
                                    <span className="text-xs text-gray-500">{t('Loading...')}</span>
                                )}
                            </div>

                            {unpaidInvoices.length === 0 && !isLoadingInvoices && (
                                <div className="text-center py-8 text-gray-500">
                                    <Info className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                    <p>{t('No unpaid or partially paid invoices found')}</p>
                                </div>
                            )}

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {unpaidInvoices.map((invoice) => {
                                    const isSelected = selectedInvoices.has(invoice.id);
                                    const applicationAmount = parseFloat(applications[invoice.id] || '0');
                                    const exceedsBalance = applicationAmount > invoice.balance_due;

                                    return (
                                        <div
                                            key={invoice.id}
                                            className={`border rounded-lg p-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id={`invoice-${invoice.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleInvoiceToggle(invoice.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <label
                                                        htmlFor={`invoice-${invoice.id}`}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="font-medium text-sm">
                                                                {invoice.invoice_number}
                                                                {invoice.is_overdue && (
                                                                    <span className="ml-2 text-xs text-red-600">(Overdue)</span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-bold">
                                                                {formatCurrency(invoice.balance_due)}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            {invoice.title} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                                                        </div>
                                                        {invoice.project && (
                                                            <div className="text-xs text-gray-500">
                                                                {invoice.project.title}
                                                            </div>
                                                        )}
                                                    </label>

                                                    {isSelected && (
                                                        <div className="mt-2">
                                                            <Label htmlFor={`amount-${invoice.id}`} className="text-xs">
                                                                {t('Amount to Apply')}
                                                            </Label>
                                                            <div className="flex gap-2 mt-1">
                                                                <Input
                                                                    id={`amount-${invoice.id}`}
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    max={invoice.balance_due}
                                                                    value={applications[invoice.id] || ''}
                                                                    onChange={(e) => handleApplicationAmountChange(invoice.id, e.target.value)}
                                                                    className={`text-sm ${exceedsBalance ? 'border-red-500' : ''}`}
                                                                    placeholder="0.00"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleApplicationAmountChange(invoice.id, invoice.balance_due.toString())}
                                                                    className="text-xs whitespace-nowrap"
                                                                >
                                                                    {t('Full')}
                                                                </Button>
                                                            </div>
                                                            {exceedsBalance && (
                                                                <p className="text-xs text-red-600 mt-1">
                                                                    {t('Amount exceeds balance due')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Totals Summary */}
                    {paymentAmount > 0 && (
                        <Card className={hasErrors() ? 'border-red-500' : 'border-green-500'}>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Payment Amount')}:</span>
                                        <span className="font-bold">{formatCurrency(paymentAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Total Applied')}:</span>
                                        <span className={`font-bold ${totalApplied > paymentAmount ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(totalApplied)}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between text-sm font-bold">
                                        <span>{t('Remaining Unapplied')}:</span>
                                        <span className={remainingUnapplied !== 0 ? 'text-red-600' : 'text-green-600'}>
                                            {formatCurrency(remainingUnapplied)}
                                        </span>
                                    </div>

                                    {/* Error: Payment exceeds total available balance */}
                                    {paymentAmount > totalAvailableBalance && (
                                        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{t('Payment amount')} ({formatCurrency(paymentAmount)}) {t('exceeds total unpaid balance')} ({formatCurrency(totalAvailableBalance)}). {t('Please reduce the payment amount.')}</span>
                                        </div>
                                    )}

                                    {/* Error: Payment exceeds selected invoices balance */}
                                    {selectedInvoices.size > 0 && paymentAmount > totalSelectedBalance && paymentAmount <= totalAvailableBalance && (
                                        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{t('Payment amount')} ({formatCurrency(paymentAmount)}) {t('exceeds selected invoices balance')} ({formatCurrency(totalSelectedBalance)}). {t('Either reduce payment amount or select more invoices.')}</span>
                                        </div>
                                    )}

                                    {/* Error: Total applied exceeds payment */}
                                    {totalApplied > paymentAmount && (
                                        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{t('Total applied amount exceeds payment amount')}</span>
                                        </div>
                                    )}

                                    {/* Error: Unapplied amount remaining */}
                                    {remainingUnapplied > 0 && selectedInvoices.size > 0 && paymentAmount <= totalAvailableBalance && paymentAmount <= totalSelectedBalance && (
                                        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{t('All payment amount must be applied to invoices. Remaining unapplied:')} {formatCurrency(remainingUnapplied)}. {t('Please apply the full amount or reduce the payment.')}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                            disabled={isSubmitting || hasErrors()}
                        >
                            {isSubmitting ? t('Recording...') : t('Record Payment')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
