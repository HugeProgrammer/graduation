import { useState, useEffect } from 'react';
import AdminPage from './Admin';
import InvitationPage from './Client';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentPath === '/admin') {
    return <AdminPage />;
  }

  return <InvitationPage />;
}