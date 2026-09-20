import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import ProtectedRoute from './components/ProtectedRoute.jsx'

import ChemistLanding from './pages/ChemistLanding.jsx'

import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'

import DashboardLayout from './pages/dashboard/DashboardLayout.jsx'
import Overview from './pages/dashboard/Overview.jsx'
import Profile from './pages/dashboard/Profile.jsx'

import Medicines from './pages/dashboard/modules/Medicines.jsx'
import Inventory from './pages/dashboard/modules/Inventory.jsx'
import Suppliers from './pages/dashboard/modules/Suppliers.jsx'
import Purchases from './pages/dashboard/modules/Purchases.jsx'
import Orders from './pages/dashboard/modules/Orders.jsx'
import Payments from './pages/dashboard/modules/Payments.jsx'
import Deliveries from './pages/dashboard/modules/Deliveries.jsx'
import Pos from './pages/dashboard/modules/Pos.jsx'
import Invoices from './pages/dashboard/modules/Invoices.jsx'
import Prescriptions from './pages/dashboard/modules/Prescriptions.jsx'
import Quotations from './pages/dashboard/modules/Quotations.jsx'
import Notifications from './pages/dashboard/modules/Notifications.jsx'

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
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="medicines" element={<Medicines />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payments" element={<Payments />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="pos" element={<Pos />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App