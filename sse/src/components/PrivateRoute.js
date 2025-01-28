import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  const location = useLocation(); // Get the current location

  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default PrivateRoute;
