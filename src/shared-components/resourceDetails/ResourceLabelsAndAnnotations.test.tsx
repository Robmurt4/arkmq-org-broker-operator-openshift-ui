import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAnnotationsModal, useLabelsModal } from '@openshift-console/dynamic-plugin-sdk';
import type { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { ResourceLabelsAndAnnotations } from './ResourceLabelsAndAnnotations';

const mockUseLabelsModal = useLabelsModal as jest.Mock;
const mockUseAnnotationsModal = useAnnotationsModal as jest.Mock;

const launchLabelsModal = jest.fn();
const launchAnnotationsModal = jest.fn();

const resourceWithMetadata: K8sResourceCommon = {
  apiVersion: 'broker.arkmq.org/v1beta2',
  kind: 'BrokerService',
  metadata: {
    name: 'my-messaging-service',
    namespace: 'default',
    labels: { app: 'broker', tier: 'e2e' },
    annotations: { note: 'demo' },
  },
};

const emptyResource: K8sResourceCommon = {
  apiVersion: 'broker.arkmq.org/v1beta2',
  kind: 'BrokerService',
  metadata: { name: 'my-messaging-service', namespace: 'default' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLabelsModal.mockReturnValue(launchLabelsModal);
  mockUseAnnotationsModal.mockReturnValue(launchAnnotationsModal);
});

describe('ResourceLabelsAndAnnotations', () => {
  it('shows empty placeholders when labels and annotations are missing', () => {
    render(<ResourceLabelsAndAnnotations resource={emptyResource} />);
    expect(screen.getByText('No labels')).toBeInTheDocument();
    expect(screen.getByText('No annotations')).toBeInTheDocument();
  });

  it('renders label and annotation pairs', () => {
    render(<ResourceLabelsAndAnnotations resource={resourceWithMetadata} />);
    expect(screen.getByText('app=broker')).toBeInTheDocument();
    expect(screen.getByText('tier=e2e')).toBeInTheDocument();
    expect(screen.getByText('note=demo')).toBeInTheDocument();
  });

  it('opens the labels and annotations modals from Edit', async () => {
    const user = userEvent.setup();
    render(<ResourceLabelsAndAnnotations resource={resourceWithMetadata} />);

    await user.click(screen.getByTestId('resource-labels-edit'));
    expect(launchLabelsModal).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('resource-annotations-edit'));
    expect(launchAnnotationsModal).toHaveBeenCalledTimes(1);
  });
});
