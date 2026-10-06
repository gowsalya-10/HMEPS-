import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import Appointments from './pages/Appointments';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/new" element={<PatientForm />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          {/* We'll handle tabs inside PatientProfile for records, labs, vitals */}
          <Route path="/patients/:id/records" element={<PatientProfile tab="records" />} />
          <Route path="/patients/:id/labs" element={<PatientProfile tab="labs" />} />
          <Route path="/patients/:id/vitals" element={<PatientProfile tab="vitals" />} />
          
          <Route path="/appointments" element={<Appointments />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
