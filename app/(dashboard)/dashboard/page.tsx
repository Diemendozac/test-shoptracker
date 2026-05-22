'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { StatsCard } from '@/components/dashboard/stats-card'
import { StoreCard } from '@/components/dashboard/store-card'
import { Store, Target, TrendingUp, Activity } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'

export default function DashboardPage() {
  const { overviewItems, stats, isOverviewLoading } = useDashboard()

  const activeStores = overviewItems.length

  return (
    <PageLayout title="Overview" description="Your competitive intelligence at a glance">
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Stores"
          value={activeStores}
          icon={Store}
          variant="primary"
        />
        <StatsCard
          title="Tracking Candidates"
          value={stats.totalCandidates}
          icon={Target}
          variant="success"
        />
        <StatsCard
          title="Rising Products"
          value={stats.risingCandidates}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Avg. Performance"
          value={`${Math.round(stats.avgScore)}%`}
          icon={Activity}
          variant="warning"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Top Performers by Store</h2>
        <p className="text-sm text-muted-foreground">
          Best performing new products detected in each tracked store
        </p>
      </div>

      {isOverviewLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overviewItems.map((item) => (
            <StoreCard key={item.storeId} item={item} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
