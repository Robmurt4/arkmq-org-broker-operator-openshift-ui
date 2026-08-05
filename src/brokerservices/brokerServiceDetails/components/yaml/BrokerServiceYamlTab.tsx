import type { FC } from 'react';
import { EmptyState, EmptyStateBody, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

/**
 * Placeholder YAML tab for BrokerService details.
 * A read-only YAML view can replace this stub in a later commit.
 */
export const BrokerServiceYamlTab: FC = () => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');

  return (
    <PageSection data-test="broker-service-yaml-tab">
      <EmptyState headingLevel="h2" titleText={t('YAML')}>
        <EmptyStateBody>{t('YAML editor will appear here.')}</EmptyStateBody>
      </EmptyState>
    </PageSection>
  );
};
