import { locales } from '@/i18n'

export function generateStaticParams() {
  return locales.map((locale) => ({locale}))
}

export default function SimpleTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">Simple Test Page Works!</h1>
    </div>
  )
}