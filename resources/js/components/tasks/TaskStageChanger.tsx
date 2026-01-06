import React from 'react';
import { router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';
import { Task, TaskStage } from '@/types';

interface Props {
    task: Task;
    stages: TaskStage[];
    variant?: 'select' | 'badge';
    canBeStarted?: boolean;
    blockingDependencies?: Task[];
}

export default function TaskStageChanger({
    task,
    stages,
    variant = 'select',
    canBeStarted = true,
    blockingDependencies = []
}: Props) {
    const handleStageChange = (stageId: string) => {
        if (!canBeStarted) {
            return; // Don't allow change if dependencies aren't met
        }
        router.put(route('tasks.change-stage', task.id), {
            task_stage_id: stageId
        });
    };

    const currentStage = stages.find(s => s.id === task.task_stage_id);
    const isBlocked = !canBeStarted && blockingDependencies.length > 0;

    if (variant === 'badge') {
        return (
            <div className="flex items-center gap-2">
                <Badge
                    variant="outline"
                    style={{
                        backgroundColor: currentStage?.color + '20',
                        borderColor: currentStage?.color,
                        color: currentStage?.color
                    }}
                >
                    {currentStage?.name}
                </Badge>
                {isBlocked && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Lock className="h-4 w-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm">
                                    Blocked by {blockingDependencies.length} incomplete{' '}
                                    {blockingDependencies.length === 1 ? 'dependency' : 'dependencies'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        );
    }

    if (isBlocked) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="relative">
                            <Select
                                value={task.task_stage_id.toString()}
                                onValueChange={handleStageChange}
                                disabled={true}
                            >
                                <SelectTrigger className="opacity-60">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-destructive" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.map((stage) => (
                                        <SelectItem key={stage.id} value={stage.id.toString()}>
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: stage.color }}
                                                />
                                                <span>{stage.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="text-sm">
                            <p className="font-medium mb-1">
                                Status change blocked by {blockingDependencies.length}{' '}
                                {blockingDependencies.length === 1 ? 'dependency' : 'dependencies'}:
                            </p>
                            <ul className="list-disc list-inside">
                                {blockingDependencies.slice(0, 3).map((dep) => (
                                    <li key={dep.id}>{dep.title} ({dep.progress}%)</li>
                                ))}
                                {blockingDependencies.length > 3 && (
                                    <li>... and {blockingDependencies.length - 3} more</li>
                                )}
                            </ul>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Select value={task.task_stage_id.toString()} onValueChange={handleStageChange}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                        <div className="flex items-center space-x-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                            />
                            <span>{stage.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}