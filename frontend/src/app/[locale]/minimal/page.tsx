export default function MinimalPage({ params }: { params: { locale: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Minimal Page Works!</h1>
        <p className="mt-4">Locale: {params.locale}</p>
      </div>
    </div>
  )
}