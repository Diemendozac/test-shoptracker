import { PageLayout } from '@/components/layout/page-layout'
import { mockUser } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { User, Mail, Bell, Shield, CreditCard, LogOut } from 'lucide-react'

export default function SettingsPage() {
  return (
    <PageLayout title="Settings" description="Manage your account and preferences">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <User className="h-4 w-4" />
              Profile
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                {mockUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{mockUser.email}</p>
                <p className="text-sm text-muted-foreground">User ID: {mockUser.userId.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="flex h-10 items-center rounded-lg border border-border bg-input px-3 text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {mockUser.email}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Plan</label>
                <div className="flex h-10 items-center rounded-lg border border-border bg-input px-3 text-sm">
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">Free</span>
                  <span className="ml-2 text-muted-foreground">50 stores limit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Bell className="h-4 w-4" />
              Notifications
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {[
              { label: 'Daily digest email', description: 'Receive a summary of top performers each day' },
              { label: 'Rising alerts', description: 'Get notified when a product starts trending' },
              { label: 'Weekly reports', description: 'Comprehensive weekly performance report' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <button
                  className="relative h-6 w-11 rounded-full bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="block h-5 w-5 translate-x-0.5 rounded-full bg-muted-foreground transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Shield className="h-4 w-4" />
              Security
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
              <Button variant="outline" size="sm">Update</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <CreditCard className="h-4 w-4" />
              Billing
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4">
              <div>
                <p className="font-semibold text-foreground">Upgrade to Pro</p>
                <p className="text-sm text-muted-foreground">Unlock unlimited stores and advanced features</p>
              </div>
              <Button>Upgrade</Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/30 bg-card">
          <div className="border-b border-destructive/30 p-4">
            <h2 className="flex items-center gap-2 font-semibold text-destructive">
              <LogOut className="h-4 w-4" />
              Danger Zone
            </h2>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
