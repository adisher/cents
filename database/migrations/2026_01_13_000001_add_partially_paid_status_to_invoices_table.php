<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // MySQL doesn't support adding ENUM values directly, so we need to modify the column
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove partially_paid status
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft'");
    }
};
