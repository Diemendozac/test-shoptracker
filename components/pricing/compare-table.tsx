import { Check } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PLAN_PRICES, PLAN_STORES, PRICE_CURRENCY, type PaidPlan } from '@/lib/pricing'
import { cn, formatCurrency } from '@/lib/utils'

// Tabla comparativa de /pricing. Es un <table> real que entra en 390 px sin scroll horizontal:
// son tres planes y los valores son cortos (✓, —, números). Con table-layout: fixed los anchos
// salen de la primera fila, por eso el ancho de la columna de nombres va en el primer <th>.
// "En preparación" ocupa Pro y Agency juntas: en una sola columna de celular se partía la palabra.
// Sin data-reveal: la fila de precios no espera a ninguna animación.

const CELL = 'border-b border-border px-1 py-2.5 text-center align-top break-words lg:px-4 lg:py-3'
const HEAD = 'bg-[color-mix(in_srgb,var(--background)_60%,var(--card))] text-[13px] leading-[1.3] font-semibold text-foreground'
const ROW = 'pl-3 text-left font-medium text-muted-foreground lg:pl-4'
const TXT = 'text-[13px] text-muted-foreground lg:text-sm'

export async function CompareTable() {
  const t = await getTranslations('Pricing')
  const yes = (
    <td className={CELL}>
      <Check aria-hidden="true" className="inline size-4 text-success-foreground" />
      <span className="sr-only">{t('compare.yes')}</span>
    </td>
  )
  const no = (
    <td className={cn(CELL, 'text-subtle-foreground')}>
      —<span className="sr-only">{t('compare.no')}</span>
    </td>
  )
  const price = (plan: PaidPlan) => (
    <td className={cn(CELL, TXT)}>
      <span className="block">{formatCurrency(PLAN_PRICES[plan].monthly, PRICE_CURRENCY)}</span>
      <span className="block">
        {t('compare.annualPrice', { price: formatCurrency(PLAN_PRICES[plan].annualMonthly, PRICE_CURRENCY) })}
      </span>
    </td>
  )

  return (
    <div className="mt-[22px] overflow-hidden rounded-[14px] border border-border bg-card">
      <table className="w-full table-fixed border-collapse text-sm lg:text-[15px]">
        <caption className="sr-only">{t('compare.caption')}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(CELL, HEAD, 'w-[36%] lg:w-[40%]')}>
              <span className="sr-only">{t('compare.feature')}</span>
            </th>
            <th scope="col" className={cn(CELL, HEAD)}>{t('plans.starter.name')}</th>
            <th scope="col" className={cn(CELL, HEAD)}>{t('plans.pro.name')}</th>
            <th scope="col" className={cn(CELL, HEAD)}>{t('plans.agency.name')}</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child>*]:border-b-0">
          <tr>
            <th scope="row" className={cn(CELL, ROW)}>{t('compare.price')}</th>
            {price('starter')}
            {price('pro')}
            <td className={cn(CELL, TXT)}>{t('compare.custom')}</td>
          </tr>
          <tr>
            <th scope="row" className={cn(CELL, ROW)}>{t('compare.stores')}</th>
            <td className={CELL}>{PLAN_STORES.starter}</td>
            <td className={CELL}>{PLAN_STORES.pro}</td>
            <td className={CELL}>{PLAN_STORES.agency}</td>
          </tr>
          <tr><th scope="row" className={cn(CELL, ROW)}>{t('compare.pool')}</th>{yes}{yes}{yes}</tr>
          <tr><th scope="row" className={cn(CELL, ROW)}>{t('compare.poolAds')}</th>{yes}{yes}{yes}</tr>
          <tr><th scope="row" className={cn(CELL, ROW)}>{t('compare.advertiser')}</th>{no}{yes}{yes}</tr>
          <tr><th scope="row" className={cn(CELL, ROW)}>{t('compare.library')}</th>{no}{yes}{yes}</tr>
          <tr><th scope="row" className={cn(CELL, ROW)}>{t('compare.alerts')}</th>{yes}{yes}{yes}</tr>
          <tr>
            <th scope="row" className={cn(CELL, ROW)}>{t('compare.privacy')}</th>
            <td className={cn(CELL, TXT)}>{t('compare.privacyStarter')}</td>
            <td colSpan={2} className={cn(CELL, TXT)}>{t('compare.privacySoon')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
