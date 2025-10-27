import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
