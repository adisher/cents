<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskChecklistTemplate extends Model
{

    use HasFactory, SoftDeletes;

    /**

     * The attributes that are mass assignable.

     *

     * @var array<int, string>

     */

    protected $fillable = [

        'task_template_id',

        'title',

        'order',

        'estimated_days',

        'created_by',

    ];

    /**

     * The attributes that should be cast.

     *

     * @var array<string, string>

     */

    protected $casts = [

        'order'          => 'integer',

        'estimated_days' => 'integer',

    ];

    /**

     * Get the task template that owns this checklist template.

     */

    public function taskTemplate(): BelongsTo
    {

        return $this->belongsTo(TaskTemplate::class);

    }

    /**

     * Get the user who created this template.

     */

    public function creator(): BelongsTo
    {

        return $this->belongsTo(User::class, 'created_by');

    }

    /**

     * Create a checklist from this template.

     */

    public function createChecklist(int $taskId): TaskChecklist
    {

        $checklistData = [

            'task_id'      => $taskId,

            'title'        => $this->title,

            'order'        => $this->order,

            'is_completed' => false,

            'created_by'   => $this->created_by,

        ];

        // Calculate due date based on estimated days

        if ($this->estimated_days) {

            $checklistData['due_date'] = now()->addDays($this->estimated_days);

        }

        return TaskChecklist::create($checklistData);

    }

}
