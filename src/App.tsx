import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { FoldersPage } from '@/pages/Folders'
import { FolderDetail } from '@/pages/FolderDetail'
import { AllLinks } from '@/pages/AllLinks'
import { Favorites } from '@/pages/Favorites'
import { ArchivePage } from '@/pages/Archive'
import GettingStarted from '@/pages/GettingStarted'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/folders" element={<FoldersPage />} />
          <Route path="/folders/:id" element={<FolderDetail />} />
          <Route path="/links" element={<AllLinks />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/getting-started" element={<GettingStarted />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
