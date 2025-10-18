import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../test/utils';
import Sidebar from '../Sidebar';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

// Mock the auth store
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      initials: 'TU',
      avatar: undefined
    },
  }),
}));

describe('Sidebar Component', () => {
  const mockOnToggle = vi.fn();

  it('renders sidebar with default props (expanded)', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('← Comprimir')).toBeInTheDocument(); // Toggle button text
  });

  it('renders sidebar when collapsed', () => {
    render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);
    
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument(); // Toggle button text
  });

  it('renders sidebar when expanded', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('← Comprimir')).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    
    const toggleButton = screen.getByRole('button', { name: /comprimir sidebar/i });
    await user.click(toggleButton);
    
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('shows correct toggle button text when collapsed', () => {
    render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('shows correct toggle button text when expanded', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('← Comprimir')).toBeInTheDocument();
  });

  it('has correct aria-label for toggle button', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByRole('button', { name: /comprimir sidebar/i })).toBeInTheDocument();
  });

  it('has correct aria-label when expanded', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
  });

  it('shows active state for current route', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    // The link should have active classes since we're on /dashboard route
    expect(dashboardLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('has correct icon for dashboard', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders with Card wrapper', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    const cardWrapper = document.querySelector('.bg-white.rounded-2xl');
    expect(cardWrapper).toBeInTheDocument();
    expect(cardWrapper).toHaveClass('bg-white', 'rounded-2xl');
  });

  it('has transition classes', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    const cardWrapper = document.querySelector('.bg-white.rounded-2xl');
    expect(cardWrapper).toHaveClass('transition-all', 'duration-300');
  });

  it('hides navigation text when collapsed', () => {
    render(<Sidebar isCollapsed={true} onToggle={mockOnToggle} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows navigation text when expanded', () => {
    render(<Sidebar isCollapsed={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
