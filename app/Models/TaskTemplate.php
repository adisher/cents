<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskTemplate extends Model
{

    use HasFactory, SoftDeletes;

    /**

     * The attributes that are mass assignable.

     *

     * @var array<int, string>

     */

    protected $fillable = [

        'project_template_id',

        'title',

        'description',

        'priority',

        'task_type',

        'estimated_days',

        'order',

        'created_by',

    ];

    /**

     * The attributes that should be cast.

     *

     * @var array<string, string>

     */

    protected $casts = [

        'estimated_days' => 'integer',

        'order'          => 'integer',

    ];

    /**

     * Get the project template that owns this task template.

     */

    public function projectTemplate(): BelongsTo
    {

        return $this->belongsTo(ProjectTemplate::class);

    }

    /**

     * Get the user who created this template.

     */

    public function creator(): BelongsTo
    {

        return $this->belongsTo(User::class, 'created_by');

    }

    /**

     * Get the checklist templates for this task template.

     */

    public function checklistTemplates(): HasMany
    {

        return $this->hasMany(TaskChecklistTemplate::class)->orderBy('order');

    }

    /**

     * Create a task from this template.

     */

    public function createTask(int $projectId, ?int $taskStageId = null, ?int $milestoneId = null): Task
    {

        $taskData = [

            'project_id'  => $projectId,

            'title'       => $this->title,

            'description' => $this->description,

            'priority'    => $this->priority,

            'created_by'  => $this->created_by,

        ];

        // Add task stage if provided

        if ($taskStageId) {

            $taskData['task_stage_id'] = $taskStageId;

        } else {

            // Get the first task stage for the project's workspace

            $project = Project::find($projectId);

            $firstStage = TaskStage::where('workspace_id', $project->workspace_id)

                ->orderBy('order')

                ->first();

            if ($firstStage) {

                $taskData['task_stage_id'] = $firstStage->id;

            }

        }

        // Add milestone if provided

        if ($milestoneId) {

            $taskData['milestone_id'] = $milestoneId;

        }

        // Calculate dates based on estimated days

        if ($this->estimated_days) {

            $taskData['start_date'] = now();

            $taskData['end_date'] = now()->addDays($this->estimated_days);

        }

        $task = Task::create($taskData);

        // Create checklists from templates

        foreach ($this->checklistTemplates as $checklistTemplate) {

            $checklistTemplate->createChecklist($task->id);

        }

        return $task->fresh(['checklists']);

    }

}
