import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Client from './pages/Client'
import Product from './pages/Product'
import Cat_Managment from './pages/Cat_Managment'
import Subcat_Managment from './pages/Subcat_Managment'
import Sections_Managment from './pages/Sections_Managment'
import Estimate from './pages/Estimate'
import Add_Income from './pages/Add_Income'
import Expense from './pages/Expense'
import Bank from './pages/Bank'
import Report from './pages/Report'
import Preset from './pages/Preset'
import Estimate_Generation from './pages/Estimate_Generation'
import Register from './pages/Register'
import ClientDetails from './pages/ClientDetails'
import ClientManage from './pages/ClientManage'
import EstimateGenerationClient from './pages/EstimateGenerationClient'
import EstimatePreview from './pages/EstimatePreview'
import CompletedProjects from './pages/CompletedProjects'
import CompletedProjectDetails from './pages/CompletedProjectDetails'
import PdfTemplate from './pages/PdfTemplate'

// App Routes Component
const AppRoutes = () => {
  const { isInitialized, loading } = useAuth();

  // Show loading while auth is being initialized
  if (!isInitialized || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/client" element={
        <ProtectedRoute>
          <Client />
        </ProtectedRoute>
      } />
      <Route path="/client-manage" element={
        <ProtectedRoute>
          <ClientManage />
        </ProtectedRoute>
      } />
      <Route path='/product' element={
        <ProtectedRoute>
          <Product/>
        </ProtectedRoute>
      }/>
      <Route path='/cat_Managment' element={
        <ProtectedRoute>
          <Cat_Managment/>
        </ProtectedRoute>
      }/>
      <Route path='/subcat_Managment' element={
        <ProtectedRoute>
          <Subcat_Managment/>
        </ProtectedRoute>
      }/>
      <Route path='/sections_Managment' element={
        <ProtectedRoute>
          <Sections_Managment/>
        </ProtectedRoute>
      }/>
      <Route path='/estimate' element={
        <ProtectedRoute>
          <Estimate/>
        </ProtectedRoute>
      }/>
      <Route path='/additional-income' element={
        <ProtectedRoute>
          <Add_Income/>
        </ProtectedRoute>
      }/>
      <Route path='/expense' element={
        <ProtectedRoute>
          <Expense/>
        </ProtectedRoute>
      }/>
      <Route path='/bank' element={
        <ProtectedRoute>
          <Bank/>
        </ProtectedRoute>
      }/>
      <Route path='/report' element={
        <ProtectedRoute>
          <Report/>
        </ProtectedRoute>
      }/>
      <Route path='/preset' element={
        <ProtectedRoute>
          <Preset/>
        </ProtectedRoute>
      }/>
      <Route path='/estimate_generation' element={
        <ProtectedRoute>
          <Estimate_Generation/>
        </ProtectedRoute>
      }/>
      <Route path='/estimateGenerationClient/:id' element={
        <ProtectedRoute>
          <EstimateGenerationClient/>
        </ProtectedRoute>
      }/>
      <Route path='/client-details/:id' element={
        <ProtectedRoute>
          <ClientDetails/>
        </ProtectedRoute>
      }/>
      <Route path='/estimatePreview/:id' element={
        <ProtectedRoute>
          <EstimatePreview/>
        </ProtectedRoute>
      }/>
      <Route path='/completed-projects' element={
        <ProtectedRoute>
          <CompletedProjects/>
        </ProtectedRoute>
      }/>
      <Route path='/completed-project-details/:id' element={
        <ProtectedRoute>
          <CompletedProjectDetails/>
        </ProtectedRoute>
      }/>
      <Route path='/pdf-template' element={
        <ProtectedRoute>
          <PdfTemplate/>
        </ProtectedRoute>
      }/>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App