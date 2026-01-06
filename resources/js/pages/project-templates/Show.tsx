import { useState } from 'react';

import { router, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { PageTemplate } from '@/components/page-template';

import { toast } from '@/components/custom-toast';

import { hasPermission } from '@/utils/authorization';

import { useTranslation } from 'react-i18next';

import { Rocket, Edit, Trash2, FileStack, CheckSquare, Calendar, DollarSign, Globe, Lock } from 'lucide-react';

import type { ProjectTemplate } from '@/types';

import CreateProjectModal from './CreateProjectModal';

import { EnhancedDeleteModal } from '@/components/EnhancedDeleteModal';



export default function ShowTemplate() {

    const { t } = useTranslation();

    const { auth, template } = usePage().props as any;

    const permissions = auth?.permissions || [];

    const projectTemplate: ProjectTemplate = template;



    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);



    const canEdit = hasPermission(permissions, 'project_update') && projectTemplate.workspace_id === auth?.user?.current_workspace_id;

    const canDelete = hasPermission(permissions, 'project_delete') && projectTemplate.workspace_id === auth?.user?.current_workspace_id;



    const handleCreateProject = () => {

        setIsCreateProjectModalOpen(true);

    };



    const handleEdit = () => {

        // For now, redirect back to show page. In a full implementation, create an Edit page

        toast.info('Edit functionality coming soon! You can delete and recreate the template.');

    };



    const handleDelete = () => {

        setIsDeleteModalOpen(true);

    };



    const handleDeleteConfirm = () => {

        toast.loading('Deleting template...');

        router.delete(route('project-templates.destroy', projectTemplate.id), {

            onSuccess: () => {

                toast.dismiss();

                toast.success('Template deleted successfully');

            },

            onError: (errors) => {

                toast.dismiss();

                if (errors?.error) {

                    toast.error(errors.error);

                } else {

                    toast.error(`Failed to delete template: ${Object.values(errors).join(', ')}`);

                }

            }

        });

    };



    const getPriorityColor = (priority: string) => {

        const colors = {

            low: 'bg-green-100 text-green-800',

            medium: 'bg-yellow-100 text-yellow-800',

            high: 'bg-orange-100 text-orange-800',

            urgent: 'bg-red-100 text-red-800',

            critical: 'bg-red-100 text-red-800'

        };

        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';

    };



    const getStatusColor = (status: string) => {

        const colors = {

            planning: 'bg-blue-100 text-blue-800',

            active: 'bg-green-100 text-green-800',

            on_hold: 'bg-yellow-100 text-yellow-800',

            completed: 'bg-gray-100 text-gray-800',

            cancelled: 'bg-red-100 text-red-800'

        };

        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';

    };

    const getTaskTypeColor = (taskType: string) => {

        const colors = {

            member: 'bg-blue-100 text-blue-800',

            client: 'bg-purple-100 text-purple-800'

        };

        return colors[taskType as keyof typeof colors] || 'bg-gray-100 text-gray-800';

    };



    const getTaskTypeLabel = (taskType: string) => {

        return taskType === 'member' ? t('Member Task') : t('Client Task');

    };



    const pageActions = [

        {

            label: t('Create Project'),

            icon: <Rocket className="h-4 w-4 mr-2" />,

            variant: 'default' as const,

            onClick: handleCreateProject

        },

    ];



    if (canEdit) {

        pageActions.push({

            label: t('Edit'),

            icon: <Edit className="h-4 w-4 mr-2" />,

            variant: 'outline' as const,

            onClick: handleEdit

        });

    }



    if (canDelete) {

        pageActions.push({

            label: t('Delete'),

            icon: <Trash2 className="h-4 w-4 mr-2" />,

            variant: 'outline' as const,

            onClick: handleDelete,

            className: 'text-red-600 hover:text-red-700'

        });

    }



    const breadcrumbs = [

        { title: t('Dashboard'), href: route('dashboard') },

        { title: t('Templates'), href: route('project-templates.index') },

        { title: projectTemplate.name }

    ];



    return (

        <PageTemplate

            title={projectTemplate.name}

            url={`/project-templates/${projectTemplate.id}`}

            actions={pageActions}

            breadcrumbs={breadcrumbs}

        >

            <div className="space-y-6">

                {/* Template Overview */}

                <Card>

                    <CardHeader>

                        <div className="flex items-start justify-between">

                            <div>

                                <CardTitle className="flex items-center gap-2">

                                    <FileStack className="h-6 w-6 text-blue-600" />

                                    {t('Template Details')}

                                </CardTitle>

                                <CardDescription className="mt-2">

                                    {projectTemplate.description || t('No description provided')}

                                </CardDescription>

                            </div>

                            <div className="flex items-center gap-2">

                                {projectTemplate.is_public ? (

                                    <Badge className="bg-green-100 text-green-800">

                                        <Globe className="h-3 w-3 mr-1" />

                                        {t('Public')}

                                    </Badge>

                                ) : (

                                    <Badge className="bg-gray-100 text-gray-800">

                                        <Lock className="h-3 w-3 mr-1" />

                                        {t('Private')}

                                    </Badge>

                                )}

                                {projectTemplate.category && (

                                    <Badge variant="outline">{projectTemplate.category}</Badge>

                                )}

                            </div>

                        </div>

                    </CardHeader>

                    <CardContent>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                            <div className="space-y-1">

                                <div className="text-sm text-gray-600">{t('Default Status')}</div>

                                <Badge className={getStatusColor(projectTemplate.default_status)}>

                                    {projectTemplate.default_status}

                                </Badge>

                            </div>

                            <div className="space-y-1">

                                <div className="text-sm text-gray-600">{t('Default Priority')}</div>

                                <Badge className={getPriorityColor(projectTemplate.default_priority)}>

                                    {projectTemplate.default_priority}

                                </Badge>

                            </div>

                            {projectTemplate.estimated_hours && (

                                <div className="space-y-1">

                                    <div className="text-sm text-gray-600">{t('Estimated Hours')}</div>

                                    <div className="flex items-center gap-1 font-medium">

                                        <Calendar className="h-4 w-4 text-gray-500" />

                                        {projectTemplate.estimated_hours}h

                                    </div>

                                </div>

                            )}

                            {projectTemplate.budget && (

                                <div className="space-y-1">

                                    <div className="text-sm text-gray-600">{t('Budget')}</div>

                                    <div className="flex items-center gap-1 font-medium">

                                        <DollarSign className="h-4 w-4 text-gray-500" />

                                        ${projectTemplate.budget}

                                    </div>

                                </div>

                            )}

                        </div>



                        <div className="mt-6 pt-6 border-t">

                            <div className="text-sm text-gray-600">

                                {t('Created by')} <span className="font-medium">{projectTemplate.creator?.name || 'Unknown'}</span>

                                {' '}{t('on')}{' '}

                                {new Date(projectTemplate.created_at).toLocaleDateString()}

                            </div>

                        </div>

                    </CardContent>

                </Card>



                {/* Tasks */}

                <Card>

                    <CardHeader>

                        <CardTitle className="flex items-center gap-2">

                            <CheckSquare className="h-5 w-5 text-blue-600" />

                            {t('Tasks')} ({projectTemplate.taskTemplates?.length || 0})

                        </CardTitle>

                        <CardDescription>

                            {t('These tasks will be automatically created when using this template')}

                        </CardDescription>

                    </CardHeader>

                    <CardContent>

                        {!projectTemplate.taskTemplates || projectTemplate.taskTemplates.length === 0 ? (

                            <div className="text-center py-8 text-gray-500">

                                <CheckSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />

                                <p>{t('No tasks defined in this template')}</p>

                            </div>

                        ) : (

                            <div className="space-y-4">

                                {projectTemplate.taskTemplates.map((task, index) => (

                                    <Card key={task.id || index} className="border-2">

                                        <CardHeader className="pb-3">

                                            <div className="flex items-start justify-between">

                                                <div className="flex-1">

                                                    <div className="flex items-center gap-2 mb-2">

                                                        <Badge variant="outline">{t('Task')} {index + 1}</Badge>

                                                        <Badge className={getPriorityColor(task.priority)}>

                                                            {task.priority}

                                                        </Badge>

                                                        <Badge className={getTaskTypeColor(task.task_type)}>

                                                            {getTaskTypeLabel(task.task_type)}

                                                        </Badge>

                                                    </div>

                                                    <CardTitle className="text-lg">{task.title}</CardTitle>

                                                    {task.description && (

                                                        <CardDescription className="mt-2">

                                                            {task.description}

                                                        </CardDescription>

                                                    )}

                                                </div>

                                                {task.estimated_days && (

                                                    <div className="text-sm text-gray-600">

                                                        <Calendar className="h-4 w-4 inline mr-1" />

                                                        {task.estimated_days} {t('days')}

                                                    </div>

                                                )}

                                            </div>

                                        </CardHeader>

                                        {task.checklistTemplates && task.checklistTemplates.length > 0 && (

                                            <CardContent className="pt-0">

                                                <div className="space-y-2">

                                                    <div className="text-sm font-medium text-gray-700">

                                                        {t('Checklists')} ({task.checklistTemplates.length})

                                                    </div>

                                                    <div className="space-y-1 pl-4 border-l-2">

                                                        {task.checklistTemplates.map((checklist, checklistIndex) => (

                                                            <div

                                                                key={checklist.id || checklistIndex}

                                                                className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"

                                                            >

                                                                <span className="flex items-center gap-2">

                                                                    <CheckSquare className="h-4 w-4 text-gray-400" />

                                                                    {checklist.title}

                                                                </span>

                                                                {checklist.estimated_days && (

                                                                    <span className="text-gray-600">

                                                                        {checklist.estimated_days} {t('days')}

                                                                    </span>

                                                                )}

                                                            </div>

                                                        ))}

                                                    </div>

                                                </div>

                                            </CardContent>

                                        )}

                                    </Card>

                                ))}

                            </div>

                        )}

                    </CardContent>

                </Card>

            </div>



            {/* Create Project Modal */}

            <CreateProjectModal

                isOpen={isCreateProjectModalOpen}

                onClose={() => setIsCreateProjectModalOpen(false)}

                template={projectTemplate}

            />



            {/* Delete Modal */}

            <EnhancedDeleteModal

                isOpen={isDeleteModalOpen}

                onClose={() => setIsDeleteModalOpen(false)}

                onConfirm={handleDeleteConfirm}

                itemName={projectTemplate.name}

                itemType="template"

            />

        </PageTemplate>

    );

}