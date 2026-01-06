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

        Schema::create('task_dependencies', function (Blueprint $table) {

            $table->id();

            $table->foreignId('task_id')

                ->constrained('tasks')

                ->onDelete('cascade');

            $table->foreignId('depends_on_task_id')

                ->constrained('tasks')

                ->onDelete('cascade');

            $table->enum('dependency_type', ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])

                ->default('finish_to_start')

                ->comment('finish_to_start: dependent task starts when dependency finishes (default), start_to_start: both start together, finish_to_finish: both finish together, start_to_finish: dependent task finishes when dependency starts');

            $table->timestamps();

 

            // Prevent duplicate dependencies

            $table->unique(['task_id', 'depends_on_task_id'], 'unique_task_dependency');

 

            // Add index for performance

            $table->index('task_id');

            $table->index('depends_on_task_id');

        });

    }

 

    /**

     * Reverse the migrations.

     */

    public function down(): void

    {

        Schema::dropIfExists('task_dependencies');

    }

};