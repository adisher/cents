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

        Schema::create('task_checklist_templates', function (Blueprint $table) {

            $table->id();

            $table->foreignId('task_template_id')->constrained('task_templates')->onDelete('cascade');

            $table->string('title');

            $table->integer('order')->default(0);

            $table->integer('estimated_days')->nullable();

            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');

            $table->timestamps();

            $table->softDeletes();

            $table->index(['task_template_id', 'order']);

        });

    }

    /**

     * Reverse the migrations.

     */

    public function down(): void
    {

        Schema::dropIfExists('task_checklist_templates');

    }

};
