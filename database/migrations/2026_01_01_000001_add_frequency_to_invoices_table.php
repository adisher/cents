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

        Schema::table('invoices', function (Blueprint $table) {

            $table->enum('frequency', [

                'one-time',

                'weekly',

                'bi-weekly',

                'monthly',

                'quarterly',

                'semi-annual',

                'annual',

            ])->default('one-time')->after('status');

        });

    }

    /**

     * Reverse the migrations.

     */

    public function down(): void
    {

        Schema::table('invoices', function (Blueprint $table) {

            $table->dropColumn('frequency');

        });

    }

};
