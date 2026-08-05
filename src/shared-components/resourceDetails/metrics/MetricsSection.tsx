import type { FC, ReactNode } from 'react';
import { Flex, FlexItem, Stack, StackItem, Title } from '@patternfly/react-core';

export interface MetricsSectionProps {
  /** Section heading (typically "Metrics"). */
  title: string;
  /** Optional actions rendered inline with the title (filters / span / poll). */
  actions?: ReactNode;
  /** Chart grid or other metrics body content. */
  children: ReactNode;
}

/** Metrics section with a title, optional toolbar actions, and chart content. */
export const MetricsSection: FC<MetricsSectionProps> = ({ title, actions, children }) => (
  <Stack hasGutter data-test="metrics-section">
    <StackItem>
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsCenter' }}
        flexWrap={{ default: 'wrap' }}
        gap={{ default: 'gapMd' }}
      >
        <FlexItem>
          <Title headingLevel="h2">{title}</Title>
        </FlexItem>
        {actions ? <FlexItem>{actions}</FlexItem> : null}
      </Flex>
    </StackItem>
    <StackItem>{children}</StackItem>
  </Stack>
);
