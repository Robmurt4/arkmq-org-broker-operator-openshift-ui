import type { FC } from 'react';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { Link } from 'react-router';

export interface ResourceDetailsBreadcrumbProps {
  /** Path back to the resource list page for this CR kind. */
  listPath: string;
  /** Translated list crumb label (e.g. BrokerServices, BrokerApps). */
  listLabel: string;
  /** Active crumb text for the current resource (name or titled label). */
  currentLabel: string;
  /** Optional test id for the breadcrumb nav. */
  dataTest?: string;
}

/** Shared details breadcrumb for BrokerService and BrokerApp pages. */
export const ResourceDetailsBreadcrumb: FC<ResourceDetailsBreadcrumbProps> = ({
  listPath,
  listLabel,
  currentLabel,
  dataTest,
}) => (
  <Breadcrumb data-test={dataTest ?? 'resource-details-breadcrumb'}>
    <BreadcrumbItem
      render={({ className }) => (
        <Link to={listPath} className={className}>
          {listLabel}
        </Link>
      )}
    />
    <BreadcrumbItem isActive>{currentLabel}</BreadcrumbItem>
  </Breadcrumb>
);
