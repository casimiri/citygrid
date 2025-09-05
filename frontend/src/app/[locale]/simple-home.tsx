export default function SimpleHome({ params }: { params: { locale: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-slate-800 via-blue-900 to-slate-900 bg-clip-text text-transparent">
            Welcome to{' '}
          </span>
          <span className="bg-gradient-to-r from-blue-700 to-teal-700 bg-clip-text text-transparent">
            CityGrid
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Locale: {params.locale}
        </p>
        <div className="space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
            Get Started
          </button>
          <button className="border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-lg">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}