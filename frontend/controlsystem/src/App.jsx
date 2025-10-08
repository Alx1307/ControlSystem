import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Header from './components/Layout/Header';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Objects from './components/Objects/Objects';
import Defects from './components/Defects/Defects';
import Employees from './components/Employees/Employees';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/" />;
};

const PublicLayout = ({ children }) => (
  <div>
    <Header />
    {children}
  </div>
);

const ProtectedLayout = ({ children }) => (
  <Layout>
    {children}
  </Layout>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <PublicLayout>
                  <Login />
                </PublicLayout>
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <PublicLayout>
                  <Register />
                </PublicLayout>
              </PublicRoute>
            } 
          />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/objects" />} />
                    <Route path="/objects" element={<Objects />} />
                    <Route path="/defects" element={<Defects />} />
                    <Route path="/employees" element={<Employees />} />
                  </Routes>
                </ProtectedLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;