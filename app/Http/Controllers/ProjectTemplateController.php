<?php
namespace App\Http\Controllers;

use App\Models\ProjectTemplate;
use App\Models\TaskChecklistTemplate;
use App\Models\TaskTemplate;
use App\Traits\HasPermissionChecks;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\TaskStage;


class ProjectTemplateController extends Controller
{

    use HasPermissionChecks;

    /**

     * Display a listing of the project templates.

     */

    public function index(Request $request): Response

    {

                $this->authorizePermission('template_view_any');

 

        $user = auth()->user();

        $workspace = $user->currentWorkspace;

 

        if (!$workspace) {

            abort(404, __('No workspace found. Please select a workspace.'));

        }

 

        $query = ProjectTemplate::with(['creator', 'taskTemplates'])

            ->availableFor($workspace->id);

 

        if ($request->search) {

            $query->search($request->search);

        }

 

        if ($request->category) {

            $query->byCategory($request->category);

        }

 

        $perPage = in_array($request->get('per_page', 12), [12, 24, 48]) ? $request->get('per_page', 12) : 12;

        $templates = $query->latest()->paginate($perPage);

 

        // Get task stages for the current workspace

        $taskStages = TaskStage::where('workspace_id', $workspace->id)

            ->orderBy('order')

            ->get();

 

        return Inertia::render('project-templates/Index', [

            'templates' => $templates,

            'filters' => $request->only(['search', 'category']),

            'permissions' => $this->getModuleCrudPermissions('template'),

            'taskStages' => $taskStages

        ]);

    }

    /**

     * Show the form for creating a new project template.

     */

    public function create(): Response
    {

        $this->authorizePermission('template_create');

 

        return Inertia::render('project-templates/Create', [

            'permissions' => $this->getModuleCrudPermissions('template')

        ]);

    }

    /**

     * Store a newly created project template in storage.

     */

    public function store(Request $request)
    {

        $this->authorizePermission('template_create');
        

        $user = auth()->user();

        $workspace = $user->currentWorkspace;

        if (! $workspace) {

            return back()->withErrors(['error' => __('No workspace found. Please select a workspace.')]);

        }

        $validated = $request->validate([

            'name'                                => 'required|string|max:255',

            'description'                         => 'nullable|string',

            'default_status'                      => 'required|in:planning,active,on_hold,completed,cancelled',

            'default_priority'                    => 'required|in:low,medium,high,urgent',

            'estimated_hours'                     => 'nullable|integer|min:0',

            'budget'                              => 'nullable|numeric|min:0',

            'is_public'                           => 'boolean',

            'category'                            => 'nullable|string|max:255',

            'tasks'                               => 'nullable|array',

            'tasks.*.title'                       => 'required|string|max:255',

            'tasks.*.description'                 => 'nullable|string',

            'tasks.*.priority'                    => 'required|in:low,medium,high,critical',

            'tasks.*.task_type'                   => 'required|in:member,client',

            'tasks.*.estimated_days'              => 'nullable|integer|min:0',

            'tasks.*.order'                       => 'integer|min:0',

            'tasks.*.checklists'                  => 'nullable|array',

            'tasks.*.checklists.*.title'          => 'required|string|max:255',

            'tasks.*.checklists.*.estimated_days' => 'nullable|integer|min:0',

            'tasks.*.checklists.*.order'          => 'integer|min:0',

        ]);

        DB::beginTransaction();

        try {

            $template = ProjectTemplate::create([

                'workspace_id'     => $workspace->id,

                'name'             => $validated['name'],

                'description'      => $validated['description'] ?? null,

                'default_status'   => $validated['default_status'],

                'default_priority' => $validated['default_priority'],

                'estimated_hours'  => $validated['estimated_hours'] ?? null,

                'budget'           => $validated['budget'] ?? null,

                'is_public'        => $validated['is_public'] ?? false,

                'category'         => $validated['category'] ?? null,

                'created_by'       => $user->id,

                'updated_by'       => $user->id,

            ]);

            // Create task templates

            if (! empty($validated['tasks'])) {

                foreach ($validated['tasks'] as $taskData) {

                    $taskTemplate = TaskTemplate::create([

                        'project_template_id' => $template->id,

                        'title'               => $taskData['title'],

                        'description'         => $taskData['description'] ?? null,

                        'priority'            => $taskData['priority'],

                        'task_type' => $taskData['task_type'] ?? 'member',

                        'estimated_days'      => $taskData['estimated_days'] ?? null,

                        'order'               => $taskData['order'] ?? 0,

                        'created_by'          => $user->id,

                    ]);

                    // Create checklist templates

                    if (! empty($taskData['checklists'])) {

                        foreach ($taskData['checklists'] as $checklistData) {

                            TaskChecklistTemplate::create([

                                'task_template_id' => $taskTemplate->id,

                                'title'            => $checklistData['title'],

                                'estimated_days'   => $checklistData['estimated_days'] ?? null,

                                'order'            => $checklistData['order'] ?? 0,

                                'created_by'       => $user->id,

                            ]);

                        }

                    }

                }

            }

            DB::commit();

            return redirect()->route('project-templates.show', $template->id)

                ->with('success', __('Template created successfully.'));

        } catch (\Exception $e) {

            DB::rollBack();

            return back()->withErrors(['error' => __('Failed to create template: ') . $e->getMessage()]);

        }

    }

