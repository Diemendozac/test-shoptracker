'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import { useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'

export default function PoolPage() {
  const { data, isLoading } = useGetPoolWinnersQuery()

  return (
    <PageLayout
      title="Pool de Testeos"
      description="Los productos con mayor momentum entre todos los usuarios del pool"
    >
      <PoolWinnersSection data={data} isLoading={isLoading} />
    </PageLayout>
  )
}
