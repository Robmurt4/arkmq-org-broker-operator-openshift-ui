import { render, screen } from '@testing-library/react';
import { K8sResourceConditionStatus } from '../../k8s/types';
import { ConditionsTable } from './ConditionsTable';

describe('ConditionsTable', () => {
  it('shows an empty row when there are no conditions', () => {
    render(<ConditionsTable conditions={[]} />);
    expect(screen.getByTestId('resource-conditions-table')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('No conditions')).toBeInTheDocument();
  });

  it('renders condition fields including timestamp', () => {
    render(
      <ConditionsTable
        conditions={[
          {
            type: 'Ready',
            status: K8sResourceConditionStatus.True,
            reason: 'Deployed',
            message: 'Broker is running',
            lastTransitionTime: '2026-08-11T10:00:00Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('Deployed')).toBeInTheDocument();
    expect(screen.getByText('Broker is running')).toBeInTheDocument();
    expect(screen.getByTestId('timestamp')).toHaveTextContent('2026-08-11T10:00:00Z');
  });

  it('uses a custom title when provided', () => {
    render(<ConditionsTable title="Service conditions" conditions={[]} />);
    expect(screen.getByText('Service conditions')).toBeInTheDocument();
  });
});
