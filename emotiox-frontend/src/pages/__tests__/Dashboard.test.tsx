import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import Dashboard from '../Dashboard';

describe('Dashboard Page', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders all dashboard cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Estadísticas')).toBeInTheDocument();
    expect(screen.getByText('Vista general de métricas')).toBeInTheDocument();
    expect(screen.getByText('Progreso')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento de objetivos')).toBeInTheDocument();
    expect(screen.getByText('Actividad')).toBeInTheDocument();
    expect(screen.getByText('Últimas acciones')).toBeInTheDocument();
  });

  it('has correct title styling', () => {
    render(<Dashboard />);

    const title = screen.getByText('Dashboard');
    expect(title).toHaveClass('text-3xl', 'font-bold', 'text-gray-800');
  });

  it('has grid layout for cards', () => {
    render(<Dashboard />);

    const grid = screen.getByText('Estadísticas').closest('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('renders estadísticas card with correct styling', () => {
    render(<Dashboard />);

    const card = screen.getByText('Estadísticas').closest('div');
    expect(card).toHaveClass('bg-blue-50', 'p-6', 'rounded-lg');
  });

  it('renders progreso card with correct styling', () => {
    render(<Dashboard />);

    const card = screen.getByText('Progreso').closest('div');
    expect(card).toHaveClass('bg-green-50', 'p-6', 'rounded-lg');
  });

  it('renders actividad card with correct styling', () => {
    render(<Dashboard />);

    const card = screen.getByText('Actividad').closest('div');
    expect(card).toHaveClass('bg-purple-50', 'p-6', 'rounded-lg');
  });

  it('has correct card title styling', () => {
    render(<Dashboard />);

    const estadisticasTitle = screen.getByText('Estadísticas');
    expect(estadisticasTitle).toHaveClass('text-lg', 'font-semibold', 'text-blue-800', 'mb-2');
  });

  it('has correct card description styling', () => {
    render(<Dashboard />);

    const description = screen.getByText('Vista general de métricas');
    expect(description).toHaveClass('text-blue-600');
  });

  it('has correct spacing in container', () => {
    render(<Dashboard />);

    const container = screen.getByText('Dashboard').parentElement;
    expect(container).toHaveClass('space-y-6');
  });
});
