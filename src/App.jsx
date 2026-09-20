import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import ProtectedRoute from './components/ProtectedRoute.jsx'

import ChemistLanding from './pages/ChemistLanding.jsx'

import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'

import Dashboard from './pages/dashboard/Dashboard.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<ChemistLanding/>}/>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App