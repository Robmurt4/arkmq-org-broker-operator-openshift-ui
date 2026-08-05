import { render, screen } from '@testing-library/react';
import { MetricsSection } from './MetricsSection';

describe('MetricsSection', () => {
  it('renders the title and body content', () => {
    render(
      <MetricsSection title="Metrics">
        <div data-test="metrics-body">Chart grid</div>
      </MetricsSection>,
    );

    expect(screen.getByTestId('metrics-section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Metrics' })).toBeInTheDocument();
    expect(screen.getByTestId('metrics-body')).toHaveTextContent('Chart grid');
  });

  it('renders optional actions beside the title', () => {
    render(
      <MetricsSection title="Metrics" actions={<button type="button">Filter</button>}>
        <div>Charts</div>
      </MetricsSection>,
    );

    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
  });

  it('omits the actions row when actions are not provided', () => {
    render(
      <MetricsSection title="Metrics">
        <div>Charts</div>
      </MetricsSection>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
