import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider, useSupabaseAuth } from './integrations/supabase/auth';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import CustomerDashboard from './pages/CustomerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SalesDashboard from './pages/SalesDashboard';
import SupplementSpecialistDashboard from './pages/SupplementSpecialistDashboard';
import ProjectManagerDashboard from './pages/ProjectManagerDashboard';
import InspectionScheduling from './pages/InspectionScheduling';
import InspectionReport from './pages/InspectionReport';
import InstallationTracking from './pages/InstallationTracking';
import FindLeads from './pages/FindLeads';
import Contacts from './pages/Contacts';
import SupplementTracking from './pages/SupplementTracking';
import Tasks from './pages/Tasks';
import InsuranceMortgageTracker from './pages/InsuranceMortgageTracker';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, userRole, loading } = useSupabaseAuth();

  if (loading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SupabaseAuthProvider>
          <BrowserRouter>
            <div className="flex h-screen bg-gray-100">
              <Navigation />
              <main className="flex-1 overflow-y-auto p-8">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        {({ userRole }) => {
                          if (userRole === 'admin') return <AdminDashboard />;
                          if (userRole === 'sales') return <SalesDashboard />;
                          if (userRole === 'supplement_specialist') return <SupplementSpecialistDashboard />;
                          if (userRole === 'project_manager') return <ProjectManagerDashboard />;
                          if (userRole === 'employee') return <EmployeeDashboard />;
                          return <CustomerDashboard />;
                        }}
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/inspection-scheduling" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><InspectionScheduling /></ProtectedRoute>} />
                  <Route path="/inspection-report" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><InspectionReport /></ProtectedRoute>} />
                  <Route path="/installation-tracking" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><InstallationTracking /></ProtectedRoute>} />
                  <Route path="/find-leads" element={<ProtectedRoute allowedRoles={['admin']}><FindLeads /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><Contacts /></ProtectedRoute>} />
                  <Route path="/supplement-tracking" element={<ProtectedRoute allowedRoles={['admin', 'employee', 'supplement_specialist']}><SupplementTracking /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><Tasks /></ProtectedRoute>} />
                  <Route path="/insurance-mortgage-tracker" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><InsuranceMortgageTracker /></ProtectedRoute>} />
                  <Route path="/project-manager" element={<ProtectedRoute allowedRoles={['admin', 'project_manager']}><ProjectManagerDashboard /></ProtectedRoute>} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </SupabaseAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
