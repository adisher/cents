<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Workspace;
use App\Traits\HasPermissionChecks;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{

    use HasPermissionChecks;

    /**

     * Display a listing of clients in the current workspace.

     */

    public function index(Request $request)
    {

        $user = auth()->user();
        // dd([
        //     'user_id' => $user->id,
        //     'user_type' => $user->type,
        //     'current_workspace' => $user->current_workspace_id,
        //     'has_client_view_any' => $user->can('client_view_any'),
        //     'all_permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
        //     'roles' => $user->getRoleNames()->toArray()
        // ]);

        $workspace = Workspace::find($user->current_workspace_id);

        if (! $workspace) {

            return redirect()->route('dashboard')->with('error', 'No workspace found');

        }

        // Get search query if provided

        $search = $request->input('search');

        // Build the clients query

        $clientsQuery = User::whereHas('workspaces', function ($q) use ($workspace) {

            $q->where('workspace_id', $workspace->id)

                ->where('role', 'client');

        });

        // Apply search filter if provided

        if ($search) {

            $clientsQuery->where(function ($q) use ($search) {

                $q->where('name', 'like', "%{$search}%")

                    ->orWhere('email', 'like', "%{$search}%");

            });

        }

        // Get clients with their project assignments count

        $clients = $clientsQuery->withCount([

            'projectClients as projects_count',

        ])->with([

            'workspaces' => function ($query) use ($workspace) {

                $query->where('workspace_id', $workspace->id);

            },

        ])->orderBy('name')->get();

        // Enrich client data with additional details

        $enrichedClients = $clients->map(function ($client) use ($workspace) {

            // Get workspace member details

            $workspaceMember = $client->workspaces->first();

            // Get all projects this client is assigned to

            $assignedProjects = $client->projectClients()

                ->with(['project' => function ($query) use ($workspace) {

                    $query->where('workspace_id', $workspace->id)

                        ->select('id', 'title', 'status', 'priority');

                }])

                ->get()

                ->pluck('project')

                ->filter();

            return [

                'id'                => $client->id,

                'name'              => $client->name,

                'email'             => $client->email,

                'avatar'            => $client->avatar,

                'status'            => $workspaceMember ? $workspaceMember->pivot->status : 'active',

                'projects_count'    => $assignedProjects->count(),

                'projects'          => $assignedProjects->map(function ($project) {

                    return [

                        'id'       => $project->id,

                        'name'     => $project->title,

                        'status'   => $project->status,

                        'priority' => $project->priority,

                    ];

                }),

                'joined_at'         => $workspaceMember ? $workspaceMember->pivot->created_at : null,

                'email_verified_at' => $client->email_verified_at,

                'created_at'        => $client->created_at,

            ];

        });

        return Inertia::render('clients/Index', [

            'clients'     => $enrichedClients,

            'filters'     => $request->only(['search']),

            'permissions' => $this->getModuleCrudPermissions('client'),

        ]);

    }

    /**

     * Display the specified client details.

     */

    public function show(Request $request, User $client)
    {

        $user = auth()->user();

        $workspace = Workspace::find($user->current_workspace_id);

        if (! $workspace) {

            return redirect()->route('dashboard')->with('error', 'No workspace found');

        }

        // Verify the client belongs to the current workspace

        $isMember = $client->workspaces()->where('workspace_id', $workspace->id)->exists();

        if (! $isMember) {

            abort(403, 'Client not found in current workspace');

        }

        // Get client's workspace member details

        $workspaceMember = $client->workspaces()

            ->where('workspace_id', $workspace->id)

            ->first();

        // Get all projects this client is assigned to

        $projects = $client->projectClients()

            ->with(['project' => function ($query) use ($workspace) {

                $query->where('workspace_id', $workspace->id)

                    ->with(['projectBudget', 'milestones']);

            }])

            ->get()

            ->pluck('project')

            ->filter();

        $clientData = [

            'id'                => $client->id,

            'name'              => $client->name,

            'email'             => $client->email,

            'avatar'            => $client->avatar,

            'status'            => $workspaceMember ? $workspaceMember->pivot->status : 'active',

            'role'              => $workspaceMember ? $workspaceMember->pivot->role : 'client',

            'projects_count'    => $projects->count(),

            'projects'          => $projects,

            'joined_at'         => $workspaceMember ? $workspaceMember->pivot->created_at : null,

            'email_verified_at' => $client->email_verified_at,

            'created_at'        => $client->created_at,

        ];

        return Inertia::render('clients/Show', [

            'client'      => $clientData,

            'permissions' => $this->getModuleCrudPermissions('client'),

        ]);

    }

}
