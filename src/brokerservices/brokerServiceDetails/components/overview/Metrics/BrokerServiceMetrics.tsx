import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { MetricsLayout } from '../../../../../shared-components/resourceDetails/metrics/MetricsLayout';
import { MetricsType } from '../../../../../shared-components/resourceDetails/metrics/metricsTypes';

/** BrokerService Overview Metrics: four chart placeholders on the shared Metrics layout. */
export const BrokerServiceMetrics: FC = () => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');

  return (
    <MetricsLayout
      dataTestPrefix="broker-service-metric"
      metricsFilterOptions={[
        { value: MetricsType.AllMetrics, label: t('All Metrics') },
        { value: MetricsType.MemoryUsage, label: t('Memory Usage Metrics') },
        { value: MetricsType.CPUUsage, label: t('CPU Usage Metrics') },
        { value: MetricsType.BrokerMetrics, label: t('Broker Metrics') },
      ]}
      charts={[
        {
          id: 'memory-total',
          title: t('Memory Usage (Total)'),
          metricsType: MetricsType.MemoryUsage,
        },
        {
          id: 'cpu-total',
          title: t('CPU Usage (Total)'),
          metricsType: MetricsType.CPUUsage,
        },
        {
          id: 'memory-per-app',
          title: t('Memory Usage per App'),
          metricsType: MetricsType.MemoryUsage,
        },
        {
          id: 'queue-depth-per-app',
          title: t('Queue Depth per App'),
          metricsType: MetricsType.BrokerMetrics,
        },
      ]}
    />
  );
};
