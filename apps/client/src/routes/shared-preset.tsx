import { createRoute } from '@tanstack/react-router';

import { SharedPresetPage } from '@/pages/shared-preset/ui/SharedPresetPage';

import { rootRoute } from './__root';

export const sharedPresetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shared/$token',
  component: () => {
    const { token } = sharedPresetRoute.useParams();
    return <SharedPresetPage token={token} />;
  },
});
