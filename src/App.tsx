import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/auth/Login';
import TransportView from './pages/TransportView';
import NetworkDetailView from './pages/NetworkDetailView';
import LinesView from './pages/LinesView';
import LineDetailView from './pages/LineDetailView';
import AgencyImport from './pages/admin/AgencyImport';
import NetworkList from './pages/admin/NetworkList';
import NetworkImport from './pages/admin/NetworkImport';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Pages publiques */}
              <Route path="/" element={<TransportView />} />
              <Route path="/reseau/:name" element={<NetworkDetailView />} />
              <Route path="/reseau/:name/lignes" element={<LinesView />} />
              <Route path="/line/:lineId" element={<LineDetailView />} />
              
              {/* Routes d'administration protégées */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<NetworkList />} />
                <Route path="networks" element={<NetworkList />} />
                <Route path="networks/import" element={<NetworkImport />} />
                <Route path="agencies/import" element={<AgencyImport />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;