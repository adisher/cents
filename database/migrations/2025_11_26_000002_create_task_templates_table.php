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

        Schema::create('task_templates', function (Blueprint $table) {

            $table->id();

            $table->foreignId('project_template_id')->constrained('project_templates')->onDelete('cascade');

            $table->string('title');

            $table->text('description')->nullable();

            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');

            $table->integer('estimated_days')->nullable();

            $table->integer('order')->default(0);

            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');

            $table->timestamps();

            $table->softDeletes();

            $table->index(['project_template_id', 'order']);

        });

    }

    /**

     * Reverse the migrations.

     */

    public function down(): void
    {

        Schema::dropIfExists('task_templates');

    }

};
