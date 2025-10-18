import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import Upbar from '../Upbar';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock auth store
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      initials: 'TU',
      avatar: undefined
    },
    clearAuth: vi.fn(),
  }),
}));

describe('Upbar Component', () => {
  it('renders upbar with user info', () => {
    render(<Upbar />);
    
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('has logout button', () => {
    render(<Upbar />);
    
    const logoutButton = screen.getByText(/cerrar sesión/i);
    expect(logoutButton).toBeInTheDocument();
  });

  it('renders with Card wrapper', () => {
    render(<Upbar />);
    
    // Find the Card wrapper by looking for the outermost div with bg-white
    const cardWrapper = document.querySelector('.bg-white.rounded-2xl');
    expect(cardWrapper).toBeInTheDocument();
    expect(cardWrapper).toHaveClass('bg-white', 'rounded-2xl');
  });

  it('has proper layout structure', () => {
    render(<Upbar />);
    
    // Find the main flex container
    const flexContainer = document.querySelector('.flex.items-center.justify-between');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('shows user initials in avatar', () => {
    render(<Upbar />);
    
    expect(screen.getByText('CA')).toBeInTheDocument();
  });
});
