import { AppProviders } from './providers';
import { AppRoutes } from '../routes';

export const App = () => {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};
