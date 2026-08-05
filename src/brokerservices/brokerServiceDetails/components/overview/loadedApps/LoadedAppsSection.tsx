import type { FC } from 'react';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Label, Spinner, Title } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { BrokerAppModel } from '../../../../../k8s/models';
import type { BrokerAppCR, BrokerService } from '../../../../../k8s/types';
import { getReadyConditionDisplay } from '../../../../../shared-components/resourceList/getReadyConditionDisplay';

export interface LoadedAppsSectionProps {
  /** BrokerService whose bound BrokerApps are listed. */
  brokerService: BrokerService;
}

/**
 * Filters BrokerApps bound to a BrokerService via status.service (not selectors).
 */
export function filterLoadedBrokerApps(
  apps: BrokerAppCR[],
  serviceName: string,
  serviceNamespace: string,
): BrokerAppCR[] {
  if (!serviceName || !serviceNamespace) {
    return [];
  }

  return apps.filter((app) => {
    const boundService = app.status?.service;
    return boundService?.name === serviceName && boundService.namespace === serviceNamespace;
  });
}

/**
 * Overview Loaded Apps table. Consumer Count is a placeholder until Prometheus.
 */
export const LoadedAppsSection: FC<LoadedAppsSectionProps> = ({ brokerService }) => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const serviceName = brokerService.metadata?.name ?? '';
  const serviceNamespace = brokerService.metadata?.namespace ?? '';

  const [apps, loaded, loadError] = useK8sWatchResource<BrokerAppCR[]>({
    groupVersionKind: {
      group: BrokerAppModel.apiGroup,
      version: BrokerAppModel.apiVersion,
      kind: BrokerAppModel.kind,
    },
    isList: true,
    namespace: serviceNamespace,
  }) as [BrokerAppCR[], boolean, unknown];

  const loadedApps = filterLoadedBrokerApps(
    Array.isArray(apps) ? apps : [],
    serviceName,
    serviceNamespace,
  );

  const statusLabels = {
    Running: t('Provisioned'),
    Warning: t('Warning'),
    Failed: t('Failed'),
    Pending: t('Pending'),
  };

  return (
    <div data-test="broker-service-loaded-apps">
      <Title headingLevel="h2" className="pf-v6-u-mb-md">
        {t('Loaded Apps')}
      </Title>
      {!loaded ? (
        <Spinner aria-label={t('Loading BrokerApps')} />
      ) : loadError ? (
        <Table aria-label={t('Loaded Apps')} variant="compact">
          <Tbody>
            <Tr>
              <Td colSpan={3}>{t('An error occurred')}</Td>
            </Tr>
          </Tbody>
        </Table>
      ) : (
        <Table aria-label={t('Loaded Apps')} variant="compact">
          <Thead>
            <Tr>
              <Th>{t('App Name')}</Th>
              <Th>{t('Status')}</Th>
              <Th>{t('Consumer Count')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loadedApps.length === 0 ? (
              <Tr>
                <Td colSpan={3}>{t('No loaded apps')}</Td>
              </Tr>
            ) : (
              loadedApps.map((app) => {
                const name = app.metadata?.name;
                const namespace = app.metadata?.namespace;
                const { labelKey, color } = getReadyConditionDisplay(
                  app.status?.conditions,
                  'Deployed',
                  'Pending',
                );

                return (
                  <Tr key={`${namespace ?? ''}-${name ?? ''}`}>
                    <Td dataLabel={t('App Name')}>
                      {name && namespace ? (
                        <ResourceLink
                          groupVersionKind={getGroupVersionKindForModel(BrokerAppModel)}
                          name={name}
                          namespace={namespace}
                          dataTest={`loaded-app-link-${namespace}-${name}`}
                        />
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td dataLabel={t('Status')}>
                      <Label
                        color={color}
                        data-test={`loaded-app-status-${namespace ?? ''}-${name ?? ''}`}
                      >
                        {statusLabels[labelKey]}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Consumer Count')}>
                      <span
                        data-test={`loaded-app-consumer-count-${namespace ?? ''}-${name ?? ''}`}
                      >
                        -
                      </span>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      )}
    </div>
  );
};
