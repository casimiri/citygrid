'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { locales } from '@/i18n'

const languageNames = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português'
}

const languageFlags = {
  ar: '🇸🇦',
  en: '🇺🇸',
  fr: '🇫🇷',
  es: '🇪🇸',
  pt: '🇵🇹'
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value
    // Remove the current locale from pathname if it exists
    const pathWithoutLocale = pathname.startsWith(`/${locale}`) 
      ? pathname.slice(`/${locale}`.length) || '/'
      : pathname
    
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={changeLanguage}
        className="appearance-none bg-white border border-slate-300 hover:border-blue-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        {locales.map((lang) => (
          <option key={lang} value={lang}>
            {languageFlags[lang as keyof typeof languageFlags]} {languageNames[lang as keyof typeof languageNames]}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}