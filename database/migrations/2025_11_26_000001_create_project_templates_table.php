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

        Schema::create('project_templates', function (Blueprint $table) {

            $table->id();

            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');

            $table->string('name');

            $table->text('description')->nullable();

            $table->enum('default_status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])->default('planning');

            $table->enum('default_priority', ['low', 'medium', 'high', 'urgent'])->default('medium');

            $table->integer('estimated_hours')->nullable();

            $table->decimal('budget', 10, 2)->nullable();

            $table->boolean('is_public')->default(false);

            $table->string('category')->nullable();

            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');

            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();

            $table->softDeletes();

            $table->index(['workspace_id', 'is_public']);

        });

    }

    /**

     * Reverse the migrations.

     */

    public function down(): void
    {

        Schema::dropIfExists('project_templates');

    }

};
