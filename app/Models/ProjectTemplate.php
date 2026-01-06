<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectTemplate extends Model
{

    use HasFactory, SoftDeletes;

    /**

     * The attributes that are mass assignable.

     *

     * @var array<int, string>

     */

    protected $fillable = [

        'workspace_id',

        'name',

        'description',

        'default_status',

        'default_priority',

        'estimated_hours',

        'budget',

        'is_public',

        'category',

        'created_by',

        'updated_by',

    ];

    /**

     * The attributes that should be cast.

     *

     * @var array<string, string>

     */

    protected $casts = [

        'is_public'       => 'boolean',

        'estimated_hours' => 'integer',

        'budget'          => 'decimal:2',

    ];

    /**

     * Get the workspace that owns the template.

     */

    public function workspace(): BelongsTo
    {

        return $this->belongsTo(Workspace::class);

    }

    /**

     * Get the user who created the template.

     */

    public function creator(): BelongsTo
    {

        return $this->belongsTo(User::class, 'created_by');

    }

    /**

     * Get the user who last updated the template.

     */

    public function updater(): BelongsTo
    {

        return $this->belongsTo(User::class, 'updated_by');

    }

    /**

     * Get the task templates for this project template.

     */

    public function taskTemplates(): HasMany
    {

        return $this->hasMany(TaskTemplate::class)->orderBy('order');

    }

    /**

     * Scope a query to only include templates for a specific workspace.

     */

    public function scopeForWorkspace($query, int $workspaceId)
    {

        return $query->where('workspace_id', $workspaceId);

    }

    /**

     * Scope a query to only include public templates or templates owned by the workspace.

     */

    public function scopeAvailableFor($query, int $workspaceId)
    {

        return $query->where(function ($q) use ($workspaceId) {

            $q->where('workspace_id', $workspaceId)

                ->orWhere('is_public', true);

        });

    }

    /**

     * Scope a query to search templates by name or description.

     */

    public function scopeSearch($query, ?string $search)
    {

        if (! $search) {

            return $query;

        }

        return $query->where(function ($q) use ($search) {

            $q->where('name', 'like', "%{$search}%")

                ->orWhere('description', 'like', "%{$search}%")

                ->orWhere('category', 'like', "%{$search}%");

        });

    }

    /**

     * Scope a query to filter by category.

     */

    public function scopeByCategory($query, ?string $category)
    {

        if (! $category) {

            return $query;

        }

        return $query->where('category', $category);

    }

    /**

     * Create a project from this template.

     */

    public function createProject(array $attributes, ?int $taskStageId = null): Project
    {

        $project = Project::create(array_merge([

            'title'           => $this->name,

            'description'     => $this->description,

            'status'          => $this->default_status,

            'priority'        => $this->default_priority,

            'estimated_hours' => $this->estimated_hours,

            'budget'          => $this->budget,

        ], $attributes));

        // Create tasks from templates

        foreach ($this->taskTemplates as $taskTemplate) {

            $taskTemplate->createTask($project->id, $taskStageId);

        }

        return $project->fresh(['tasks.checklists']);

    }

}
