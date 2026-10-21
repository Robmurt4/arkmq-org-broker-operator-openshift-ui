import { type FC, useReducer } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import type { BrokerService } from '../../../k8s/types';
import {
  brokerServiceReducer,
  BrokerServiceFormDispatchContext,
  BrokerServiceFormStateContext,
  createInitialBrokerServiceState,
} from '../../../reducers/brokerservice/reducer';
import { CopyLabelsFromServiceModal } from './CopyLabelsFromServiceModal';

const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;

const TEST_NAMESPACE = 'test-namespace';

const makeService = (name: string, labels?: Record<string, string>): BrokerService => ({
  apiVersion: 'broker.arkmq.org/v1beta2',
  kind: 'BrokerService',
  metadata: { name, namespace: TEST_NAMESPACE, labels },
  spec: { resources: { limits: { memory: '2Gi' } } },
});

/**
 * Provides BrokerService form context around the modal under test and surfaces
 * copied label rows for assertions after a service card is selected.
 */
const CopyLabelsFromServiceModalWrapper: FC<{
  excludeServiceName?: string;
  onClose?: () => void;
}> = ({ excludeServiceName, onClose = jest.fn() }) => {
  const [state, dispatch] = useReducer(
    brokerServiceReducer,
    createInitialBrokerServiceState(TEST_NAMESPACE),
  );

  return (
    <BrokerServiceFormStateContext.Provider value={state}>
      <BrokerServiceFormDispatchContext.Provider value={dispatch}>
        <div data-test="label-count">{state.labels.length}</div>
        {state.labels.map((label) => (
          <div key={label.key} data-test={`copied-label-${label.key}`}>
            {label.key}={label.value}
          </div>
        ))}
        <CopyLabelsFromServiceModal
          namespace={TEST_NAMESPACE}
          excludeServiceName={excludeServiceName}
          onClose={onClose}
        />
      </BrokerServiceFormDispatchContext.Provider>
    </BrokerServiceFormStateContext.Provider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseK8sWatchResource.mockReturnValue([[], true, undefined]);
});

describe('CopyLabelsFromServiceModal', () => {
  it('shows an empty state when no selectable BrokerServices exist', () => {
    render(<CopyLabelsFromServiceModalWrapper />);

    expect(screen.getByText('No BrokerServices found')).toBeInTheDocument();
    expect(
      screen.getByText('There are no other BrokerServices in this namespace to copy labels from.'),
    ).toBeInTheDocument();
  });

  it('renders a card per BrokerService with label chips', () => {
    mockUseK8sWatchResource.mockReturnValue([
      [
        makeService('alpha-service', { tier: 'production' }),
        makeService('beta-service', { forWorkQueue: 'true', env: 'test' }),
      ],
      true,
      undefined,
    ]);

    render(<CopyLabelsFromServiceModalWrapper />);

    expect(screen.getByTestId('copy-labels-service-card-alpha-service')).toBeInTheDocument();
    expect(screen.getByTestId('copy-labels-service-card-beta-service')).toBeInTheDocument();
    expect(screen.getByText('tier=production')).toBeInTheDocument();
    expect(screen.getByText('forWorkQueue=true')).toBeInTheDocument();
    expect(screen.getByText('env=test')).toBeInTheDocument();
  });

  it('excludes the service currently being edited', () => {
    mockUseK8sWatchResource.mockReturnValue([
      [makeService('messaging-service', { tier: 'production' }), makeService('other-service')],
      true,
      undefined,
    ]);

    render(<CopyLabelsFromServiceModalWrapper excludeServiceName="messaging-service" />);

    expect(
      screen.queryByTestId('copy-labels-service-card-messaging-service'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('copy-labels-service-card-other-service')).toBeInTheDocument();
  });

  it('copies labels into the form and closes when a card is selected', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    mockUseK8sWatchResource.mockReturnValue([
      [makeService('source-service', { tier: 'production', forWorkQueue: 'true' })],
      true,
      undefined,
    ]);

    render(<CopyLabelsFromServiceModalWrapper onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'source-service' }));

    expect(screen.getByTestId('label-count')).toHaveTextContent('2');
    expect(screen.getByTestId('copied-label-tier')).toHaveTextContent('tier=production');
    expect(screen.getByTestId('copied-label-forWorkQueue')).toHaveTextContent('forWorkQueue=true');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes the modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    mockUseK8sWatchResource.mockReturnValue([
      [makeService('source-service', { tier: 'production' })],
      true,
      undefined,
    ]);

    render(<CopyLabelsFromServiceModalWrapper onClose={onClose} />);

    await user.click(screen.getByTestId('copy-labels-modal-cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('label-count')).toHaveTextContent('1');
  });

  it('shows No labels when a service has an empty label map', () => {
    mockUseK8sWatchResource.mockReturnValue([[makeService('bare-service')], true, undefined]);

    render(<CopyLabelsFromServiceModalWrapper />);

    expect(screen.getByText('No labels')).toBeInTheDocument();
  });

  it('shows an error alert when the watch fails', () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, new Error('forbidden')]);

    render(<CopyLabelsFromServiceModalWrapper />);

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('forbidden')).toBeInTheDocument();
  });
});
