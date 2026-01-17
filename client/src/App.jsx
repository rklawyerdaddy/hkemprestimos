import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Loans from './pages/Loans';
import Transactions from './pages/Transactions';
import Partners from './pages/Partners';
import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;
    if (role !== 'ADMIN') return <Navigate to="/" />;

    return children;
};

import Calendar from './pages/Calendar';
import { ToastProvider } from './contexts/ToastContext';

import Overdue from './pages/Overdue';

function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
                    <Route path="/loans" element={<PrivateRoute><Loans /></PrivateRoute>} />
                    <Route path="/overdue" element={<PrivateRoute><Overdue /></PrivateRoute>} />
                    <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
                    <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
                    <Route path="/partners" element={<PrivateRoute><Partners /></PrivateRoute>} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
