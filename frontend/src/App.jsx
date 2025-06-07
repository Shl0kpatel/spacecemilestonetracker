import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import Login from './Login'
import Register from './Register'
import ParentDashboard from './ParentDashboard'
import VolunteerDashboard from './VolunteerDashboard'
import MilestoneDisplay from './MilestoneDisplay'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        <Route path="/milestonesstatus" element={<MilestoneDisplay />} />
      </Routes>
    </div>
  )
}

export default App
