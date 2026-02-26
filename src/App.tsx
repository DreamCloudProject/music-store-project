import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider } from './hooks/usePlayer'
import LoginPage from './pages/LoginPage'
import TracksPage from './pages/TracksPage'
import PlaylistPage from './pages/PlaylistPage'
import Layout from './components/Layout'

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false)

  if (!isAuthed) {
    return <LoginPage onLogin={() => setIsAuthed(true)} />
  }

  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/tracks" replace />} />
            <Route path="/tracks" element={<TracksPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PlayerProvider>
  )
}
