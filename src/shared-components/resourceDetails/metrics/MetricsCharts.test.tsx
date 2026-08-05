import { render, screen } from '@testing-library/react';
import { MetricsChartGrid, MetricsChartPanel, MetricsDataUnavailable } from './MetricsCharts';

describe('MetricsChartGrid', () => {
  it('renders child panels inside the grid', () => {
    render(
      <MetricsChartGrid>
        <div data-test="chart-a">A</div>
        <div data-test="chart-b">B</div>
      </MetricsChartGrid>,
    );

    expect(screen.getByTestId('metrics-chart-grid')).toBeInTheDocument();
    expect(screen.getByTestId('chart-a')).toBeInTheDocument();
    expect(screen.getByTestId('chart-b')).toBeInTheDocument();
  });
});

describe('MetricsChartPanel', () => {
  it('renders the chart title and children', () => {
    render(
      <MetricsChartPanel title="Memory Usage (Total)" dataTest="memory-chart">
        <span>Plot area</span>
      </MetricsChartPanel>,
    );

    expect(screen.getByTestId('memory-chart')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Memory Usage (Total)' })).toBeInTheDocument();
    expect(screen.getByText('Plot area')).toBeInTheDocument();
  });

  it('uses the default panel test id when dataTest is omitted', () => {
    render(
      <MetricsChartPanel title="CPU Usage (Total)">
        <span>Plot area</span>
      </MetricsChartPanel>,
    );

    expect(screen.getByTestId('metrics-chart-panel')).toBeInTheDocument();
  });
});

describe('MetricsDataUnavailable', () => {
  it('shows the unavailable heading and scrape message', () => {
    render(<MetricsDataUnavailable />);

    expect(screen.getByTestId('metrics-data-unavailable')).toBeInTheDocument();
    expect(screen.getByText('Data unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Waiting for the first scrape. This can take up to a minute after enabling monitoring.',
      ),
    ).toBeInTheDocument();
  });
});
