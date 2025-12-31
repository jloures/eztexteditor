import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { StoreSync } from './routes/StoreSync'
import './index.css'

function App() {
  return (
    <>
      <StoreSync />
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/:noteId" element={<MainLayout />} />
      </Routes>
    </>
  )
}

export default App
