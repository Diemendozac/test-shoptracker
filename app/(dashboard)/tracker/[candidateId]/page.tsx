import Link from 'next/link'
import { PageLayout } from '@/components/layout/page-layout'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { RankChart } from '@/components/tracker/rank-chart'
import { ScoreChart } from '@/components/tracker/score-chart'
import { mockCandidateDetail } from '@/lib/mock-data'
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  Target,
  Award,
  Clock,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function CandidateDetailPage() {
  const data = mockCandidateDetail
  const { candidate, summary, history } = data

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  return (
    <PageLayout title="Product Details" description="Deep dive into candidate performance">
      {/* Back Link */}
      <Link
        href="/tracker"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tracker
      </Link>

      {/* Header Card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Product Info */}
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl font-bold text-muted-foreground">
                {candidate.productTitle.charAt(0)}
              </div>
              <div>
                <h1 className="mb-1 text-2xl font-bold text-foreground">{candidate.productTitle}</h1>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    {candidate.productHandle}
                  </span>
                  <PerformanceBadge label={summary.performanceLabel} size="md" />
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(candidate.productPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    First seen: {formatDate(candidate.firstSeenDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Day {candidate.daysElapsed} of 30
                  </span>
                </div>
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex items-center gap-6">
              <ScoreRing score={summary.performanceScore} label={summary.performanceLabel} size="lg" />
              {candidate.productUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={candidate.productUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                    View Product
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Current Rank</span>
            </div>
            <p className="text-2xl font-bold text-foreground">#{summary.currentRank}</p>
          </div>
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Best Rank</span>
            </div>
            <p className="text-2xl font-bold text-rising">#{summary.bestRank}</p>
          </div>
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Growth</span>
            </div>
            <p className={`text-2xl font-bold ${summary.growthPct >= 0 ? 'text-rising' : 'text-declining'}`}>
              {summary.growthPct >= 0 ? '+' : ''}{Math.round(summary.growthPct * 100)}%
            </p>
          </div>
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Confidence</span>
            </div>
            <p className="text-2xl font-bold text-primary">{Math.round(summary.signalConfidence * 100)}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rank Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Rank Progression</h3>
              <p className="text-sm text-muted-foreground">Position in bestseller list over time</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Entry:</span>
              <span className="font-medium text-foreground">#{summary.entryRank}</span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-muted-foreground">Now:</span>
              <span className="font-medium text-rising">#{summary.currentRank}</span>
            </div>
          </div>
          <RankChart history={history} />
        </div>

        {/* Score Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Performance Score</h3>
              <p className="text-sm text-muted-foreground">Normalized performance over tracking window</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Peak:</span>
              <span className="font-medium text-rising">{Math.round(summary.peakGrowthPct * 100)}%</span>
            </div>
          </div>
          <ScoreChart history={history} />
        </div>
      </div>

      {/* History Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Tracking History</h3>
          <p className="text-sm text-muted-foreground">Daily snapshots from the observation window</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">In Bestseller</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Growth</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((entry) => (
                <tr key={entry.trackingDay} className="transition-colors hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">Day {entry.trackingDay}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.snapshotDate)}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.inBestseller ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rising/20 text-rising">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
                    {entry.bestsellerRank ? `#${entry.bestsellerRank}` : '-'}
                  </td>
                  <td className={`px-4 py-3 text-center text-sm font-medium ${entry.growthPct >= 0 ? 'text-rising' : 'text-declining'}`}>
                    {entry.growthPct >= 0 ? '+' : ''}{Math.round(entry.growthPct * 100)}%
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-primary">
                    {Math.round(entry.performanceScore * 100)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PerformanceBadge label={entry.performanceLabel} size="sm" showIcon={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
