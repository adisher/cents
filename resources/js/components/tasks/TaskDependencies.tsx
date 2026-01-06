import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, ArrowRight, ArrowLeft, AlertCircle, Lock } from 'lucide-react';
import { Task } from '@/types';
import { toast } from '@/components/custom-toast';

interface Props {
    task: Task;
    availableTasks: Task[];
    canBeStarted: boolean;
    blockingDependencies: Task[];
    canManage: boolean;
    onUpdate: () => void;
}

export default function TaskDependencies({
    task,
    availableTasks,
    canBeStarted,
    blockingDependencies,
    canManage,
    onUpdate
}: Props) {
    const { t } = useTranslation();
    const [selectedTask, setSelectedTask] = useState<string>('');
    const [dependencyType, setDependencyType] = useState<string>('finish_to_start');

    const handleAddDependency = () => {
        if (!selectedTask) {
            toast.error(t('Please select a task'));
            return;
        }

        router.post(
            route('tasks.dependencies.add', task.id),
            {
                depends_on_task_id: selectedTask,
                dependency_type: dependencyType
            },
            {
                onSuccess: () => {
                    toast.success(t('Dependency added successfully'));
                    setSelectedTask('');
                    setDependencyType('finish_to_start');
                    onUpdate();
                },
                onError: (errors) => {
                    const errorMessage = errors.error || t('Failed to add dependency');
                    toast.error(errorMessage);
                }
            }
        );
    };

    const handleRemoveDependency = (dependencyId: number) => {
        router.delete(
            route('tasks.dependencies.remove', task.id),
            {
                data: { depends_on_task_id: dependencyId },
                onSuccess: () => {
                    toast.success(t('Dependency removed successfully'));
                    onUpdate();
                },
                onError: () => {
                    toast.error(t('Failed to remove dependency'));
                }
            }
        );
    };

    const dependencyTypes = [
        { value: 'finish_to_start', label: t('Finish to Start'), description: t('This task starts when dependency finishes') },
        { value: 'start_to_start', label: t('Start to Start'), description: t('Both tasks start together') },
        { value: 'finish_to_finish', label: t('Finish to Finish'), description: t('Both tasks finish together') },
        { value: 'start_to_finish', label: t('Start to Finish'), description: t('This task finishes when dependency starts') }
    ];

    const currentDependencies = task.depends_on_tasks || [];
    const dependentOnThis = task.dependent_tasks || [];

    // Filter out tasks that are already dependencies
    const availableForSelection = availableTasks.filter(
        t => !currentDependencies.some(dep => dep.id === t.id)
    );

    return (
        <div className="space-y-4">
            {/* Status Alert */}
            {!canBeStarted && blockingDependencies.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span>
                                {t('This task is blocked by')} {blockingDependencies.length}{' '}
                                {blockingDependencies.length === 1 ? t('incomplete dependency') : t('incomplete dependencies')}
                            </span>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Current Dependencies (This task depends on...) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {t('This task depends on')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {currentDependencies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('No dependencies')}</p>
                    ) : (
                        <div className="space-y-2">
                            {currentDependencies.map((dep: any) => {
                                const isBlocking = dep.progress < 100 && dep.pivot?.dependency_type === 'finish_to_start';
                                return (
                                    <div
                                        key={dep.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${
                                            isBlocking ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{dep.title}</span>
                                                {isBlocking && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {t('Blocking')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="text-xs">
                                                    {dependencyTypes.find(dt => dt.value === dep.pivot?.dependency_type)?.label || 'Finish to Start'}
                                                </Badge>
                                                <span>•</span>
                                                <span>{dep.progress}% {t('complete')}</span>
                                            </div>
                                        </div>
                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveDependency(dep.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Dependency */}
                    {canManage && availableForSelection.length > 0 && (
                        <div className="pt-3 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={selectedTask} onValueChange={setSelectedTask}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Select task')} />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {availableForSelection.map((t) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate">{t.title}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({t.progress}%)
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={dependencyType} onValueChange={setDependencyType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999]">
                                        {dependencyTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{type.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleAddDependency}
                                size="sm"
                                className="w-full"
                                disabled={!selectedTask}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('Add Dependency')}
                            </Button>
                        </div>
                    )}

                    {canManage && availableForSelection.length === 0 && currentDependencies.length > 0 && (
                        <p className="text-xs text-muted-foreground pt-3 border-t">
                            {t('No more tasks available to add as dependencies')}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Tasks that depend on this one */}
            {dependentOnThis.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            {t('Tasks that depend on this')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {dependentOnThis.map((dep: any) => (
                            <div key={dep.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="space-y-1">
                                    <div className="font-medium text-sm">{dep.title}</div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="text-xs">
                                            {dependencyTypes.find(dt => dt.value === dep.pivot?.dependency_type)?.label || 'Finish to Start'}
                                        </Badge>
                                        <span>•</span>
                                        <span>{dep.progress}% {t('complete')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
