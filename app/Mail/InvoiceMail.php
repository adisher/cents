<?php
namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{

    use Queueable, SerializesModels;

    public function __construct(

        public Invoice $invoice

    ) {}

    public function build()
    {

        $workspaceName = $this->invoice->workspace->name ?? config('app.name');

        $invoiceNumber = $this->invoice->invoice_number;

        return $this->subject("Invoice {$invoiceNumber} from {$workspaceName}")

            ->view('emails.invoice')

            ->with([

                'invoice' => $this->invoice,

                'viewUrl' => route('invoices.show', $this->invoice),

            ]);

    }

}
