import type { FC } from 'react';
import { Title } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import type { K8sResourceCondition } from '../../k8s/types';

export interface ConditionsTableProps {
  /** Operator status conditions from the CR `status.conditions` array. */
  conditions?: K8sResourceCondition[];
  /** Optional heading shown above the table. Defaults to translated "Conditions". */
  title?: string;
}

/** Table of status conditions for a resource Overview. */
export const ConditionsTable: FC<ConditionsTableProps> = ({ conditions, title }) => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const rows = conditions ?? [];
  const heading = title ?? t('Conditions');

  return (
    <div data-test="resource-conditions-table">
      <Title headingLevel="h2" className="pf-v6-u-mb-md">
        {heading}
      </Title>
      <Table aria-label={heading} variant="compact">
        <Thead>
          <Tr>
            <Th>{t('Type')}</Th>
            <Th>{t('Status')}</Th>
            <Th>{t('Updated')}</Th>
            <Th>{t('Reason')}</Th>
            <Th>{t('Message')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={5}>{t('No conditions')}</Td>
            </Tr>
          ) : (
            rows.map((condition) => (
              <Tr
                key={`${condition.type}-${condition.reason ?? ''}-${condition.lastTransitionTime ?? ''}`}
              >
                <Td dataLabel={t('Type')}>{condition.type}</Td>
                <Td dataLabel={t('Status')}>{condition.status}</Td>
                <Td dataLabel={t('Updated')}>
                  {condition.lastTransitionTime ? (
                    <Timestamp timestamp={condition.lastTransitionTime} />
                  ) : (
                    '-'
                  )}
                </Td>
                <Td dataLabel={t('Reason')}>{condition.reason ?? '-'}</Td>
                <Td dataLabel={t('Message')}>{condition.message ?? '-'}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  );
};
