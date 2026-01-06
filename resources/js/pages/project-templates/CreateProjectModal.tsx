import { useState, useEffect } from 'react';

import { router, usePage } from '@inertiajs/react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from '@/components/custom-toast';

import { useTranslation } from 'react-i18next';

import type { ProjectTemplate } from '@/types';

import { Rocket, Calendar, DollarSign, Users, CheckSquare } from 'lucide-react';



interface CreateProjectModalProps {

    isOpen: boolean;

    onClose: () => void;

    template: ProjectTemplate;

}



export default function CreateProjectModal({ isOpen, onClose, template }: CreateProjectModalProps) {

    const { t } = useTranslation();

    const { auth, members = [], clients = [], taskStages = [] } = usePage().props as any;



    const [formData, setFormData] = useState({

        title: template.name,

        description: template.description || '',

        status: template.default_status,

        priority: template.default_priority,

        start_date: '',

        deadline: '',

        estimated_hours: template.estimated_hours || '',

        budget: template.budget || '',

        is_public: false,

        member_ids: [] as number[],

        client_ids: [] as number[],

        task_stage_id: '',

    });



    const [isSubmitting, setIsSubmitting] = useState(false);



    // Reset form when modal opens

    useEffect(() => {

        if (isOpen) {

            setFormData({

                title: template.name,

                description: template.description || '',

                status: template.default_status,

                priority: template.default_priority,

                start_date: '',

                deadline: '',

                estimated_hours: template.estimated_hours || '',

                budget: template.budget || '',

                is_public: false,

                member_ids: [],

                client_ids: [],

                task_stage_id: '',

            });

        }

    }, [isOpen, template]);



    const handleChange = (field: string, value: any) => {

        setFormData(prev => ({ ...prev, [field]: value }));

    };



    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();

        setIsSubmitting(true);



        const submitData = {

            ...formData,

            estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours.toString()) : null,

            budget: formData.budget ? parseFloat(formData.budget.toString()) : null,

        };



        toast.loading('Creating project from template...');



        router.post(route('project-templates.create-project', template.id), submitData, {

            onSuccess: () => {

                toast.dismiss();

                toast.success('Project created successfully!');

                onClose();

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

                        toast.error('Failed to create project');

                    }

                }

            }

        });

    };



    return (

        <Dialog open={isOpen} onOpenChange={onClose}>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

                <DialogHeader>

                    <DialogTitle className="flex items-center gap-2">

                        <Rocket className="h-5 w-5 text-blue-600" />

                        {t('Create Project from Template')}

                    </DialogTitle>

                    <DialogDescription>

                        {t('Create a new project based on the')} "{template.name}" {t('template')}

                    </DialogDescription>

                </DialogHeader>



                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Template Info */}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">

                        <div className="font-medium text-blue-900">{t('Template Details')}</div>

                        <div className="grid grid-cols-2 gap-3 text-sm">

                            <div className="flex items-center gap-2">

                                <CheckSquare className="h-4 w-4 text-blue-600" />

                                <span className="text-gray-600">{template.taskTemplates?.length || 0} {t('tasks included')}</span>

                            </div>

                            {template.estimated_hours && (

                                <div className="flex items-center gap-2">

                                    <Calendar className="h-4 w-4 text-blue-600" />

                                    <span className="text-gray-600">{template.estimated_hours}h {t('estimated')}</span>

                                </div>

                            )}

                        </div>

                    </div>



                    {/* Project Title */}

                    <div className="space-y-2">

                        <Label htmlFor="title">{t('Project Title')} *</Label>

                        <Input

                            id="title"

                            value={formData.title}

                            onChange={(e) => handleChange('title', e.target.value)}

                            required

                            placeholder={t('Enter project title')}

                        />

                    </div>



                    {/* Description */}

                    <div className="space-y-2">

                        <Label htmlFor="description">{t('Description')}</Label>

                        <Textarea

                            id="description"

                            value={formData.description}

                            onChange={(e) => handleChange('description', e.target.value)}

                            placeholder={t('Enter project description')}

                            rows={3}

                        />

                    </div>



                    {/* Status and Priority */}

                    <div className="grid grid-cols-2 gap-4">

                        <div className="space-y-2">

                            <Label htmlFor="status">{t('Status')} *</Label>

                            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>

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

                            <Label htmlFor="priority">{t('Priority')} *</Label>

                            <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>

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

                    </div>



                    {/* Dates */}

                    <div className="grid grid-cols-2 gap-4">

                        <div className="space-y-2">

                            <Label htmlFor="start_date">{t('Start Date')}</Label>

                            <Input

                                id="start_date"

                                type="date"

                                value={formData.start_date}

                                onChange={(e) => handleChange('start_date', e.target.value)}

                            />

                        </div>



                        <div className="space-y-2">

                            <Label htmlFor="deadline">{t('Deadline')}</Label>

                            <Input

                                id="deadline"

                                type="date"

                                value={formData.deadline}

                                onChange={(e) => handleChange('deadline', e.target.value)}

                                min={formData.start_date || undefined}

                            />

                        </div>

                    </div>



                    {/* Budget and Hours */}

                    <div className="grid grid-cols-2 gap-4">

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

                            <Label htmlFor="budget">{t('Budget')} ($)</Label>

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

                    </div>



                    {/* Task Stage Selection */}

                    {taskStages && taskStages.length > 0 && (

                        <div className="space-y-2">

                            <Label htmlFor="task_stage_id">{t('Default Task Stage')}</Label>

                            <Select value={formData.task_stage_id} onValueChange={(value) => handleChange('task_stage_id', value)}>

                                <SelectTrigger>

                                    <SelectValue placeholder={t('Select a task stage (optional)')} />

                                </SelectTrigger>

                                <SelectContent>

                                    {taskStages.map((stage: any) => (

                                        <SelectItem key={stage.id} value={stage.id.toString()}>

                                            {stage.name}

                                        </SelectItem>

                                    ))}

                                </SelectContent>

                            </Select>

                        </div>

                    )}



                    <DialogFooter>

                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>

                            {t('Cancel')}

                        </Button>

                        <Button type="submit" disabled={isSubmitting}>

                            <Rocket className="h-4 w-4 mr-2" />

                            {isSubmitting ? t('Creating...') : t('Create Project')}

                        </Button>

                    </DialogFooter>

                </form>

            </DialogContent>

        </Dialog>

    );

}