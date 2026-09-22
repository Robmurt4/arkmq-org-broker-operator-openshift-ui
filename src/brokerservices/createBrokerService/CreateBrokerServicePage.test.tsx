import * as React from 'react';
import * as jsYaml from 'js-yaml';
import { render, screen } from '@testing-library/react';
import { useParams } from 'react-router';
import CreateBrokerServicePage from './CreateBrokerServicePage';

const TEST_NAMESPACE = 'test-namespace';

jest.mock('react-router', () => ({
  useParams: jest.fn(() => ({ ns: TEST_NAMESPACE })),
  useNavigate: jest.fn(() => jest.fn()),
}));

let capturedOnYamlSave: ((yaml: string) => void | Promise<void>) | undefined;

jest.mock('../../shared-components/ResourceFormEditor', () => ({
  ResourceFormEditor: ({
    children,
    createButtonTestId,
    cancelButtonTestId,
    onYamlSave,
  }: {
    children: React.ReactNode;
    createButtonTestId?: string;
    cancelButtonTestId?: string;
    onYamlSave?: (yaml: string) => void | Promise<void>;
  }) => {
    capturedOnYamlSave = onYamlSave;
    return (
      <>
        {children}
        <button data-test={createButtonTestId}>Create</button>
        <button data-test={cancelButtonTestId}>Cancel</button>
      </>
    );
  },
}));

const mockUseParams = useParams as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseParams.mockReturnValue({ ns: TEST_NAMESPACE });
});

describe('CreateBrokerServicePage', () => {
  it('renders the page title and description', () => {
    render(<CreateBrokerServicePage />);

    expect(screen.getByTestId('create-brokerservice-title')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Provision a shared messaging infrastructure broker cluster. This resource defines the underlying broker deployment that applications will connect to via BrokerApp resources.',
      ),
    ).toBeInTheDocument();
  });

  it('pre-populates the name field with the default value', () => {
    render(<CreateBrokerServicePage />);

    expect(screen.getByTestId('broker-service-name-input')).toHaveValue('my-messaging-service');
  });

  it('renders form sections inside ResourceFormEditor', () => {
    render(<CreateBrokerServicePage />);

    expect(screen.getByTestId('broker-service-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('memory-value-input')).toBeInTheDocument();
  });

  it('renders create and cancel buttons', () => {
    render(<CreateBrokerServicePage />);

    expect(screen.getByTestId('create-broker-service-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-broker-service-button')).toBeInTheDocument();
  });
});

const buildBrokerServiceYaml = (overrides: Record<string, unknown> = {}) =>
  jsYaml.dump({
    apiVersion: 'broker.arkmq.org/v1beta2',
    kind: 'BrokerService',
    metadata: { name: 'my-service', namespace: TEST_NAMESPACE },
    spec: { resources: { limits: { memory: '2Gi' } } },
    ...overrides,
  });

const getOnYamlSave = (): ((yaml: string) => void | Promise<void>) => {
  if (!capturedOnYamlSave) throw new Error('onYamlSave was not captured — render first');
  return capturedOnYamlSave;
};

describe('CreateBrokerServicePage — YAML submit validation', () => {
  beforeEach(() => render(<CreateBrokerServicePage />));

  it('rejects YAML with invalid memory format', () => {
    expect(() =>
      getOnYamlSave()(
        buildBrokerServiceYaml({
          spec: { resources: { limits: { memory: '2Ti' } } },
        }),
      ),
    ).toThrow("invalid format '2Ti'");
  });

  it('rejects YAML with invalid name', () => {
    expect(() =>
      getOnYamlSave()(
        buildBrokerServiceYaml({
          metadata: { name: 'INVALID', namespace: TEST_NAMESPACE },
        }),
      ),
    ).toThrow('metadata.name');
  });
});
