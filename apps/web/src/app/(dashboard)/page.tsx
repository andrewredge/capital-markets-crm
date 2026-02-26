"use client"

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Handshake, Activity, Plus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { trpcClient } from '@/lib/trpc'
import { authClient } from '@/lib/auth-client'
import { DEAL_TYPES, ACTIVITY_TYPE_OPTIONS } from '@crm/shared'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { data: session } = authClient.useSession()
  const userName = session?.user?.name ?? 'there'

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => trpcClient.dashboard.getStats.query(),
    enabled: !!session?.session.activeOrganizationId,
  })

  const { data: recentDeals } = useQuery({
    queryKey: ['dashboard-recent-deals'],
    queryFn: () => trpcClient.dashboard.getRecentDeals.query(),
    enabled: !!session?.session.activeOrganizationId,
  })

  const { data: recentActivities } = useQuery({
    queryKey: ['dashboard-recent-activities'],
    queryFn: () => trpcClient.dashboard.getRecentActivities.query(),
    enabled: !!session?.session.activeOrganizationId,
  })

  const getDealTypeLabel = (type: string) =>
    DEAL_TYPES.find((t) => t.value === type)?.label ?? type

  const getActivityTypeLabel = (type: string) =>
    ACTIVITY_TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('welcomeBack', { name: userName })}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('contacts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.contacts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('companies')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.companies ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('deals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.deals ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recentDeals')}</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!recentDeals?.length ? (
              <p className="text-xs text-muted-foreground mt-2">
                {t('noDeals')}
              </p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">{getDealTypeLabel(deal.dealType)}</p>
                    </div>
                    {deal.ownerName && (
                      <Badge variant="outline" className="text-xs">{deal.ownerName}</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recentActivity')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!recentActivities?.length ? (
              <p className="text-xs text-muted-foreground mt-2">
                {t('noActivity')}
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-sm font-medium">{activity.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {getActivityTypeLabel(activity.activityType)}
                        {' · '}
                        {new Date(activity.occurredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section — only shown when empty */}
      {stats && stats.contacts === 0 && stats.companies === 0 && stats.deals === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{t('gettingStarted')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/contacts" className="group">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{t('addFirstContact')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/companies" className="group">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{t('createCompany')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/deals" className="group">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{t('setupPipeline')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
