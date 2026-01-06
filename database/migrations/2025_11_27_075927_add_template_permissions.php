<?php

use App\Models\Permission;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{

    /**

     * Run the migrations.

     */

    public function up(): void
    {

        $permissions = [

            // Project Template Module

            ['name' => 'template_view_any', 'module' => 'templates', 'label' => 'View All Templates', 'description' => 'View all templates in workspace'],

            ['name' => 'template_view', 'module' => 'templates', 'label' => 'View Template', 'description' => 'View individual template information'],

            ['name' => 'template_create', 'module' => 'templates', 'label' => 'Create Template', 'description' => 'Create new template'],

            ['name' => 'template_update', 'module' => 'templates', 'label' => 'Update Template', 'description' => 'Modify template information'],

            ['name' => 'template_delete', 'module' => 'templates', 'label' => 'Delete Template', 'description' => 'Remove template'],

            ['name' => 'template_use', 'module' => 'templates', 'label' => 'Use Template', 'description' => 'Create project from template'],

        ];

        foreach ($permissions as $permission) {

            Permission::updateOrCreate(

                ['name' => $permission['name']],

                [

                    'module'      => $permission['module'],

                    'label'       => $permission['label'],

                    'description' => $permission['description'],

                    'guard_name'  => 'web',

                ]

            );

        }

    }

    /**

     * Reverse the migrations.

     */

    public function down(): void
    {

        $permissionNames = [

            'template_view_any',

            'template_view',

            'template_create',

            'template_update',

            'template_delete',

            'template_use',

        ];

        Permission::whereIn('name', $permissionNames)->delete();

    }

};
