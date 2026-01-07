<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('recorded_by');

            // Payment details
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->enum('payment_method', [
                'cheque',
                'bank_transfer',
                'ach_credit',
                'credit_card',
                'cash',
                'wire'
            ]);
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('invoice_id');
            $table->index('workspace_id');
            $table->index('payment_date');

            // Foreign keys
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('recorded_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_payments');
    }
};
