import { useState } from 'react';

import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Checkbox } from '@/components/ui/checkbox';

import { PageTemplate } from '@/components/page-template';

import { toast } from '@/components/custom-toast';

import { useTranslation } from 'react-i18next';

import { Plus, Trash2, ChevronUp, ChevronDown, FileStack, CheckSquare, GripVertical } from 'lucide-react';

import type { TaskTemplate, TaskChecklistTemplate } from '@/types';



export default function CreateTemplate() {

    const { t } = useTranslation();



    const [formData, setFormData] = useState({

        name: '',

        description: '',

        default_status: 'planning' as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled',

        default_priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',

        estimated_hours: '',

        budget: '',

        is_public: false,

        category: '',

    });



    const [tasks, setTasks] = useState<TaskTemplate[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);



    const handleChange = (field: string, value: any) => {

        setFormData(prev => ({ ...prev, [field]: value }));

    };



    const addTask = () => {

        const newTask: TaskTemplate = {

            title: '',

            description: '',

            priority: 'medium',

            task_type: 'member',

            estimated_days: 0,

            order: tasks.length,

            checklists: [],

        };

        setTasks([...tasks, newTask]);

    };



    const updateTask = (index: number, field: string, value: any) => {

        const updatedTasks = [...tasks];

        updatedTasks[index] = { ...updatedTasks[index], [field]: value };

        setTasks(updatedTasks);

    };



    const removeTask = (index: number) => {

        const updatedTasks = tasks.filter((_, i) => i !== index);

        // Reorder remaining tasks

        updatedTasks.forEach((task, i) => {

            task.order = i;

        });

        setTasks(updatedTasks);

    };



    const moveTask = (index: number, direction: 'up' | 'down') => {

        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= tasks.length) return;



        const updatedTasks = [...tasks];

        [updatedTasks[index], updatedTasks[newIndex]] = [updatedTasks[newIndex], updatedTasks[index]];



        // Update order values

        updatedTasks.forEach((task, i) => {

            task.order = i;

        });



        setTasks(updatedTasks);

    };



    const addChecklist = (taskIndex: number) => {

        const updatedTasks = [...tasks];

        const task = updatedTasks[taskIndex];

        const checklists = task.checklists || [];



        const newChecklist: TaskChecklistTemplate = {

            title: '',

            order: checklists.length,

            estimated_days: 0,

        };



        updatedTasks[taskIndex] = {

            ...task,

            checklists: [...checklists, newChecklist]

        };



        setTasks(updatedTasks);

    };



    const updateChecklist = (taskIndex: number, checklistIndex: number, field: string, value: any) => {

        const updatedTasks = [...tasks];

        const checklists = updatedTasks[taskIndex].checklists || [];

        checklists[checklistIndex] = { ...checklists[checklistIndex], [field]: value };

        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], checklists };

        setTasks(updatedTasks);

    };



    const removeChecklist = (taskIndex: number, checklistIndex: number) => {

        const updatedTasks = [...tasks];

        const checklists = (updatedTasks[taskIndex].checklists || []).filter((_, i) => i !== checklistIndex);

        // Reorder remaining checklists

        checklists.forEach((checklist, i) => {

            checklist.order = i;

        });

        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], checklists };

        setTasks(updatedTasks);

    };



    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();

        setIsSubmitting(true);



        const submitData = {

            ...formData,

            estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,

            budget: formData.budget ? parseFloat(formData.budget) : null,

            tasks: tasks.map(task => ({

                ...task,

                estimated_days: task.estimated_days || null,

                checklists: (task.checklists || []).map(checklist => ({

                    ...checklist,

                    estimated_days: checklist.estimated_days || null,

                }))

            })),

        };



        toast.loading('Creating template...');



        router.post(route('project-templates.store'), submitData, {

            onSuccess: () => {

                toast.dismiss();

                toast.success('Template created successfully!');

                setIsSubmitting(false);

            },

            onError: (errors) => {

                toast.dismiss();

                setIsSubmitting(false);

                if (errors?.error) {

                    toast.error(errors.error);

                } else {

                    const errorMessages = Object.values(errors).flat();

                    if (errorMessages.length > 0) {

                        toast.error(errorMessages[0] as string);

                    } else {

                        toast.error('Failed to create template');

                    }

                }

            }

        });

    };



    const breadcrumbs = [

        { title: t('Dashboard'), href: route('dashboard') },

        { title: t('Templates'), href: route('project-templates.index') },

        { title: t('Create Template') }

    ];



    return (

        <PageTemplate

            title={t('Create Project Template')}

            url="/project-templates/create"

            breadcrumbs={breadcrumbs}

        >

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Template Basic Info */}

                <Card>

                    <CardHeader>

                        <CardTitle>{t('Template Information')}</CardTitle>

                        <CardDescription>{t('Basic details about your project template')}</CardDescription>

                    </CardHeader>

                    <CardContent className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">

                            <div className="col-span-2 space-y-2">

                                <Label htmlFor="name">{t('Template Name')} *</Label>

                                <Input

                                    id="name"

                                    value={formData.name}

                                    onChange={(e) => handleChange('name', e.target.value)}

                                    required

                                    placeholder={t('e.g., Website Development Template')}

                                />

                            </div>



                            <div className="col-span-2 space-y-2">

                                <Label htmlFor="description">{t('Description')}</Label>

                                <Textarea

                                    id="description"

                                    value={formData.description}

                                    onChange={(e) => handleChange('description', e.target.value)}

                                    placeholder={t('Describe what this template is for')}

                                    rows={3}

                                />

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="category">{t('Category')}</Label>

                                <Input

                                    id="category"

                                    value={formData.category}

                                    onChange={(e) => handleChange('category', e.target.value)}

                                    placeholder={t('e.g., Development, Marketing')}

                                />

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="default_status">{t('Default Status')} *</Label>

                                <Select value={formData.default_status} onValueChange={(value) => handleChange('default_status', value)}>

                                    <SelectTrigger>

                                        <SelectValue />

                                    </SelectTrigger>

                                    <SelectContent>

                                        <SelectItem value="planning">{t('Planning')}</SelectItem>

                                        <SelectItem value="active">{t('Active')}</SelectItem>

                                        <SelectItem value="on_hold">{t('On Hold')}</SelectItem>

                                        <SelectItem value="completed">{t('Completed')}</SelectItem>

                                        <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>

                                    </SelectContent>

                                </Select>

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="default_priority">{t('Default Priority')} *</Label>

                                <Select value={formData.default_priority} onValueChange={(value) => handleChange('default_priority', value)}>

                                    <SelectTrigger>

                                        <SelectValue />

                                    </SelectTrigger>

                                    <SelectContent>

                                        <SelectItem value="low">{t('Low')}</SelectItem>

                                        <SelectItem value="medium">{t('Medium')}</SelectItem>

                                        <SelectItem value="high">{t('High')}</SelectItem>

                                        <SelectItem value="urgent">{t('Urgent')}</SelectItem>

                                    </SelectContent>

                                </Select>

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="estimated_hours">{t('Estimated Hours')}</Label>

                                <Input

                                    id="estimated_hours"

                                    type="number"

                                    min="0"

                                    value={formData.estimated_hours}

                                    onChange={(e) => handleChange('estimated_hours', e.target.value)}

                                    placeholder="0"

                                />

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="budget">{t('Default Budget')} ($)</Label>

                                <Input

                                    id="budget"

                                    type="number"

                                    min="0"

                                    step="0.01"

                                    value={formData.budget}

                                    onChange={(e) => handleChange('budget', e.target.value)}

                                    placeholder="0.00"

                                />

                            </div>



                            <div className="col-span-2 flex items-center space-x-2">

                                <Checkbox

                                    id="is_public"

                                    checked={formData.is_public}

                                    onCheckedChange={(checked) => handleChange('is_public', checked)}

                                />

                                <Label htmlFor="is_public" className="font-normal cursor-pointer">

                                    {t('Make this template public (accessible to other workspaces)')}

                                </Label>

                            </div>

                        </div>

                    </CardContent>

                </Card>



                {/* Tasks Section */}

                <Card>

                    <CardHeader>

                        <div className="flex items-center justify-between">

                            <div>

                                <CardTitle>{t('Tasks')}</CardTitle>

                                <CardDescription>{t('Add tasks that will be created with each project')}</CardDescription>

                            </div>

                            <Button type="button" onClick={addTask} variant="outline">

                                <Plus className="h-4 w-4 mr-2" />

                                {t('Add Task')}

                            </Button>

                        </div>

                    </CardHeader>

                    <CardContent className="space-y-4">

                        {tasks.length === 0 ? (

                            <div className="text-center py-8 text-gray-500">

                                <CheckSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />

                                <p>{t('No tasks added yet')}</p>

                                <p className="text-sm">{t('Click "Add Task" to create your first task')}</p>

                            </div>

                        ) : (

                            tasks.map((task, taskIndex) => (

                                <Card key={taskIndex} className="border-2">

                                    <CardHeader className="pb-3">

                                        <div className="flex items-start gap-3">

                                            <div className="flex flex-col gap-1 mt-2">

                                                <Button

                                                    type="button"

                                                    variant="ghost"

                                                    size="sm"

                                                    onClick={() => moveTask(taskIndex, 'up')}

                                                    disabled={taskIndex === 0}

                                                    className="h-6 w-6 p-0"

                                                >

                                                    <ChevronUp className="h-4 w-4" />

                                                </Button>

                                                <Button

                                                    type="button"

                                                    variant="ghost"

                                                    size="sm"

                                                    onClick={() => moveTask(taskIndex, 'down')}

                                                    disabled={taskIndex === tasks.length - 1}

                                                    className="h-6 w-6 p-0"

                                                >

                                                    <ChevronDown className="h-4 w-4" />

                                                </Button>

                                            </div>

                                            <div className="flex-1 space-y-3">

                                                <div className="flex items-center justify-between">

                                                    <Badge variant="outline">

                                                        {t('Task')} {taskIndex + 1}

                                                    </Badge>

                                                    <Button

                                                        type="button"

                                                        variant="ghost"

                                                        size="sm"

                                                        onClick={() => removeTask(taskIndex)}

                                                        className="text-red-600 hover:text-red-700"

                                                    >

                                                        <Trash2 className="h-4 w-4" />

                                                    </Button>

                                                </div>



                                                <div className="space-y-2">

                                                    <Label>{t('Task Title')} *</Label>

                                                    <Input

                                                        value={task.title}

                                                        onChange={(e) => updateTask(taskIndex, 'title', e.target.value)}

                                                        required

                                                        placeholder={t('Enter task title')}

                                                    />

                                                </div>



                                                <div className="space-y-2">

                                                    <Label>{t('Description')}</Label>

                                                    <Textarea

                                                        value={task.description}

                                                        onChange={(e) => updateTask(taskIndex, 'description', e.target.value)}

                                                        placeholder={t('Enter task description')}

                                                        rows={2}

                                                    />

                                                </div>



                                                <div className="grid grid-cols-3 gap-3">

                                                    <div className="space-y-2">

                                                        <Label>{t('Priority')} *</Label>

                                                        <Select

                                                            value={task.priority}

                                                            onValueChange={(value) => updateTask(taskIndex, 'priority', value)}

                                                        >

                                                            <SelectTrigger>

                                                                <SelectValue />

                                                            </SelectTrigger>

                                                            <SelectContent>

                                                                <SelectItem value="low">{t('Low')}</SelectItem>

                                                                <SelectItem value="medium">{t('Medium')}</SelectItem>

                                                                <SelectItem value="high">{t('High')}</SelectItem>

                                                                <SelectItem value="critical">{t('Critical')}</SelectItem>

                                                            </SelectContent>

                                                        </Select>

                                                    </div>

                                                    <div className="space-y-2">

                                                        <Label>{t('Task Type')} *</Label>

                                                        <Select

                                                            value={task.task_type}

                                                            onValueChange={(value) => updateTask(taskIndex, 'task_type', value)}

                                                        >

                                                            <SelectTrigger>

                                                                <SelectValue />

                                                            </SelectTrigger>

                                                            <SelectContent>

                                                                <SelectItem value="member">{t('Member Task')}</SelectItem>

                                                                <SelectItem value="client">{t('Client Task')}</SelectItem>

                                                            </SelectContent>

                                                        </Select>

                                                    </div>



                                                    <div className="space-y-2">

                                                        <Label>{t('Estimated Days')}</Label>

                                                        <Input

                                                            type="number"

                                                            min="0"

                                                            value={task.estimated_days || ''}

                                                            onChange={(e) => updateTask(taskIndex, 'estimated_days', e.target.value ? parseInt(e.target.value) : 0)}

                                                            placeholder="0"

                                                        />

                                                    </div>

                                                </div>



                                                {/* Checklists */}

                                                <div className="mt-4 space-y-2">

                                                    <div className="flex items-center justify-between">

                                                        <Label className="text-sm font-medium">{t('Checklists')}</Label>

                                                        <Button

                                                            type="button"

                                                            onClick={() => addChecklist(taskIndex)}

                                                            variant="outline"

                                                            size="sm"

                                                        >

                                                            <Plus className="h-3 w-3 mr-1" />

                                                            {t('Add Checklist')}

                                                        </Button>

                                                    </div>



                                                    {task.checklists && task.checklists.length > 0 && (

                                                        <div className="space-y-2 pl-4 border-l-2">

                                                            {task.checklists.map((checklist, checklistIndex) => (

                                                                <div key={checklistIndex} className="flex items-center gap-2 bg-gray-50 p-2 rounded">

                                                                    <Input

                                                                        value={checklist.title}

                                                                        onChange={(e) => updateChecklist(taskIndex, checklistIndex, 'title', e.target.value)}

                                                                        placeholder={t('Checklist item')}

                                                                        className="flex-1"

                                                                        required

                                                                    />

                                                                    <Input

                                                                        type="number"

                                                                        min="0"

                                                                        value={checklist.estimated_days || ''}

                                                                        onChange={(e) => updateChecklist(taskIndex, checklistIndex, 'estimated_days', e.target.value ? parseInt(e.target.value) : 0)}

                                                                        placeholder={t('Days')}

                                                                        className="w-20"

                                                                    />

                                                                    <Button

                                                                        type="button"

                                                                        variant="ghost"

                                                                        size="sm"

                                                                        onClick={() => removeChecklist(taskIndex, checklistIndex)}

                                                                        className="text-red-600"

                                                                    >

                                                                        <Trash2 className="h-4 w-4" />

                                                                    </Button>

                                                                </div>

                                                            ))}

                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    </CardHeader>

                                </Card>

                            ))

                        )}

                    </CardContent>

                </Card>



                {/* Submit Buttons */}

                <div className="flex justify-end gap-3">

                    <Button

                        type="button"

                        variant="outline"

                        onClick={() => router.get(route('project-templates.index'))}

                        disabled={isSubmitting}

                    >

                        {t('Cancel')}

                    </Button>

                    <Button type="submit" disabled={isSubmitting}>

                        <FileStack className="h-4 w-4 mr-2" />

                        {isSubmitting ? t('Creating...') : t('Create Template')}

                    </Button>

                </div>

            </form>

        </PageTemplate>

    );

}