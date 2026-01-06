<?php

 

namespace App\Models;

 

use App\Traits\LogsActivity;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

 

class TaskDependency extends Model

{

    use LogsActivity;

 

    protected $fillable = [

        'task_id',

        'depends_on_task_id',

        'dependency_type'

    ];

 

    protected $casts = [

        'dependency_type' => 'string'

    ];

 

    /**

     * The task that has the dependency

     */

    public function task(): BelongsTo

    {

        return $this->belongsTo(Task::class, 'task_id');

    }

 

    /**

     * The task that this task depends on

     */

    public function dependsOnTask(): BelongsTo

    {

        return $this->belongsTo(Task::class, 'depends_on_task_id');

    }

 

    protected function getActivityDescription(string $action): string

    {

        $dependsOnTask = $this->dependsOnTask;

        $task = $this->task;

 

        return match($action) {

            'created' => __('Task ":task" now depends on ":depends_on_task"', [

                'task' => $task->title ?? 'Unknown',

                'depends_on_task' => $dependsOnTask->title ?? 'Unknown'

            ]),

            'deleted' => __('Dependency removed: Task ":task" no longer depends on ":depends_on_task"', [

                'task' => $task->title ?? 'Unknown',

                'depends_on_task' => $dependsOnTask->title ?? 'Unknown'

            ]),

            default => parent::getActivityDescription($action)

        };

    }

}