    /**

     * Display the specified project template.

     */

    public function show(ProjectTemplate $projectTemplate): Response
    {

        $this->authorizePermission('project_view_any');
        

        $user = auth()->user();

        $workspace = $user->currentWorkspace;

        // Check if user has access to this template

        if ($projectTemplate->workspace_id !== $workspace->id && ! $projectTemplate->is_public) {

            abort(403, __('You do not have permission to view this template.'));

        }

        $projectTemplate->load([

            'creator',

            'taskTemplates.checklistTemplates',

            'workspace',

        ]);

         // Get task stages for the current workspace

        $taskStages = TaskStage::where('workspace_id', $workspace->id)

            ->orderBy('order')

            ->get();

 

        return Inertia::render('project-templates/Show', [

            'template' => $projectTemplate,

            'permissions' => $this->getModuleCrudPermissions('project'),

            'taskStages' => $taskStages

        ]);

    }

    /**

     * Update the specified project template in storage.

     */

    public function update(Request $request, ProjectTemplate $projectTemplate)
    {

        $this->authorizePermission('template_update');
        


        $user = auth()->user();

        $workspace = $user->currentWorkspace;

        // Check if user owns this template

        if ($projectTemplate->workspace_id !== $workspace->id) {

            return back()->withErrors(['error' => __('You do not have permission to update this template.')]);

        }

        $validated = $request->validate([

            'name'                                => 'required|string|max:255',

            'description'                         => 'nullable|string',

            'default_status'                      => 'required|in:planning,active,on_hold,completed,cancelled',

            'default_priority'                    => 'required|in:low,medium,high,urgent',

            'estimated_hours'                     => 'nullable|integer|min:0',

            'budget'                              => 'nullable|numeric|min:0',

            'is_public'                           => 'boolean',

            'category'                            => 'nullable|string|max:255',

            'tasks'                               => 'nullable|array',

            'tasks.*.id'                          => 'nullable|exists:task_templates,id',

            'tasks.*.title'                       => 'required|string|max:255',

            'tasks.*.description'                 => 'nullable|string',

            'tasks.*.priority'                    => 'required|in:low,medium,high,critical',

            'tasks.*.task_type'                   => 'required|in:member,client',

            'tasks.*.estimated_days'              => 'nullable|integer|min:0',

            'tasks.*.order'                       => 'integer|min:0',

            'tasks.*.checklists'                  => 'nullable|array',

            'tasks.*.checklists.*.id'             => 'nullable|exists:task_checklist_templates,id',

            'tasks.*.checklists.*.title'          => 'required|string|max:255',

            'tasks.*.checklists.*.estimated_days' => 'nullable|integer|min:0',

            'tasks.*.checklists.*.order'          => 'integer|min:0',

        ]);

        DB::beginTransaction();

        try {

            $projectTemplate->update([

                'name'             => $validated['name'],

                'description'      => $validated['description'] ?? null,

                'default_status'   => $validated['default_status'],

                'default_priority' => $validated['default_priority'],

                'estimated_hours'  => $validated['estimated_hours'] ?? null,

                'budget'           => $validated['budget'] ?? null,

                'is_public'        => $validated['is_public'] ?? false,

                'category'         => $validated['category'] ?? null,

                'updated_by'       => $user->id,

            ]);

            // Update or create task templates

            if (isset($validated['tasks'])) {

                $existingTaskIds = [];

                foreach ($validated['tasks'] as $taskData) {

                    if (! empty($taskData['id'])) {

                        // Update existing task template

                        $taskTemplate = TaskTemplate::find($taskData['id']);

                        if ($taskTemplate && $taskTemplate->project_template_id === $projectTemplate->id) {

                            $taskTemplate->update([

                                'title'          => $taskData['title'],

                                'description'    => $taskData['description'] ?? null,

                                'priority'       => $taskData['priority'],

                                'task_type' => $taskData['task_type'] ?? 'member',

                                'estimated_days' => $taskData['estimated_days'] ?? null,

                                'order'          => $taskData['order'] ?? 0,

                            ]);

                            $existingTaskIds[] = $taskTemplate->id;

                        }

                    } else {

                        // Create new task template

                        $taskTemplate = TaskTemplate::create([

                            'project_template_id' => $projectTemplate->id,

                            'title'               => $taskData['title'],

                            'description'         => $taskData['description'] ?? null,

                            'priority'            => $taskData['priority'],
                            'task_type' => $taskData['task_type'] ?? 'member',


                            'estimated_days'      => $taskData['estimated_days'] ?? null,

                            'order'               => $taskData['order'] ?? 0,

                            'created_by'          => $user->id,

                        ]);

                        $existingTaskIds[] = $taskTemplate->id;

                    }

                    // Update or create checklist templates

                    if (isset($taskData['checklists'])) {

                        $existingChecklistIds = [];

                        foreach ($taskData['checklists'] as $checklistData) {

                            if (! empty($checklistData['id'])) {

                                // Update existing checklist template

                                $checklistTemplate = TaskChecklistTemplate::find($checklistData['id']);

                                if ($checklistTemplate && $checklistTemplate->task_template_id === $taskTemplate->id) {

                                    $checklistTemplate->update([

                                        'title'          => $checklistData['title'],

                                        'estimated_days' => $checklistData['estimated_days'] ?? null,

                                        'order'          => $checklistData['order'] ?? 0,

                                    ]);

                                    $existingChecklistIds[] = $checklistTemplate->id;

                                }

                            } else {

                                // Create new checklist template

                                $checklistTemplate = TaskChecklistTemplate::create([

                                    'task_template_id' => $taskTemplate->id,

                                    'title'            => $checklistData['title'],

                                    'estimated_days'   => $checklistData['estimated_days'] ?? null,

                                    'order'            => $checklistData['order'] ?? 0,

                                    'created_by'       => $user->id,

                                ]);

                                $existingChecklistIds[] = $checklistTemplate->id;

                            }

                        }

                        // Delete checklists that were removed

                        TaskChecklistTemplate::where('task_template_id', $taskTemplate->id)

                            ->whereNotIn('id', $existingChecklistIds)

                            ->delete();

                    } else {

                        // Delete all checklists if none provided

                        TaskChecklistTemplate::where('task_template_id', $taskTemplate->id)->delete();

                    }

                }

                // Delete task templates that were removed

                TaskTemplate::where('project_template_id', $projectTemplate->id)

                    ->whereNotIn('id', $existingTaskIds)

                    ->delete();

            }

            DB::commit();

            return redirect()->route('project-templates.show', $projectTemplate->id)

                ->with('success', __('Template updated successfully.'));

        } catch (\Exception $e) {

            DB::rollBack();

            return back()->withErrors(['error' => __('Failed to update template: ') . $e->getMessage()]);

        }

    }

    /**

     * Remove the specified project template from storage.

     */

    public function destroy(ProjectTemplate $projectTemplate)
    {

        $this->authorizePermission('template_delete');
        

        $user = auth()->user();

        $workspace = $user->currentWorkspace;

        // Check if user owns this template

        if ($projectTemplate->workspace_id !== $workspace->id) {

            return back()->withErrors(['error' => __('You do not have permission to delete this template.')]);

        }

        DB::beginTransaction();

        try {

            $projectTemplate->delete();

            DB::commit();

            return redirect()->route('project-templates.index')

                ->with('success', __('Template deleted successfully.'));

        } catch (\Exception $e) {

            DB::rollBack();

            return back()->withErrors(['error' => __('Failed to delete template: ') . $e->getMessage()]);

        }

    }

}
