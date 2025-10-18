import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { AllTheProviders } from './test-providers';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  withRouter?: boolean;
  withErrorBoundary?: boolean;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    queryClient,
    withRouter = true,
    withErrorBoundary = true,
    ...renderOptions
  } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        queryClient={queryClient}
        withRouter={withRouter}
        withErrorBoundary={withErrorBoundary}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export specific items to avoid Fast Refresh issues
export { 
  screen, 
  fireEvent, 
  waitFor, 
  act,
  cleanup,
  renderHook,
  waitForElementToBeRemoved
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render method
export { customRender as render };
