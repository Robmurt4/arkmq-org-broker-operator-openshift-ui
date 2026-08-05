import { render, screen } from '@testing-library/react';
import { ResourceDetailsBreadcrumb } from './ResourceDetailsBreadcrumb';

jest.mock('react-router', () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('ResourceDetailsBreadcrumb', () => {
  it('links back to the list and shows the current crumb', () => {
    render(
      <ResourceDetailsBreadcrumb
        listPath="/k8s/ns/default/broker.arkmq.org~v1beta2~BrokerService"
        listLabel="BrokerServices"
        currentLabel="BrokerService details"
        dataTest="broker-service-details-breadcrumb"
      />,
    );

    const listLink = screen.getByRole('link', { name: 'BrokerServices' });
    expect(listLink).toHaveAttribute(
      'href',
      '/k8s/ns/default/broker.arkmq.org~v1beta2~BrokerService',
    );
    expect(screen.getByText('BrokerService details')).toBeInTheDocument();
    expect(screen.getByTestId('broker-service-details-breadcrumb')).toBeInTheDocument();
  });
});
