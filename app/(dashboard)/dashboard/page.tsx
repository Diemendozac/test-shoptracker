'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageLayout } from '@/components/layout/page-layout'
import { StatsCard } from '@/components/dashboard/stats-card'
import { StoreCard } from '@/components/dashboard/store-card'
import { Store, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import type { DashboardItem } from '@/lib/types'

const TEST_KEYWORDS = /prueba|test|scout|demo|ejemplo/i

function isTestProduct(title: string | undefined): boolean {
  return title ? TEST_KEYWORDS.test(title) : true
}

function sortByScore(items: DashboardItem[]): DashboardItem[] {
  return [...items]
    .filter(item => item.topCandidate && !isTestProduct(item.topCandidate.productTitle))
    .sort((a, b) => {
      const sa = a.topCandidate?.performanceScore ?? -1
      const sb = b.topCandidate?.performanceScore ?? -1
      return sb - sa
    })
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard')
  const { overviewItems, stats, isOverviewLoading } = useDashboard()
  const [expanded, setExpanded] = useState(false)

  const sorted = sortByScore(overviewItems)
  const visible = expanded ? sorted : sorted.slice(0, 3)
  const hasMore = sorted.length > 3

  return (
    <PageLayout title={t('title')} description={t('description')}>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatsCard
          title={t('stats.activeStores')}
          value={overviewItems.length}
          icon={Store}
          variant="primary"
        />
        <StatsCard
          title={t('stats.trackingCandidates')}
          value={stats.totalCandidates}
          icon={Target}
          variant="success"
        />
        <StatsCard
          title={t('stats.risingProducts')}
          value={stats.risingCandidates}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('topPerformers.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('topPerformers.subtitle')}
        </p>
      </div>

      {isOverviewLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <StoreCard key={item.storeId} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {expanded ? (
                  <><ChevronUp className="h-4 w-4" /> {t('seeLess')}</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> {t('seeMore', { count: sorted.length - 3 })}</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
