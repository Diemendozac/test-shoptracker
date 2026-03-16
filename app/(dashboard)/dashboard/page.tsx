'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { StatsCard } from '@/components/dashboard/stats-card'
import { StoreCard } from '@/components/dashboard/store-card'
import { mockDashboard, mockStores, mockTrackerCandidates } from '@/lib/mock-data'
import { Store, Target, TrendingUp, Activity } from 'lucide-react'

export default function DashboardPage() {
  const activeStores = mockStores.filter((s) => s.isActive).length
  const totalCandidates = mockTrackerCandidates.length
  const risingCandidates = mockTrackerCandidates.filter(
    (c) => c.performanceLabel === 'Rising'
  ).length
  const avgScore =
    mockTrackerCandidates.reduce((acc, c) => acc + c.performanceScore, 0) /
    mockTrackerCandidates.length

  return (
    <PageLayout title="Overview" description="Your competitive intelligence at a glance">
      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Stores"
          value={activeStores}
          change={12}
          changeLabel="vs last month"
          icon={Store}
          variant="primary"
        />
        <StatsCard
          title="Tracking Candidates"
          value={totalCandidates}
          change={23}
          changeLabel="vs last week"
          icon={Target}
          variant="success"
        />
        <StatsCard
          title="Rising Products"
          value={risingCandidates}
          change={45}
          changeLabel="vs yesterday"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Avg. Performance"
          value={`${Math.round(avgScore * 100)}%`}
          change={8}
          changeLabel="vs last week"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Top Performers by Store</h2>
        <p className="text-sm text-muted-foreground">
          Best performing new products detected in each tracked store
        </p>
      </div>

      {/* Store Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockDashboard.map((item) => (
          <StoreCard key={item.storeId} item={item} />
        ))}
      </div>
    </PageLayout>
  )
}
