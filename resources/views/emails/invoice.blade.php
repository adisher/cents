<!DOCTYPE html>

<html>

<head>

    <meta charset="utf-8">

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Invoice {{ $invoice->invoice_number }}</title>

</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0;">

    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">

        <!-- Header -->

        <div style="background-color: #2563eb; color: white; padding: 30px 20px; text-align: center;">

            <h1 style="margin: 0; font-size: 28px;">{{ $invoice->workspace->name ?? config('app.name') }}</h1>

            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">New Invoice Received</p>

        </div>

 

        <!-- Main Content -->

        <div style="padding: 30px 20px;">

            <p style="font-size: 16px; margin-top: 0;">Hello{{ $invoice->client ? ' ' . $invoice->client->name : '' }},</p>

 

            <p>You have received a new invoice from <strong>{{ $invoice->workspace->name ?? config('app.name') }}</strong>.</p>

 

            <!-- Invoice Details Box -->

            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 4px;">

                <table style="width: 100%; border-collapse: collapse;">

                    <tr>

                        <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Invoice Number:</td>

                        <td style="padding: 8px 0; text-align: right;">{{ $invoice->invoice_number }}</td>

                    </tr>

                    <tr>

                        <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Invoice Date:</td>

                        <td style="padding: 8px 0; text-align: right;">{{ $invoice->invoice_date->format('M j, Y') }}</td>

                    </tr>

                    <tr>

                        <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Due Date:</td>

                        <td style="padding: 8px 0; text-align: right;">{{ $invoice->due_date->format('M j, Y') }}</td>

                    </tr>

                    @if($invoice->project)

                    <tr>

                        <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Project:</td>

                        <td style="padding: 8px 0; text-align: right;">{{ $invoice->project->title }}</td>

                    </tr>

                    @endif

                    <tr style="border-top: 2px solid #e2e8f0;">

                        <td style="padding: 15px 0 8px 0; font-weight: bold; font-size: 18px; color: #1e293b;">Total Amount:</td>

                        <td style="padding: 15px 0 8px 0; text-align: right; font-weight: bold; font-size: 20px; color: #2563eb;">${{ number_format($invoice->total_amount, 2) }}</td>

                    </tr>

                </table>

            </div>

 

            @if($invoice->title)

            <div style="margin: 20px 0;">

                <h3 style="color: #1e293b; margin-bottom: 10px;">{{ $invoice->title }}</h3>

                @if($invoice->description)

                <p style="color: #64748b; margin-top: 0;">{{ $invoice->description }}</p>

                @endif

            </div>

            @endif

 

            <!-- Call to Action Button -->

            <div style="text-align: center; margin: 35px 0;">

                <a href="{{ $viewUrl }}"

                   style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">

                    View Invoice Details

                </a>

            </div>

 

            @if($invoice->notes)

            <div style="margin: 25px 0; padding: 15px; background-color: #fefce8; border-radius: 4px; border-left: 4px solid #fbbf24;">

                <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Note:</strong> {{ $invoice->notes }}</p>

            </div>

            @endif

 

            <p style="color: #64748b; font-size: 14px;">If you have any questions about this invoice, please contact us.</p>

 

            <p style="font-size: 14px; color: #64748b; margin-top: 0;">If you can't click the button above, copy and paste this link into your browser:</p>

            <p style="word-break: break-all; color: #2563eb; font-size: 13px; background-color: #f1f5f9; padding: 10px; border-radius: 4px;">{{ $viewUrl }}</p>

        </div>

 

        <!-- Footer -->

        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">

            <p style="margin: 0; font-size: 12px; color: #64748b;">

                This is an automated email from {{ $invoice->workspace->name ?? config('app.name') }}

            </p>

            <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;">

                © {{ date('Y') }} {{ $invoice->workspace->name ?? config('app.name') }}. All rights reserved.

            </p>

        </div>

    </div>

</body>

</html>