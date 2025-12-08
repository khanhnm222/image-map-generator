import { lazy, Suspense } from 'react'
import { LoadingOverlay } from './components'

const MapboxAIGeneratorPage = lazy(() => import('../../frontend/src/pages/MapboxAIGenerator/MapboxAIGenerator'))

function App() {

  return (
    <Suspense fallback={<LoadingOverlay />}>
      <MapboxAIGeneratorPage />
    </Suspense>
  )
}

export default App
