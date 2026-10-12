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

export interface ProvisionedAppRef {
  namespace: string;
  name: string;
  generation: number;
}

/**
 * Parses a `<namespace>/<name>@<generation>` string from status.provisionedApps.
 * Returns null for malformed entries so callers can filter gracefully.
 */
export function parseProvisionedAppRef(entry: string): ProvisionedAppRef | null {
  const slashIdx = entry.indexOf('/');
  const atIdx = entry.indexOf('@');
  if (slashIdx < 1 || atIdx <= slashIdx + 1) {
    return null;
  }
  const namespace = entry.slice(0, slashIdx);
  const name = entry.slice(slashIdx + 1, atIdx);
  const generation = parseInt(entry.slice(atIdx + 1), 10);
  if (!name || isNaN(generation)) {
    return null;
  }
  return { namespace, name, generation };
}

/**
 * Returns BrokerApps that appear in the service's provisionedApps list,
 * matching on namespace and name. Malformed entries are silently skipped.
 */
export function filterLoadedBrokerApps(
  apps: BrokerAppCR[],
  provisionedApps: string[],
): BrokerAppCR[] {
  if (!provisionedApps.length) {
    return [];
  }

  const refs = provisionedApps
    .map(parseProvisionedAppRef)
    .filter((ref): ref is ProvisionedAppRef => ref !== null);

  return apps.filter((app) => {
    const appName = app.metadata?.name;
    const appNamespace = app.metadata?.namespace;
    return refs.some((ref) => ref.name === appName && ref.namespace === appNamespace);
  });
}

/**
 * Overview Loaded Apps table. Consumer Count is a placeholder until Prometheus.
 */
export const LoadedAppsSection: FC<LoadedAppsSectionProps> = ({ brokerService }) => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const provisionedApps = brokerService.status?.provisionedApps ?? [];

  const [apps, loaded, loadError] = useK8sWatchResource<BrokerAppCR[]>({
    groupVersionKind: {
      group: BrokerAppModel.apiGroup,
      version: BrokerAppModel.apiVersion,
      kind: BrokerAppModel.kind,
    },
    isList: true,
  }) as [BrokerAppCR[], boolean, unknown];

  const loadedApps = filterLoadedBrokerApps(Array.isArray(apps) ? apps : [], provisionedApps);

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
