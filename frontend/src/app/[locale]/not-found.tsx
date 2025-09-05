import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-300 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Page non trouvée</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/fr">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Retourner à l'accueil
            </Button>
          </Link>
          
          <div className="mt-6">
            <Link href="/fr/login" className="text-blue-600 hover:text-blue-800 underline">
              Ou connectez-vous
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}