import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Store from './pages/Store';
import BookDetail from './pages/BookDetail';
import Wishlist from './pages/Wishlist';
import './App.css';

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  <Profile />
                </ProtectedLayout>
              }
            />
            <Route
              path="/store"
              element={
                <ProtectedLayout>
                  <Store />
                </ProtectedLayout>
              }
            />
            <Route
              path="/books/:id"
              element={
                <ProtectedLayout>
                  <BookDetail />
                </ProtectedLayout>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedLayout>
                  <Wishlist />
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<Navigate to="/store" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
