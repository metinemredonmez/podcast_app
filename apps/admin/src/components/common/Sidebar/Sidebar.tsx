import { NavLink } from 'react-router-dom';
import { routes } from '../../../routes/routes.config';

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {routes.map((route) => (
            <li key={route.path}>
              <NavLink to={route.path}>{route.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
