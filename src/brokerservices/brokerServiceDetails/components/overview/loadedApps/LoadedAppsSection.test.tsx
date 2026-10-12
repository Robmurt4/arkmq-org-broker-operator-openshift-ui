import { render, screen } from '@testing-library/react';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import type { BrokerAppCR, BrokerService } from '../../../../../k8s/types';
import { K8sResourceConditionStatus } from '../../../../../k8s/types';
import {
  filterLoadedBrokerApps,
  LoadedAppsSection,
  parseProvisionedAppRef,
} from './LoadedAppsSection';

const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;

const brokerService: BrokerService = {
  apiVersion: 'broker.arkmq.org/v1beta2',
  kind: 'BrokerService',
  metadata: { name: 'my-messaging-service', namespace: 'default' },
  status: {
    provisionedApps: ['default/my-messaging-app@1'],
  },
};

const makeApp = (name: string, namespace = 'default'): BrokerAppCR => ({
  apiVersion: 'broker.arkmq.org/v1beta2',
  kind: 'BrokerApp',
  metadata: { name, namespace },
  spec: {},
  status: {
    conditions: [{ type: 'Deployed', status: K8sResourceConditionStatus.True }],
  },
});

describe('parseProvisionedAppRef', () => {
  it('parses a well-formed entry', () => {
    expect(parseProvisionedAppRef('my-ns/my-app@3')).toEqual({
      namespace: 'my-ns',
      name: 'my-app',
      generation: 3,
    });
  });

  it('returns null for entries missing a slash', () => {
    expect(parseProvisionedAppRef('my-app@3')).toBeNull();
  });

  it('returns null for entries missing an at-sign', () => {
    expect(parseProvisionedAppRef('my-ns/my-app')).toBeNull();
  });

  it('returns null for an empty namespace', () => {
    expect(parseProvisionedAppRef('/my-app@3')).toBeNull();
  });

  it('returns null for an empty name', () => {
    expect(parseProvisionedAppRef('my-ns/@3')).toBeNull();
  });

  it('returns null for a non-numeric generation', () => {
    expect(parseProvisionedAppRef('my-ns/my-app@abc')).toBeNull();
  });
});

describe('filterLoadedBrokerApps', () => {
  it('returns an empty list when provisionedApps is empty', () => {
    expect(filterLoadedBrokerApps([makeApp('app-1')], [])).toEqual([]);
  });

  it('keeps only apps matching a provisionedApps entry', () => {
    const apps = [makeApp('bound'), makeApp('other'), makeApp('also-bound')];

    const result = filterLoadedBrokerApps(apps, ['default/bound@1', 'default/also-bound@2']);

    expect(result.map((app) => app.metadata?.name)).toEqual(['bound', 'also-bound']);
  });

  it('matches on both namespace and name', () => {
    const apps = [makeApp('my-app', 'ns-a'), makeApp('my-app', 'ns-b')];

    const result = filterLoadedBrokerApps(apps, ['ns-b/my-app@1']);
    expect(result.map((app) => app.metadata?.namespace)).toEqual(['ns-b']);
  });

  it('skips malformed provisionedApps entries gracefully', () => {
    const apps = [makeApp('good')];
    const result = filterLoadedBrokerApps(apps, ['default/good@1', 'malformed-entry']);
    expect(result.map((app) => app.metadata?.name)).toEqual(['good']);
  });
});

describe('LoadedAppsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a spinner while BrokerApps are loading', () => {
    mockUseK8sWatchResource.mockReturnValue([[], false, undefined]);
    render(<LoadedAppsSection brokerService={brokerService} />);
    expect(screen.getByRole('progressbar', { name: 'Loading BrokerApps' })).toBeInTheDocument();
  });

  it('shows an empty state when no apps are provisioned', () => {
    const serviceWithNoApps: BrokerService = {
      ...brokerService,
      status: { provisionedApps: [] },
    };
    mockUseK8sWatchResource.mockReturnValue([[makeApp('stray')], true, undefined]);
    render(<LoadedAppsSection brokerService={serviceWithNoApps} />);
    expect(screen.getByText('No loaded apps')).toBeInTheDocument();
  });

  it('shows an error row when the watch fails', () => {
    mockUseK8sWatchResource.mockReturnValue([[], true, new Error('forbidden')]);
    render(<LoadedAppsSection brokerService={brokerService} />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders provisioned apps with status and consumer-count placeholder', () => {
    mockUseK8sWatchResource.mockReturnValue([
      [makeApp('my-messaging-app'), makeApp('ignored')],
      true,
      undefined,
    ]);

    render(<LoadedAppsSection brokerService={brokerService} />);

    expect(screen.getByTestId('loaded-app-link-default-my-messaging-app')).toHaveTextContent(
      'my-messaging-app',
    );
    expect(screen.getByTestId('loaded-app-status-default-my-messaging-app')).toHaveTextContent(
      'Provisioned',
    );
    expect(
      screen.getByTestId('loaded-app-consumer-count-default-my-messaging-app'),
    ).toHaveTextContent('-');
    expect(screen.queryByText('ignored')).not.toBeInTheDocument();
  });
});
