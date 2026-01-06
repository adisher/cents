import { useState, useEffect } from 'react';

import { router, usePage, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Search, Eye, Mail, Calendar, Briefcase } from 'lucide-react';

import { PageTemplate } from '@/components/page-template';

import { toast } from '@/components/custom-toast';

import { hasPermission } from '@/utils/authorization';

import { useTranslation } from 'react-i18next';



export default function ClientIndex() {

    const { t } = useTranslation();

    const { auth, clients, filters: pageFilters = {}, errors, flash } = usePage().props as any;

    const permissions = auth?.permissions || [];



    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');



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

        const params: any = {};

        if (searchTerm) params.search = searchTerm;

        router.get(route('clients.index'), params, { preserveState: false, preserveScroll: false });

    };



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

            month: 'short',

            day: 'numeric'

        });

    };



    return (

        <PageTemplate

            title={t('Clients')}

            breadcrumbs={[

                { label: t('Dashboard'), href: route('dashboard') },

                { label: t('Clients'), href: route('clients.index') }

            ]}

        >

            <div className="space-y-6">

                {/* Header with Search */}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">

                    <div className="flex-1 w-full sm:w-auto">

                        <form onSubmit={handleSearch} className="relative">

                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                            <Input

                                type="text"

                                placeholder={t('Search clients by name or email...')}

                                value={searchTerm}

                                onChange={(e) => setSearchTerm(e.target.value)}

                                className="pl-10 w-full"

                            />

                        </form>

                    </div>

                </div>



                {/* Stats Cards */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <Card>

                        <CardHeader className="pb-3">

                            <CardTitle className="text-sm font-medium text-gray-600">{t('Total Clients')}</CardTitle>

                        </CardHeader>

                        <CardContent>

                            <div className="text-3xl font-bold">{clients?.length || 0}</div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader className="pb-3">

                            <CardTitle className="text-sm font-medium text-gray-600">{t('Active Clients')}</CardTitle>

                        </CardHeader>

                        <CardContent>

                            <div className="text-3xl font-bold">

                                {clients?.filter((c: any) => c.status === 'active').length || 0}

                            </div>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardHeader className="pb-3">

                            <CardTitle className="text-sm font-medium text-gray-600">{t('Projects Assigned')}</CardTitle>

                        </CardHeader>

                        <CardContent>

                            <div className="text-3xl font-bold">

                                {clients?.reduce((sum: number, c: any) => sum + (c.projects_count || 0), 0) || 0}

                            </div>

                        </CardContent>

                    </Card>

                </div>



                {/* Clients List */}

                <Card>

                    <CardHeader>

                        <CardTitle>{t('All Clients')}</CardTitle>

                    </CardHeader>

                    <CardContent>

                        {!clients || clients.length === 0 ? (

                            <div className="text-center py-12">

                                <p className="text-gray-500">{t('No clients found')}</p>

                            </div>

                        ) : (

                            <div className="space-y-4">

                                {clients.map((client: any) => (

                                    <div

                                        key={client.id}

                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"

                                    >

                                        <div className="flex items-center space-x-4 flex-1">

                                            <Avatar className="h-12 w-12">

                                                <AvatarImage src={client.avatar} alt={client.name} />

                                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>

                                            </Avatar>



                                            <div className="flex-1 min-w-0">

                                                <div className="flex items-center gap-2 mb-1">

                                                    <h3 className="text-sm font-semibold truncate">

                                                        {client.name}

                                                    </h3>

                                                    <Badge

                                                        variant={client.status === 'active' ? 'default' : 'secondary'}

                                                        className="text-xs"

                                                    >

                                                        {client.status}

                                                    </Badge>

                                                </div>



                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">

                                                    <div className="flex items-center gap-1">

                                                        <Mail className="h-3 w-3" />

                                                        <span className="truncate">{client.email}</span>

                                                    </div>



                                                    <div className="flex items-center gap-1">

                                                        <Briefcase className="h-3 w-3" />

                                                        <span>{client.projects_count} {t('Projects')}</span>

                                                    </div>



                                                    {client.joined_at && (

                                                        <div className="flex items-center gap-1">

                                                            <Calendar className="h-3 w-3" />

                                                            <span>{t('Joined')}: {formatDate(client.joined_at)}</span>

                                                        </div>

                                                    )}

                                                </div>



                                                {/* Display assigned projects */}

                                                {client.projects && client.projects.length > 0 && (

                                                    <div className="mt-2 flex flex-wrap gap-1">

                                                        {client.projects.slice(0, 3).map((project: any) => (

                                                            <Badge

                                                                key={project.id}

                                                                variant="outline"

                                                                className="text-xs"

                                                            >

                                                                {project.name}

                                                            </Badge>

                                                        ))}

                                                        {client.projects.length > 3 && (

                                                            <Badge variant="outline" className="text-xs">

                                                                +{client.projects.length - 3} {t('more')}

                                                            </Badge>

                                                        )}

                                                    </div>

                                                )}

                                            </div>

                                        </div>



                                        {/* Actions */}

                                        <div className="flex items-center gap-2">

                                            {hasPermission(permissions, 'client_view') && (

                                                <Link href={route('clients.show', client.id)}>

                                                    <Button

                                                        variant="ghost"

                                                        size="sm"

                                                        className="h-8 w-8 p-0"

                                                    >

                                                        <Eye className="h-4 w-4" />

                                                    </Button>

                                                </Link>

                                            )}

                                        </div>

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