<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    use LogsActivity;
    protected $fillable = [
        'project_id', 'task_stage_id', 'milestone_id', 'title', 'description',
        'priority', 'start_date', 'end_date', 'assigned_to', 'created_by', 'progress'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'progress' => 'integer'
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function taskStage(): BelongsTo
    {
        return $this->belongsTo(TaskStage::class);
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(ProjectMilestone::class, 'milestone_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->latest();
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(TaskChecklist::class)->orderBy('order');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_members')
                    ->withPivot('assigned_by', 'assigned_at')
                    ->withTimestamps();
    }

    public function timesheetEntries(): HasMany
    {
        return $this->hasMany(TimesheetEntry::class);
    }

    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeByStage($query, $stageId)
    {
        return $query->where('task_stage_id', $stageId);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function isOverdue(): bool
    {
        return $this->end_date && $this->end_date->isPast() && $this->progress < 100;
    }

        /**

     * Check if all task dependencies are completed

     */

    public function areDependenciesMet(): bool

    {

        $dependencies = $this->dependsOnTasks()

            ->select('tasks.id', 'tasks.progress', 'task_dependencies.dependency_type')

            ->get();

 

        if ($dependencies->isEmpty()) {

            return true;

        }

 

        foreach ($dependencies as $dependency) {

            // For finish_to_start dependency, the dependent task must be completed (100% progress)

            if ($dependency->pivot->dependency_type === 'finish_to_start') {

                if ($dependency->progress < 100) {

                    return false;

                }

            }

        }

 

        return true;

    }

 

    /**

     * Check if task can be started (no blocking dependencies)

     */

    public function canBeStarted(): bool

    {

        return $this->areDependenciesMet();

    }

 

    /**

     * Get list of blocking dependencies (incomplete tasks this task depends on)

     */

    public function getBlockingDependencies()

    {

        return $this->dependsOnTasks()

            ->where('progress', '<', 100)

            ->where('task_dependencies.dependency_type', 'finish_to_start')

            ->select('tasks.*', 'task_dependencies.dependency_type')

            ->get();

    }

    public function calculateProgress(): int
    {
        $checklists = $this->checklists;
        if ($checklists->isEmpty()) {
            return $this->progress;
        }

        $completed = $checklists->where('is_completed', true)->count();
        return (int) (($completed / $checklists->count()) * 100);
    }

    protected function getActivityDescription(string $action): string
    {
        return match($action) {
            'created' => __('Task ":title" was created', ['title' => $this->title]),
            'updated' => __('Task ":title" was updated', ['title' => $this->title]),
            'deleted' => __('Task ":title" was deleted', ['title' => $this->title]),
            default => parent::getActivityDescription($action)
        };
    }

    public function logStatusChange(string $oldStage, string $newStage)
    {
        $this->logActivity('stage_changed', [
            'old_stage' => $oldStage,
            'new_stage' => $newStage,
            'description' => __('Task ":title" moved from :old_stage to :new_stage', [
                'title' => $this->title,
                'old_stage' => $oldStage,
                'new_stage' => $newStage
            ])
        ]);
    }

    public function logAssignment(User $user)
    {
        $this->logActivity('assigned', [
            'assigned_to' => $user->name,
            'description' => __('Task ":title" was assigned to :user', [
                'title' => $this->title,
                'user' => $user->name
            ])
        ]);
    }

    public function updateMilestoneProgress(): void
    {
        if ($this->milestone_id) {
            $this->milestone->updateProgressFromTasks();
        }
        
        // Always update project progress
        $this->project->updateProgressFromMilestones();
    }

    protected static function booted()
    {
        static::updated(function ($task) {
            $task->updateMilestoneProgress();
        });
        
        static::created(function ($task) {
            $task->updateMilestoneProgress();
        });
        
        static::deleted(function ($task) {
            $task->updateMilestoneProgress();
        });
    }

     /**

     * Tasks that this task depends on

     */

    public function dependencies(): HasMany

    {

        return $this->hasMany(TaskDependency::class, 'task_id');

    }

 

    /**

     * Tasks that depend on this task

     */

    public function dependents(): HasMany

    {

        return $this->hasMany(TaskDependency::class, 'depends_on_task_id');

    }

 

    /**

     * Get all tasks that this task depends on

     */

    public function dependsOnTasks()

    {

        return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'depends_on_task_id')

                    ->withPivot('dependency_type')

                    ->withTimestamps();

    }

 

    /**

     * Get all tasks that depend on this task

     */

    public function dependentTasks()

    {

        return $this->belongsToMany(Task::class, 'task_dependencies', 'depends_on_task_id', 'task_id')

                    ->withPivot('dependency_type')

                    ->withTimestamps();

    }
}