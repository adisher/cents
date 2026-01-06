import { useEffect } from 'react';

import { usePage, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { ArrowLeft, Mail, Calendar, Briefcase, CheckCircle2, Clock } from 'lucide-react';

import { PageTemplate } from '@/components/page-template';

import { toast } from '@/components/custom-toast';

import { useTranslation } from 'react-i18next';



export default function ClientShow() {

    const { t } = useTranslation();

    const { auth, client, errors, flash } = usePage().props as any;

    const permissions = auth?.permissions || [];



    // Handle flash messages

    useEffect(() => {

        if (flash?.success) {

            toast.success(flash.success);

        }

        if (flash?.error) {

            toast.error(flash.error);

        }

    }, [flash]);



    const getInitials = (name: string) => {

        return name

            .split(' ')

            .map(word => word[0])

            .join('')

            .toUpperCase()

            .substring(0, 2);

    };



    const formatDate = (dateString: string | null) => {

        if (!dateString) return 'N/A';

        return new Date(dateString).toLocaleDateString('en-US', {

            year: 'numeric',

            month: 'long',

            day: 'numeric',

            hour: '2-digit',

            minute: '2-digit'

        });

    };



    const getStatusColor = (status: string) => {

        switch (status?.toLowerCase()) {

            case 'active':

                return 'bg-green-100 text-green-800 border-green-200';

            case 'inactive':

                return 'bg-gray-100 text-gray-800 border-gray-200';

            case 'suspended':

                return 'bg-red-100 text-red-800 border-red-200';

            default:

                return 'bg-gray-100 text-gray-800 border-gray-200';

        }

    };



    const getPriorityColor = (priority: string) => {

        switch (priority?.toLowerCase()) {

            case 'high':

                return 'bg-red-100 text-red-800 border-red-200';

            case 'medium':

                return 'bg-yellow-100 text-yellow-800 border-yellow-200';

            case 'low':

                return 'bg-blue-100 text-blue-800 border-blue-200';

            default:

                return 'bg-gray-100 text-gray-800 border-gray-200';

        }

    };



    const getProjectStatusColor = (status: string) => {

        switch (status?.toLowerCase()) {

            case 'in_progress':

                return 'bg-blue-100 text-blue-800 border-blue-200';

            case 'completed':

                return 'bg-green-100 text-green-800 border-green-200';

            case 'on_hold':

                return 'bg-yellow-100 text-yellow-800 border-yellow-200';

            case 'cancelled':

                return 'bg-red-100 text-red-800 border-red-200';

            default:

                return 'bg-gray-100 text-gray-800 border-gray-200';

        }

    };



    return (

        <PageTemplate

            title={client?.name || t('Client Details')}

            breadcrumbs={[

                { label: t('Dashboard'), href: route('dashboard') },

                { label: t('Clients'), href: route('clients.index') },

                { label: client?.name || t('Details'), href: '' }

            ]}

        >

            <div className="space-y-6">

                {/* Back Button */}

                <Link href={route('clients.index')}>

                    <Button variant="ghost" size="sm">

                        <ArrowLeft className="h-4 w-4 mr-2" />

                        {t('Back to Clients')}

                    </Button>

                </Link>



                {/* Client Profile Card */}

                <Card>

                    <CardContent className="pt-6">

                        <div className="flex flex-col md:flex-row gap-6">

                            <div className="flex justify-center md:justify-start">

                                <Avatar className="h-24 w-24">

                                    <AvatarImage src={client?.avatar} alt={client?.name} />

                                    <AvatarFallback className="text-2xl">

                                        {getInitials(client?.name || 'N/A')}

                                    </AvatarFallback>

                                </Avatar>

                            </div>



                            <div className="flex-1 space-y-4">

                                <div>

                                    <div className="flex items-center gap-3 mb-2">

                                        <h2 className="text-2xl font-bold">{client?.name}</h2>

                                        <Badge className={getStatusColor(client?.status)}>

                                            {client?.status}

                                        </Badge>

                                    </div>

                                </div>



                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="flex items-center gap-2 text-sm">

                                        <Mail className="h-4 w-4 text-gray-500" />

                                        <span className="text-gray-600">{t('Email')}:</span>

                                        <span className="font-medium">{client?.email}</span>

                                    </div>



                                    <div className="flex items-center gap-2 text-sm">

                                        <Briefcase className="h-4 w-4 text-gray-500" />

                                        <span className="text-gray-600">{t('Projects')}:</span>

                                        <span className="font-medium">{client?.projects_count || 0}</span>

                                    </div>



                                    {client?.joined_at && (

                                        <div className="flex items-center gap-2 text-sm">

                                            <Calendar className="h-4 w-4 text-gray-500" />

                                            <span className="text-gray-600">{t('Joined')}:</span>

                                            <span className="font-medium">{formatDate(client.joined_at)}</span>

                                        </div>

                                    )}



                                    {client?.email_verified_at && (

                                        <div className="flex items-center gap-2 text-sm">

                                            <CheckCircle2 className="h-4 w-4 text-green-500" />

                                            <span className="text-gray-600">{t('Email Verified')}:</span>

                                            <span className="font-medium">{formatDate(client.email_verified_at)}</span>

                                        </div>

                                    )}



                                    {client?.created_at && (

                                        <div className="flex items-center gap-2 text-sm">

                                            <Clock className="h-4 w-4 text-gray-500" />

                                            <span className="text-gray-600">{t('Member Since')}:</span>

                                            <span className="font-medium">{formatDate(client.created_at)}</span>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                    </CardContent>

                </Card>



                {/* Assigned Projects */}

                <Card>

                    <CardHeader>

                        <CardTitle>{t('Assigned Projects')}</CardTitle>

                    </CardHeader>

                    <CardContent>

                        {!client?.projects || client.projects.length === 0 ? (

                            <div className="text-center py-8">

                                <p className="text-gray-500">{t('No projects assigned to this client')}</p>

                            </div>

                        ) : (

                            <div className="space-y-4">

                                {client.projects.map((project: any) => (

                                    <div

                                        key={project.id}

                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"

                                    >

                                        <div className="flex-1">

                                            <div className="flex items-center gap-3 mb-2">

                                                <Link

                                                    href={route('projects.show', project.id)}

                                                    className="text-lg font-semibold hover:text-primary transition-colors"

                                                >

                                                    {project.name}

                                                </Link>

                                                <Badge className={getProjectStatusColor(project.status)}>

                                                    {project.status?.replace('_', ' ')}

                                                </Badge>

                                                {project.priority && (

                                                    <Badge className={getPriorityColor(project.priority)}>

                                                        {project.priority}

                                                    </Badge>

                                                )}

                                            </div>



                                            {project.description && (

                                                <p className="text-sm text-gray-600 line-clamp-2">

                                                    {project.description}

                                                </p>

                                            )}

                                        </div>



                                        <Link href={route('projects.show', project.id)}>

                                            <Button variant="ghost" size="sm">

                                                {t('View Project')}

                                            </Button>

                                        </Link>

                                    </div>

                                ))}

                            </div>

                        )}

                    </CardContent>

                </Card>

            </div>

        </PageTemplate>

    );

}