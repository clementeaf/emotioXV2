import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import Layout from '../Layout';

describe('Layout Component', () => {
  it('renders layout with children', () => {
    render(
      <Layout>
        <div>Layout content</div>
      </Layout>
    );
    
    expect(screen.getByText('Layout content')).toBeInTheDocument();
  });

  it('renders layout with default user', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('renders layout with custom user', () => {
    const customUser = {
      name: 'John Doe',
      initials: 'JD'
    };
    
    render(
      <Layout user={customUser}>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('has correct background color', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const container = document.querySelector('.flex.h-screen.p-4.gap-4');
    expect(container).toHaveStyle('background-color: rgb(241, 245, 249)');
  });

  it('has correct flex layout structure', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const container = document.querySelector('.flex.h-screen.p-4.gap-4');
    expect(container).toHaveClass('flex', 'h-screen', 'p-4', 'gap-4');
  });

  it('renders without children', () => {
    render(<Layout />);
    
    const container = document.querySelector('.flex.h-screen.p-4.gap-4');
    expect(container).toBeInTheDocument();
  });

  it('renders with undefined user', () => {
    render(
      <Layout user={undefined}>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('has proper layout hierarchy', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    // Check that the layout structure is correct
    const mainContainer = document.querySelector('.flex.h-screen.p-4.gap-4');
    expect(mainContainer).toBeInTheDocument();
    
    const flexContainer = mainContainer?.querySelector('.flex-1.flex.flex-col');
    expect(flexContainer).toBeInTheDocument();
    
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
    
    // Upbar doesn't have role="banner", it's just a div
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('passes user prop to Upbar', () => {
    const customUser = {
      name: 'Alice Smith',
      initials: 'AS'
    };
    
    render(
      <Layout user={customUser}>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
  });
});
