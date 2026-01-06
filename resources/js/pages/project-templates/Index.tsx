import { useState, useEffect } from 'react';

import { router, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Plus, Search, Eye, Edit, Trash2, FileStack, Rocket, CheckSquare } from 'lucide-react';

import { PageTemplate } from '@/components/page-template';

import { EnhancedDeleteModal } from '@/components/EnhancedDeleteModal';

import { toast } from '@/components/custom-toast';

import { hasPermission } from '@/utils/authorization';

import { useTranslation } from 'react-i18next';

import type { ProjectTemplate } from '@/types';

import CreateProjectModal from './CreateProjectModal';



export default function TemplateIndex() {

    const { t } = useTranslation();

    const { auth, templates, filters: pageFilters = {}, errors, flash } = usePage().props as any;

    const permissions = auth?.permissions || [];



    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    const [currentItem, setCurrentItem] = useState<ProjectTemplate | null>(null);



    // Handle flash messages

    useEffect(() => {

        if (flash?.success) {

            toast.success(flash.success);

        }

        if (flash?.error) {

            toast.error(flash.error);

        }

    }, [flash]);



    const handleSearch = (e: React.FormEvent) => {

        e.preventDefault();

        applyFilters();

    };



    const applyFilters = () => {

        const params: any = { page: 1 };



        if (searchTerm) params.search = searchTerm;

        if (pageFilters.per_page) params.per_page = pageFilters.per_page;



        router.get(route('project-templates.index'), params, { preserveState: false, preserveScroll: false });

    };



    const handleCreateProject = (template: ProjectTemplate) => {

        setCurrentItem(template);

        setIsCreateProjectModalOpen(true);

    };



    const handleViewTemplate = (template: ProjectTemplate) => {

        router.get(route('project-templates.show', template.id));

    };



    const handleEditTemplate = (template: ProjectTemplate) => {

        router.get(route('project-templates.show', template.id));

    };



    const handleDeleteTemplate = (template: ProjectTemplate) => {

        setCurrentItem(template);

        setIsDeleteModalOpen(true);

    };



    const handleAddNew = () => {

        router.get(route('project-templates.create'));

    };



    const handleDeleteConfirm = () => {

        if (!currentItem) return;



        toast.loading('Deleting template...');

        router.delete(route('project-templates.destroy', currentItem.id), {

            onSuccess: () => {

                setIsDeleteModalOpen(false);

                setCurrentItem(null);

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

            urgent: 'bg-red-100 text-red-800'

        };

        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';

    };



    const pageActions = [];



    if (hasPermission(permissions, 'project_create')) {

        pageActions.push({

            label: t('Create Template'),

            icon: <Plus className="h-4 w-4 mr-2" />,

            variant: 'default',

            onClick: handleAddNew

        });

    }



    const breadcrumbs = [

        { title: t('Dashboard'), href: route('dashboard') },

        { title: t('Templates') }

    ];



    return (

        <PageTemplate

            title={t('Project Templates')}

            url="/project-templates"

            actions={pageActions}

            breadcrumbs={breadcrumbs}

            noPadding

        >

            {/* Overview Row */}

            <Card className="mb-4 hover:shadow-md transition-shadow">

                <CardContent className="p-4">

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                        <div className="text-center">

                            <div className="text-xl font-bold text-blue-600">

                                {templates?.total || 0}

                            </div>

                            <div className="text-xs text-gray-600">{t('Total Templates')}</div>

                        </div>

                        <div className="text-center">

                            <div className="text-xl font-bold text-green-600">

                                {templates?.data?.filter((tpl: ProjectTemplate) => tpl.is_public).length || 0}

                            </div>

                            <div className="text-xs text-gray-600">{t('Public')}</div>

                        </div>

                        <div className="text-center">

                            <div className="text-xl font-bold text-purple-600">

                                {templates?.data?.filter((tpl: ProjectTemplate) => !tpl.is_public).length || 0}

                            </div>

                            <div className="text-xs text-gray-600">{t('Private')}</div>

                        </div>

                        <div className="text-center">

                            <div className="text-xl font-bold text-orange-600">

                                {templates?.data?.reduce((sum: number, tpl: ProjectTemplate) => sum + (tpl.taskTemplates?.length || 0), 0) || 0}

                            </div>

                            <div className="text-xs text-gray-600">{t('Total Tasks')}</div>

                        </div>

                        <div className="text-center">

                            <div className="text-xl font-bold text-blue-600">

                                {templates?.data?.reduce((sum: number, tpl: ProjectTemplate) =>

                                    sum + (tpl.taskTemplates?.filter(task => task.task_type === 'member').length || 0), 0) || 0}

                            </div>

                            <div className="text-xs text-gray-600">{t('Member Tasks')}</div>

                        </div>

                        <div className="text-center">

                            <div className="text-xl font-bold text-purple-600">

                                {templates?.data?.reduce((sum: number, tpl: ProjectTemplate) =>

                                    sum + (tpl.taskTemplates?.filter(task => task.task_type === 'client').length || 0), 0) || 0}

                            </div>

                            <div className="text-xs text-gray-600">{t('Client Tasks')}</div>

                        </div>

                    </div>

                </CardContent>

            </Card>



            {/* Search section */}

            <div className="bg-white rounded-lg shadow mb-4">

                <div className="p-4">

                    <form onSubmit={handleSearch} className="flex gap-2">

                        <div className="relative flex-1">

                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

                            <Input

                                placeholder={t('Search templates...')}

                                value={searchTerm}

                                onChange={(e) => setSearchTerm(e.target.value)}

                                className="w-full pl-9"

                            />

                        </div>

                        <Button type="submit">{t('Search')}</Button>

                    </form>

                </div>

            </div>



            {/* Templates Grid */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

                {templates?.data?.map((template: ProjectTemplate) => (

                    <Card key={template.id} className="hover:shadow-lg transition-shadow">

                        <CardHeader>

                            <div className="flex items-start justify-between">

                                <div className="flex-1">

                                    <CardTitle className="text-lg flex items-center gap-2">

                                        <FileStack className="h-5 w-5 text-blue-600" />

                                        {template.name}

                                    </CardTitle>

                                    {template.category && (

                                        <Badge variant="outline" className="mt-2">

                                            {template.category}

                                        </Badge>

                                    )}

                                </div>

                                {template.is_public && (

                                    <Badge className="bg-green-100 text-green-800">

                                        {t('Public')}

                                    </Badge>

                                )}

                            </div>

                        </CardHeader>

                        <CardContent>

                            <CardDescription className="mb-4 line-clamp-2 min-h-[40px]">

                                {template.description || t('No description available')}

                            </CardDescription>



                            <div className="space-y-2 mb-4">

                                <div className="flex items-center justify-between text-sm">

                                    <span className="text-gray-600">{t('Priority')}:</span>

                                    <Badge className={getPriorityColor(template.default_priority)}>

                                        {template.default_priority}

                                    </Badge>

                                </div>

                                <div className="flex items-center justify-between text-sm">

                                    <span className="text-gray-600">{t('Tasks')}:</span>

                                    <div className="flex items-center gap-1">

                                        <CheckSquare className="h-4 w-4 text-gray-500" />

                                        <span className="font-medium">{template.taskTemplates?.length || 0}</span>

                                    </div>

                                </div>

                                {template.estimated_hours && (

                                    <div className="flex items-center justify-between text-sm">

                                        <span className="text-gray-600">{t('Est. Hours')}:</span>

                                        <span className="font-medium">{template.estimated_hours}h</span>

                                    </div>

                                )}

                                {template.budget && (

                                    <div className="flex items-center justify-between text-sm">

                                        <span className="text-gray-600">{t('Budget')}:</span>

                                        <span className="font-medium">${template.budget}</span>

                                    </div>

                                )}

                            </div>

                        </CardContent>

                        <CardFooter className="flex gap-2 border-t pt-4">

                            <Button

                                onClick={() => handleCreateProject(template)}

                                className="flex-1"

                                variant="default"

                            >

                                <Rocket className="h-4 w-4 mr-2" />

                                {t('Create Project')}

                            </Button>

                            <Button

                                onClick={() => handleViewTemplate(template)}

                                variant="outline"

                                size="icon"

                            >

                                <Eye className="h-4 w-4" />

                            </Button>

                            {hasPermission(permissions, 'project_update') && template.workspace_id === auth?.user?.current_workspace_id && (

                                <Button

                                    onClick={() => handleEditTemplate(template)}

                                    variant="outline"

                                    size="icon"

                                >

                                    <Edit className="h-4 w-4" />

                                </Button>

                            )}

                            {hasPermission(permissions, 'project_delete') && template.workspace_id === auth?.user?.current_workspace_id && (

                                <Button

                                    onClick={() => handleDeleteTemplate(template)}

                                    variant="outline"

                                    size="icon"

                                    className="text-red-600 hover:text-red-700"

                                >

                                    <Trash2 className="h-4 w-4" />

                                </Button>

                            )}

                        </CardFooter>

                    </Card>

                ))}

            </div>



            {/* Empty State */}

            {(!templates?.data || templates.data.length === 0) && (

                <Card>

                    <CardContent className="flex flex-col items-center justify-center py-12">

                        <FileStack className="h-16 w-16 text-gray-400 mb-4" />

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">

                            {t('No templates found')}

                        </h3>

                        <p className="text-gray-600 mb-4 text-center max-w-md">

                            {searchTerm

                                ? t('Try adjusting your search criteria')

                                : t('Create your first project template to streamline your workflow')

                            }

                        </p>

                        {hasPermission(permissions, 'project_create') && !searchTerm && (

                            <Button onClick={handleAddNew}>

                                <Plus className="h-4 w-4 mr-2" />

                                {t('Create Template')}

                            </Button>

                        )}

                    </CardContent>

                </Card>

            )}



            {/* Pagination */}

            {templates?.data && templates.data.length > 0 && (

                <div className="flex items-center justify-between mt-6">

                    <div className="text-sm text-gray-600">

                        {t('Showing')} {templates.from} {t('to')} {templates.to} {t('of')} {templates.total} {t('templates')}

                    </div>

                    <div className="flex gap-2">

                        {templates.links?.map((link: any, index: number) => (

                            <Button

                                key={index}

                                variant={link.active ? 'default' : 'outline'}

                                size="sm"

                                disabled={!link.url}

                                onClick={() => link.url && router.get(link.url)}

                                dangerouslySetInnerHTML={{ __html: link.label }}

                            />

                        ))}

                    </div>

                </div>

            )}



            {/* Delete Modal */}

            {currentItem && (

                <EnhancedDeleteModal

                    isOpen={isDeleteModalOpen}

                    onClose={() => {

                        setIsDeleteModalOpen(false);

                        setCurrentItem(null);

                    }}

                    onConfirm={handleDeleteConfirm}

                    itemName={currentItem.name}

                    itemType="template"

                />

            )}



            {/* Create Project Modal */}

            {currentItem && (

                <CreateProjectModal

                    isOpen={isCreateProjectModalOpen}

                    onClose={() => {

                        setIsCreateProjectModalOpen(false);

                        setCurrentItem(null);

                    }}

                    template={currentItem}

                />

            )}

        </PageTemplate>

    );

}