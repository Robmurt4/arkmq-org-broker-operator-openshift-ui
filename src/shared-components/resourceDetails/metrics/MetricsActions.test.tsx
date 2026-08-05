import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsActions } from './MetricsActions';
import { MetricsType, createInitialMetricsToolbarState } from './metricsTypes';

const metricsFilterOptions = [
  { value: MetricsType.AllMetrics, label: 'All Metrics' },
  { value: MetricsType.MemoryUsage, label: 'Memory Usage Metrics' },
  { value: MetricsType.CPUUsage, label: 'CPU Usage Metrics' },
  { value: MetricsType.BrokerMetrics, label: 'Broker Metrics' },
];

const initialState = createInitialMetricsToolbarState([]);

describe('MetricsActions', () => {
  it('renders all three dropdowns with the current selections', () => {
    render(
      <MetricsActions
        state={initialState}
        dispatch={jest.fn()}
        metricsFilterOptions={metricsFilterOptions}
      />,
    );

    expect(screen.getByTestId('metrics-actions')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-actions-metrics-type')).toHaveTextContent('All Metrics');
    expect(screen.getByTestId('metrics-actions-span')).toHaveTextContent('last 30 minutes');
    expect(screen.getByTestId('metrics-actions-poll-time')).toHaveTextContent('Refresh Off');
  });

  it('dispatches FILTER_BY_METRICS_TYPE when a filter option is selected', async () => {
    const user = userEvent.setup();
    const dispatch = jest.fn();

    render(
      <MetricsActions
        state={initialState}
        dispatch={dispatch}
        metricsFilterOptions={metricsFilterOptions}
      />,
    );

    await user.click(screen.getByTestId('metrics-actions-metrics-type'));
    await user.click(screen.getByText('CPU Usage Metrics'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'FILTER_BY_METRICS_TYPE',
      payload: MetricsType.CPUUsage,
    });
  });

  it('dispatches CHANGE_TIME_RANGE when a time range is selected', async () => {
    const user = userEvent.setup();
    const dispatch = jest.fn();

    render(
      <MetricsActions
        state={initialState}
        dispatch={dispatch}
        metricsFilterOptions={metricsFilterOptions}
      />,
    );

    await user.click(screen.getByTestId('metrics-actions-span'));
    await user.click(screen.getByText('last 1 hour'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'CHANGE_TIME_RANGE',
      payload: '1h',
    });
  });

  it('dispatches CHANGE_REFRESH_INTERVAL when a refresh interval is selected', async () => {
    const user = userEvent.setup();
    const dispatch = jest.fn();

    render(
      <MetricsActions
        state={initialState}
        dispatch={dispatch}
        metricsFilterOptions={metricsFilterOptions}
      />,
    );

    await user.click(screen.getByTestId('metrics-actions-poll-time'));
    await user.click(screen.getByText('15 seconds'));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'CHANGE_REFRESH_INTERVAL',
      payload: '15s',
    });
  });
});
