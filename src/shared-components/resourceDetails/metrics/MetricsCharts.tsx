import type { FC, ReactNode } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Gallery,
  Title,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export interface MetricsChartGridProps {
  /** Child chart panels to place in the grid. */
  children: ReactNode;
}

export interface MetricsChartPanelProps {
  /** Chart heading shown above the plot or empty state. */
  title: string;
  /** Chart content, or MetricsDataUnavailable while waiting for scrapes. */
  children: ReactNode;
  /** Optional test id for the panel. */
  dataTest?: string;
}

/** Lays out metrics chart panels in a wrapping grid. */
export const MetricsChartGrid: FC<MetricsChartGridProps> = ({ children }) => (
  <Gallery hasGutter minWidths={{ default: '100%', md: '45%' }} data-test="metrics-chart-grid">
    {children}
  </Gallery>
);

/** One metrics chart tile with a title and body content. */
export const MetricsChartPanel: FC<MetricsChartPanelProps> = ({ title, children, dataTest }) => (
  <Card isCompact data-test={dataTest ?? 'metrics-chart-panel'}>
    <CardTitle>
      <Title headingLevel="h3" size="md">
        {title}
      </Title>
    </CardTitle>
    <CardBody>{children}</CardBody>
  </Card>
);

/** Empty state when metrics data is not ready yet. */
export const MetricsDataUnavailable: FC = () => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');

  return (
    <EmptyState
      variant={EmptyStateVariant.sm}
      status="warning"
      icon={ExclamationTriangleIcon}
      headingLevel="h3"
      titleText={t('Data unavailable')}
      data-test="metrics-data-unavailable"
    >
      <EmptyStateBody>
        {t('Waiting for the first scrape. This can take up to a minute after enabling monitoring.')}
      </EmptyStateBody>
    </EmptyState>
  );
};
