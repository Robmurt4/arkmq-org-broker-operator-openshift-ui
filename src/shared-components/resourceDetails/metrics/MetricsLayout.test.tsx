import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsType } from './metricsTypes';
import { MetricsLayout } from './MetricsLayout';

const filterOptions = [
  { value: MetricsType.AllMetrics, label: 'All Metrics' },
  { value: MetricsType.MemoryUsage, label: 'Memory Usage Metrics' },
  { value: MetricsType.CPUUsage, label: 'CPU Usage Metrics' },
  { value: MetricsType.BrokerMetrics, label: 'Broker Metrics' },
];

const charts = [
  { id: 'memory-total', title: 'Memory Usage (Total)', metricsType: MetricsType.MemoryUsage },
  { id: 'cpu-total', title: 'CPU Usage (Total)', metricsType: MetricsType.CPUUsage },
  { id: 'queue-depth', title: 'Queue Depth per App', metricsType: MetricsType.BrokerMetrics },
];

describe('MetricsLayout', () => {
  it('renders the Metrics title, toolbar, and all chart panels by default', () => {
    render(
      <MetricsLayout
        charts={charts}
        metricsFilterOptions={filterOptions}
        dataTestPrefix="broker-service-metric"
      />,
    );

    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-actions')).toBeInTheDocument();
    expect(screen.getByTestId('broker-service-metric-memory-total')).toBeInTheDocument();
    expect(screen.getByTestId('broker-service-metric-cpu-total')).toBeInTheDocument();
    expect(screen.getByTestId('broker-service-metric-queue-depth')).toBeInTheDocument();
    expect(screen.getAllByText('Data unavailable').length).toBe(3);
  });

  it('filters chart panels when a metrics type is selected', async () => {
    const user = userEvent.setup();
    render(
      <MetricsLayout
        charts={charts}
        metricsFilterOptions={filterOptions}
        dataTestPrefix="broker-service-metric"
      />,
    );

    await user.click(screen.getByTestId('metrics-actions-metrics-type'));
    await user.click(screen.getByText('Memory Usage Metrics'));

    expect(screen.getByTestId('broker-service-metric-memory-total')).toBeInTheDocument();
    expect(screen.queryByTestId('broker-service-metric-cpu-total')).not.toBeInTheDocument();
    expect(screen.queryByTestId('broker-service-metric-queue-depth')).not.toBeInTheDocument();
  });
});
