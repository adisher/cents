<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoicePayment extends Model
{
    use LogsActivity;

    protected $fillable = [
        'invoice_id',
        'workspace_id',
        'recorded_by',
        'amount',
        'payment_date',
        'payment_method',
        'payment_reference',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    protected $appends = [
        'formatted_amount',
        'payment_method_label'
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(PaymentApplication::class, 'payment_id');
    }

    public function invoices()
    {
        return $this->belongsToMany(Invoice::class, 'payment_applications', 'payment_id', 'invoice_id')
            ->withPivot('amount')
            ->withTimestamps();
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 2);
    }

    public function getPaymentMethodLabelAttribute()
    {
        return match($this->payment_method) {
            'cheque' => 'Cheque',
            'bank_transfer' => 'Bank Transfer',
            'ach_credit' => 'ACH Credit',
            'credit_card' => 'Credit Card',
            'cash' => 'Cash',
            'wire' => 'Wire Transfer',
            default => ucfirst($this->payment_method)
        };
    }

    protected function getActivityDescription(string $action): string
    {
        $invoiceCount = $this->applications()->count();

        if ($invoiceCount === 0 && $this->invoice) {
            // Legacy single invoice payment
            return match($action) {
                'created' => "Payment of {$this->formatted_amount} recorded for invoice #{$this->invoice->invoice_number}",
                'updated' => "Payment record updated for invoice #{$this->invoice->invoice_number}",
                'deleted' => "Payment record deleted for invoice #{$this->invoice->invoice_number}",
                default => parent::getActivityDescription($action)
            };
        }

        // Multi-invoice payment
        return match($action) {
            'created' => "Payment of {$this->formatted_amount} recorded and applied to {$invoiceCount} " . ($invoiceCount === 1 ? 'invoice' : 'invoices'),
            'updated' => "Payment record updated",
            'deleted' => "Payment record deleted",
            default => parent::getActivityDescription($action)
        };
    }
}
