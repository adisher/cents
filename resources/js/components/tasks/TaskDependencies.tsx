import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, X, Plus, CheckCircle, Clock, Link } from 'lucide-react';
import { Task } from '@/types';
import { toast } from '@/components/custom-toast';

interface Props {
    task: Task;
    availableTasks: Task[];
    canBeStarted: boolean;
    blockingDependencies: Task[];
    onUpdate: () => void;
    userWorkspaceRole?: string;
    userType?: string;
    permissions?: any;
}

export default function TaskDependencies({
    task,
    availableTasks,
    canBeStarted,
    blockingDependencies,
    onUpdate,
    userWorkspaceRole,
    userType,
    permissions
}: Props) {
    const { t } = useTranslation();
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [dependencyType, setDependencyType] = useState<string>('finish_to_start');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddDependency = () => {
        if (!selectedTaskId) {
            toast.error(t('Please select a task'));
            return;
        }

        setIsLoading(true);

        router.post(route('tasks.add-dependency', task.id), {
            depends_on_task_id: selectedTaskId,
            dependency_type: dependencyType
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('Dependency added successfully!'));
                setSelectedTaskId('');
                setDependencyType('finish_to_start');
                setIsLoading(false);
                // Refresh the task data
                onUpdate();
            },
            onError: (errors) => {
                const errorMessage = errors.error || Object.values(errors)[0] || t('Failed to add dependency');
                toast.error(errorMessage as string);
                setIsLoading(false);
            }
        });
    };

    const handleRemoveDependency = (dependsOnTaskId: number) => {
        setIsLoading(true);

        router.delete(route('tasks.remove-dependency', task.id), {
            data: {
                depends_on_task_id: dependsOnTaskId
            },
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('Dependency removed successfully!'));
                setIsLoading(false);
                // Refresh the task data
                onUpdate();
            },
            onError: (errors) => {
                const errorMessage = errors.error || Object.values(errors)[0] || t('Failed to remove dependency');
                toast.error(errorMessage as string);
                setIsLoading(false);
            }
        });
    };

    const getTaskProgress = (taskToCheck: Task) => {
        return taskToCheck.progress || 0;
    };

    const isTaskCompleted = (taskToCheck: Task) => {
        return getTaskProgress(taskToCheck) >= 100;
    };

    const dependsOnTasks = task.depends_on_tasks || [];
    const hasBlockingDependencies = blockingDependencies && blockingDependencies.length > 0;

    // Check permissions: superadmin and company users always have access, clients never do
    const isSuperAdmin = userType === 'superadmin' || userType === 'super admin';
    const isCompany = userType === 'company';
    const isClient = userWorkspaceRole === 'client';
    const canManageDependencies = (isSuperAdmin || isCompany || (!isClient && permissions?.manage_dependencies !== false));

    return (
        <div className="space-y-4">
            {/* Status Banner */}
            {!canBeStarted && hasBlockingDependencies && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-amber-900">
                                {t('This task cannot be started')}
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                                {t('The following dependencies must be completed first:')}
                            </p>
                            <ul className="mt-2 space-y-1">
                                {blockingDependencies.map((dep) => (
                                    <li key={dep.id} className="text-sm text-amber-800 flex items-center space-x-2">
                                        <Clock className="h-3 w-3" />
                                        <span>{dep.title} ({dep.progress}% {t('complete')})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {canBeStarted && dependsOnTasks.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-800 font-medium">
                            {t('All dependencies are met. This task can be started.')}
                        </p>
                    </div>
                </div>
            )}

            {/* Current Dependencies */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                    {t('Dependencies')} ({dependsOnTasks.length})
                </h4>

                {dependsOnTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                        {t('This task has no dependencies')}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {dependsOnTasks.map((dependsOnTask: any) => {
                            const isCompleted = isTaskCompleted(dependsOnTask);
                            const progress = getTaskProgress(dependsOnTask);

                            return (
                                <div
                                    key={dependsOnTask.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Link className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {dependsOnTask.title}
                                            </span>
                                            {isCompleted ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-amber-600" />
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                                {progress}% {t('complete')}
                                            </span>
                                        </div>
                                    </div>
                                    {canManageDependencies && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveDependency(dependsOnTask.id)}
                                            disabled={isLoading}
                                            className="ml-2"
                                        >
                                            <X className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add New Dependency */}
            {canManageDependencies && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                        {t('Add Dependency')}
                    </h4>

                    {availableTasks.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                            {t('No other tasks available in this project')}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    {t('Task')}
                                </label>
                                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                                    <SelectTrigger disabled={isLoading}>
                                        <SelectValue placeholder={t('Select a task')} />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {availableTasks.map((availableTask) => {
                                            const isAlreadyDependency = dependsOnTasks.some((dep: any) => dep.id === availableTask.id);
                                            return (
                                                <SelectItem
                                                    key={availableTask.id}
                                                    value={availableTask.id.toString()}
                                                    disabled={isAlreadyDependency}
                                                >
                                                    {availableTask.title} ({availableTask.progress || 0}%)
                                                    {isAlreadyDependency && ' (Already added)'}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleAddDependency}
                                disabled={!selectedTaskId || isLoading}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('Add Dependency')}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-blue-900 mb-1">
                    {t('About Task Dependencies')}
                </h5>
                <p className="text-xs text-blue-800">
                    {t('When you add a dependency, this task cannot be started or have its status changed until the dependent task is 100% complete.')}
                </p>
            </div>
        </div>
    );
}
