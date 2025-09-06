'use client'

import { locales } from '@/i18n'

export default function SimpleLanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const languageNames = {
    ar: 'العربية',
    en: 'English', 
    fr: 'Français',
    es: 'Español',
    pt: 'Português',
    it: 'Italiano'
  }

  const languageFlags = {
    ar: '🇸🇦',
    en: '🇺🇸',
    fr: '🇫🇷',
    es: '🇪🇸', 
    pt: '🇵🇹',
    it: '🇮🇹'
  }

  return (
    <div className="relative">
      <select
        value={currentLocale}
        onChange={(e) => {
          const newLocale = e.target.value
          window.location.href = `/${newLocale}`
        }}
        className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-300/60 hover:border-blue-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
      >
        {locales.map((lang) => (
          <option key={lang} value={lang}>
            {languageFlags[lang as keyof typeof languageFlags]} {languageNames[lang as keyof typeof languageNames]}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}