<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\TaskStage;
use App\Models\ProjectMilestone;
use App\Models\User;
use App\Models\TaskDependency;
use App\Traits\HasPermissionChecks;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    use HasPermissionChecks;
    public function index(Request $request): Response
    {
        $this->authorizePermission('task_view_any');
        
        $user = auth()->user();
        $workspace = $user->currentWorkspace;
        $userWorkspaceRole = $workspace->getMemberRole($user);
        
        $query = Task::with(['project', 'taskStage', 'assignedTo', 'creator', 'milestone', 'dependsOnTasks'])
            ->whereHas('project', function($q) use ($user, $userWorkspaceRole) {
                $q->forWorkspace($user->current_workspace_id);
                
                // If not workspace owner, only show tasks from accessible projects
                if ($userWorkspaceRole !== 'owner') {
                    $q->where(function($projectQuery) use ($user) {
                        $projectQuery->whereHas('members', function($memberQuery) use ($user) {
                            $memberQuery->where('user_id', $user->id);
                        })
                        ->orWhereHas('clients', function($clientQuery) use ($user) {
                            $clientQuery->where('user_id', $user->id);
                        })
                        ->orWhere('created_by', $user->id);
                    });
                }
            });
            
        // Filter tasks by assignment for members only
        if ($userWorkspaceRole === 'member') {
            $query->where(function($taskQuery) use ($user) {
                $taskQuery->where('assigned_to', $user->id)
                    ->orWhere('created_by', $user->id);
            });
        }

        if ($request->project_id) {
            $query->forProject($request->project_id);
        }

        if ($request->stage_id) {
            $query->byStage($request->stage_id);
        }

        if ($request->priority) {
            $query->byPriority($request->priority);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Default to kanban view and get all data without pagination
        $view = $request->get('view', 'kanban');

        if ($view === 'kanban') {
            $tasks = $query->get();
        } else {
            $perPage = $request->get('per_page', 20);
            $perPage = in_array($perPage, [20, 50, 100]) ? $perPage : 20;
            $tasks = $query->latest()->paginate($perPage);
        }

        // Add dependency status to each task
        if ($view === 'kanban') {
            $tasks->each(function ($task) {
                $task->can_be_started = $task->canBeStarted();
                $task->blocking_dependencies = $task->getBlockingDependencies();
            });
        } else {
            $tasks->getCollection()->transform(function ($task) {
                $task->can_be_started = $task->canBeStarted();
                $task->blocking_dependencies = $task->getBlockingDependencies();
                return $task;
            });
        }

        // Apply same access control to projects dropdown as used for task filtering
        $projectsQuery = Project::forWorkspace($user->current_workspace_id)
            ->with(['milestones', 'members.user']);
            
        // If not workspace owner, only show accessible projects
        if ($userWorkspaceRole !== 'owner') {
            $projectsQuery->where(function($q) use ($user) {
                $q->whereHas('members', function($memberQuery) use ($user) {
                    $memberQuery->where('user_id', $user->id);
                })
                ->orWhereHas('clients', function($clientQuery) use ($user) {
                    $clientQuery->where('user_id', $user->id);
                })
                ->orWhere('created_by', $user->id);
            });
        }
        
        $projects = $projectsQuery->get();
        $stages = TaskStage::forWorkspace($user->current_workspace_id)->ordered()->get();
        $members = User::whereHas('workspaces', function($q) use ($workspace) {
            $q->where('workspace_id', $workspace->id)->where('status', 'active');
        })->get();

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks,
            'projects' => $projects,
            'stages' => $stages,
            'members' => $members,
            'filters' => array_merge(
                $request->only(['project_id', 'stage_id', 'priority', 'assigned_to', 'search', 'per_page']),
                ['view' => $view]
            ),
            'project_name' => $request->project_name,
            'userWorkspaceRole' => $userWorkspaceRole,
            'userType' => $user->type,
            'permissions' => [
                'create' => $this->checkPermission('task_create'),
                'update' => $this->checkPermission('task_update'),
                'delete' => $this->checkPermission('task_delete'),
                'duplicate' => $this->checkPermission('task_duplicate'),
                'change_status' => $this->checkPermission('task_change_status'),
                'assign_users' => $this->checkPermission('task_assign_users'),
                'manage_stages' => $this->checkPermission('task_manage_stages'),
                'add_comments' => $this->checkPermission('task_add_comments'),
                'add_attachments' => $this->checkPermission('task_add_attachments'),
                'manage_checklists' => $this->checkPermission('task_manage_checklists'),
            ]
        ]);
    }

    public function show(Task $task)
    {
        $this->authorizePermission('task_view');
        
        $task->load([
            'project.workspace', 'project.members.user', 'taskStage', 'assignedTo', 'creator', 'milestone',
            'comments.user', 'checklists.assignedTo', 'checklists.creator', 'attachments.mediaItem',
            'dependsOnTasks', 'dependentTasks'
        ]);
        
        // Ensure MediaItem appended attributes are loaded
        $task->attachments->load('mediaItem');
        // Temporary debugging
        \Log::info('Task Attachments Count: ' . $task->attachments->count());
        \Log::info('Task Attachments: ' . json_encode($task->attachments->map(function($att) {
            return [
                'id' => $att->id,
                'media_item_id' => $att->media_item_id,
                'has_media' => $att->mediaItem ? true : false,
                'media_name' => $att->mediaItem?->name
            ];
        })));
        $task->attachments->each(function($attachment) {
            if ($attachment->mediaItem) {
                // Force load the media to ensure appended attributes work
                $attachment->mediaItem->getFirstMedia('images');
            }
        });

        $currentUser = auth()->user();
        $workspace = $currentUser->currentWorkspace;
        
        // Ensure task belongs to current workspace
        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            abort(403, 'Task not found in current workspace.');
        }

        // Add permission flags to comments
        $task->comments->each(function($comment) use ($currentUser) {
            $comment->can_update = $comment->canBeUpdatedBy($currentUser);
            $comment->can_delete = $comment->canBeDeletedBy($currentUser);
        });
        
        // Add permission flags to checklists
        $task->checklists->each(function($checklist) use ($currentUser) {
            $checklist->can_update = $checklist->canBeUpdatedBy($currentUser);
            $checklist->can_delete = $checklist->canBeDeletedBy($currentUser);
        });
        
        $allMembers = User::whereHas('workspaces', function($q) use ($workspace) {
            $q->where('workspace_id', $workspace->id)->where('status', 'active');
        })->get();
        
        // Get project members only (no clients)
        $projectMembers = $task->project->members->filter(function($member) {
            return $member->user && $member->user->type !== 'client';
        })->pluck('user');
        
        $stages = TaskStage::forWorkspace($currentUser->current_workspace_id)->ordered()->get();
        $milestones = $task->project->milestones ?? [];

        // Get available tasks from the same project (excluding current task)

        $availableTasks = Task::where('project_id', $task->project_id)

            ->where('id', '!=', $task->id)

            ->select('id', 'title', 'progress', 'task_stage_id')

            ->with('taskStage:id,name')

            ->get();

 

        return response()->json([

            'task' => $task,

            'members' => $projectMembers->isNotEmpty() ? $projectMembers : $allMembers,

            'stages' => $stages,

            'milestones' => $milestones,

            'availableTasks' => $availableTasks,

            'canBeStarted' => $task->canBeStarted(),

            'blockingDependencies' => $task->getBlockingDependencies(),
            'userType' => $currentUser->type, // Add company role/type

            'permissions' => [

                'update' => $this->checkPermission('task_update'),

                'delete' => $this->checkPermission('task_delete'),

                'duplicate' => $this->checkPermission('task_duplicate'),

                'change_status' => $this->checkPermission('task_change_status'),

                'assign_users' => $this->checkPermission('task_assign_users'),

                'add_comments' => $this->checkPermission('task_add_comments'),

                'add_attachments' => $this->checkPermission('task_add_attachments'),

                'manage_checklists' => $this->checkPermission('task_manage_checklists'),

                'manage_dependencies' => $this->checkPermission('task_update'),
            ]
        ]);
    }



    public function store(Request $request)
    {
        $this->authorizePermission('task_create');
        
        $user = auth()->user();
        $workspace = $user->currentWorkspace;
        
        if (!$workspace) {
            abort(403, 'No workspace selected.');
        }
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'milestone_id' => 'nullable|exists:project_milestones,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,critical',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'assigned_to' => 'nullable|exists:users,id'
        ]);
        
        // Ensure project belongs to current workspace
        $project = Project::find($validated['project_id']);
        if (!$project || $project->workspace_id !== $workspace->id) {
            abort(403, 'Project not found in current workspace.');
        }

        // Get first stage for the workspace
        $firstStage = TaskStage::forWorkspace(auth()->user()->current_workspace_id)
            ->ordered()
            ->first();

        $task = Task::create([
            ...$validated,
            'task_stage_id' => $firstStage->id,
            'created_by' => auth()->id(),
            'progress' => 0
        ]);

        return back()->with('success', __('Task created successfully!'));
    }

    public function update(Request $request, Task $task)
    {
        $this->authorizePermission('task_update');

        $user = auth()->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            abort(403, 'Task not found in current workspace.');
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,critical',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'assigned_to' => 'nullable|exists:users,id',
            'milestone_id' => 'nullable|exists:project_milestones,id',
            'task_stage_id' => 'nullable|exists:task_stages,id'
        ]);

        // If task_stage_id is being updated, check dependencies and checklists
        if (isset($validated['task_stage_id']) && $validated['task_stage_id'] != $task->task_stage_id) {
            // Check if task has checklists
            if ($task->checklists()->count() === 0) {
                return back()->withErrors([
                    'error' => __('Cannot change task stage. Task must have at least one checklist item.')
                ]);
            }

            // Check dependencies
            if (!$task->canBeStarted()) {
                $blockingDependencies = $task->getBlockingDependencies();
                $blockingCount = $blockingDependencies->count();

                return back()->withErrors([
                    'error' => __('Cannot change task status. :count incomplete :dependencies must be completed first.', [
                        'count' => $blockingCount,
                        'dependencies' => $blockingCount === 1 ? 'dependency' : 'dependencies'
                    ])
                ]);
            }
        }

        $task->update($validated);

        return back()->with('success', __('Task updated successfully!'));
    }

    public function destroy(Task $task)
    {
        $this->authorizePermission('task_delete');
        
        $user = auth()->user();
        $workspace = $user->currentWorkspace;
        
        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            abort(403, 'Task not found in current workspace.');
        }
        $task->delete();

        return back()->with('success', __('Task deleted successfully!'));
    }

    public function duplicate(Task $task)
    {
        $this->authorizePermission('task_duplicate');
        
        $user = auth()->user();
        $workspace = $user->currentWorkspace;
        
        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            abort(403, 'Task not found in current workspace.');
        }
        $newTask = $task->replicate();
        $newTask->title = $task->title . ' (Copy)';
        $newTask->start_date = null;
        $newTask->end_date = null;
        $newTask->progress = 0;
        $newTask->created_by = auth()->id();
        $newTask->save();

        // Copy checklists
        foreach ($task->checklists as $checklist) {
            $newChecklist = $checklist->replicate();
            $newChecklist->task_id = $newTask->id;
            $newChecklist->is_completed = false;
            $newChecklist->created_by = auth()->id();
            $newChecklist->save();
        }

        return back()->with('success', __('Task duplicated successfully!'));
    }

    public function changeStage(Request $request, Task $task)
    {
        $this->authorizePermission('task_change_status');

        $user = auth()->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace || $task->project->workspace_id !== $workspace->id) {
            abort(403, 'Task not found in current workspace.');
        }

        $validated = $request->validate([
            'task_stage_id' => 'required|exists:task_stages,id'
        ]);

        // Check if task has checklists
        if ($task->checklists()->count() === 0) {
            return back()->withErrors([
                'error' => __('Cannot change task stage. Task must have at least one checklist item.')
            ]);
        }

        // Check if task has blocking dependencies before allowing status change
        if (!$task->canBeStarted()) {
            $blockingDependencies = $task->getBlockingDependencies();
            $blockingCount = $blockingDependencies->count();

            return back()->withErrors([
                'error' => __('Cannot change task status. :count incomplete :dependencies must be completed first.', [
                    'count' => $blockingCount,
                    'dependencies' => $blockingCount === 1 ? 'dependency' : 'dependencies'
                ])
            ]);
        }

        $task->update($validated);

        return back()->with('success', __('Task stage updated successfully!'));
    }

 

    public function addDependency(Request $request, Task $task)

    {

        $this->authorizePermission('task_update');

 

        $user = auth()->user();

        $workspace = $user->currentWorkspace;

 

        if (!$workspace || $task->project->workspace_id !== $workspace->id) {

            abort(403, 'Task not found in current workspace.');

        }

 

        $validated = $request->validate([

            'depends_on_task_id' => 'required|exists:tasks,id',

            'dependency_type' => 'nullable|in:finish_to_start,start_to_start,finish_to_finish,start_to_finish'

        ]);

 

        // Check that dependency task is from the same project

        $dependsOnTask = Task::findOrFail($validated['depends_on_task_id']);

        if ($dependsOnTask->project_id !== $task->project_id) {

            return back()->withErrors(['error' => __('Dependency must be from the same project.')]);

        }

 

        // Prevent self-dependency

        if ($task->id === $validated['depends_on_task_id']) {

            return back()->withErrors(['error' => __('A task cannot depend on itself.')]);

        }

 

        // Check for circular dependency

        if ($this->wouldCreateCircularDependency($task->id, $validated['depends_on_task_id'])) {

            return back()->withErrors(['error' => __('This would create a circular dependency.')]);

        }

 

        // Create dependency

        TaskDependency::create([

            'task_id' => $task->id,

            'depends_on_task_id' => $validated['depends_on_task_id'],

            'dependency_type' => $validated['dependency_type'] ?? 'finish_to_start'

        ]);



        return back()->with('success', __('Dependency added successfully!'));

    }

 

    public function removeDependency(Request $request, Task $task)

    {

        $this->authorizePermission('task_update');

 

        $user = auth()->user();

        $workspace = $user->currentWorkspace;

 

        if (!$workspace || $task->project->workspace_id !== $workspace->id) {

            abort(403, 'Task not found in current workspace.');

        }

 

        $validated = $request->validate([

            'depends_on_task_id' => 'required|exists:tasks,id'

        ]);

 

        TaskDependency::where('task_id', $task->id)

            ->where('depends_on_task_id', $validated['depends_on_task_id'])

            ->delete();



        return back()->with('success', __('Dependency removed successfully!'));

    }

 

    /**

     * Check if adding a dependency would create a circular dependency

     */

    private function wouldCreateCircularDependency($taskId, $dependsOnTaskId, $visited = [])

    {

        // If we've already visited this task, we have a circular dependency

        if (in_array($dependsOnTaskId, $visited)) {

            return true;

        }
        // Add current task to visited list
        $visited[] = $dependsOnTaskId;

        // Get all tasks that the depends_on_task depends on
        $dependencies = TaskDependency::where('task_id', $dependsOnTaskId)
            ->pluck('depends_on_task_id');

        foreach ($dependencies as $nextDependency) {
            // If any dependency leads back to the original task, we have a circular dependency
            if ($nextDependency == $taskId) {
                return true;
            }

            // Recursively check the next level
            if ($this->wouldCreateCircularDependency($taskId, $nextDependency, $visited)) {
                return true;
            }
        }

        return false;
    }
}