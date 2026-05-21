'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import { useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'

export default function PoolPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useGetPoolWinnersQuery({ page, size: 20 })

  return (
    <PageLayout
      title="Pool de Testeos"
      description="Los productos con mayor momentum entre todos los usuarios del pool"
    >
      <PoolWinnersSection data={data} isLoading={isLoading} page={page} onPageChange={setPage} />
    </PageLayout>
  )
}
