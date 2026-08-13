import { render, screen } from '@testing-library/react';
import type { BrokerService } from '../../../../k8s/types';
import { BrokerServiceYamlTab } from './BrokerServiceYamlTab';

const brokerService: BrokerService = {
  apiVersion: 'broker.arkmq.org/v1beta2',
  kind: 'BrokerService',
  metadata: { name: 'my-messaging-service', namespace: 'default' },
};

describe('BrokerServiceYamlTab', () => {
  it('renders the YAML editor when the BrokerService is provided', () => {
    render(<BrokerServiceYamlTab obj={brokerService} />);

    expect(screen.getByTestId('broker-service-yaml-tab')).toBeInTheDocument();
    expect(screen.getByTestId('resource-yaml-editor')).toBeInTheDocument();
  });

  it('renders nothing when the BrokerService is missing', () => {
    const { container } = render(<BrokerServiceYamlTab />);
    expect(container).toBeEmptyDOMElement();
  });
});
