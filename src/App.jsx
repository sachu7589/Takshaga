import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Client from './pages/Client'
import Product from './pages/Product'
import Prod_Managment from './pages/Prod_Managment'
import Cat_Managment from './pages/Cat_Managment'
import Estimate from './pages/Estimate'
import Add_Income from './pages/Add_Income'
import Expense from './pages/Expense'
import Report from './pages/Report'
import Preset from './pages/Preset'
import Estimate_Generation from './pages/Estimate_Generation'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/client" element={<Client />} />
        <Route path='/product' element={<Product/>}/>
        <Route path='/prod_Managment' element={<Prod_Managment/>}/>
        <Route path='/cat_Managment' element={<Cat_Managment/>}/>
        <Route path='/estimate' element={<Estimate/>}/>
        <Route path='/additional-income' element={<Add_Income/>}/>
        <Route path='/expense' element={<Expense/>}/>
        <Route path='/report' element={<Report/>}/>
        <Route path='/preset' element={<Preset/>}/>
        <Route path='/estimate_generation' element={<Estimate_Generation/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App