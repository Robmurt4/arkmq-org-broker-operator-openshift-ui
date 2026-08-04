import type { FC } from 'react';
import type { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import {
  DocumentTitle,
  isAllNamespacesKey,
  ListPageBody,
  ListPageCreateLink,
  ListPageHeader,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { BrokerServiceModel } from '../../k8s/models';
import type { BrokerService } from '../../k8s/types';
import { BrokerServiceListTable } from './components/BrokerServiceListTable';

export interface BrokerServiceListPageProps {
  /** Active namespace selected in the console project selector. */
  namespace: string;
  /** K8s model passed by the console resource list extension — not used directly. */
  model: K8sModel;
}

/**
 * List page for BrokerService resources.
 * The create link is hidden for users without create permissions via createAccessReview.
 */
const BrokerServiceListPage: FC<BrokerServiceListPageProps> = ({ namespace }) => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const [activeNamespace] = useActiveNamespace();

  const createNamespace =
    namespace && !isAllNamespacesKey(namespace)
      ? namespace
      : activeNamespace && !isAllNamespacesKey(activeNamespace)
        ? activeNamespace
        : 'default';
  const createPath = `/k8s/ns/${createNamespace}/brokerservices/~new`;

  const [brokerServices, loaded, loadError] = useK8sWatchResource<BrokerService[]>({
    namespace,
    groupVersionKind: {
      group: BrokerServiceModel.apiGroup,
      version: BrokerServiceModel.apiVersion,
      kind: BrokerServiceModel.kind,
    },
    isList: true,
  }) as [BrokerService[], boolean, unknown];

  return (
    <>
      <DocumentTitle>{t('BrokerServices')}</DocumentTitle>
      <ListPageHeader title={t('BrokerServices')}>
        <ListPageCreateLink
          to={createPath}
          createAccessReview={{
            groupVersionKind: {
              group: BrokerServiceModel.apiGroup,
              version: BrokerServiceModel.apiVersion,
              kind: BrokerServiceModel.kind,
            },
            namespace,
          }}
        >
          {t('Create BrokerService')}
        </ListPageCreateLink>
      </ListPageHeader>
      <ListPageBody>
        <BrokerServiceListTable data={brokerServices} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

export default BrokerServiceListPage;
