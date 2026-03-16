'use client'

import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'

interface PageLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 pl-64">
        <AppHeader title={title} description={description} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
