import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FormGroup,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  Label,
  LabelGroup,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Switch,
  TextInput,
} from '@patternfly/react-core';
import { PlusCircleIcon, TimesIcon } from '@patternfly/react-icons';
import {
  useBrokerAppFormDispatch,
  useBrokerAppFormState,
} from '../../../reducers/brokerapp/reducer';
import {
  validatePrivateAddressEntries,
  validateDuplicateAddressEntries,
} from '../../../validation/k8s';

/** The address list this manager targets. Passed down to SubscriptionListInput
 *  so it can dispatch ADD_SUBSCRIPTION / REMOVE_SUBSCRIPTION without knowing
 *  which list it belongs to. */
const ADDRESS_KIND = 'private' as const;

/**
 * Form section for managing the BrokerApp's private addresses (spec.addresses[]).
 * Private addresses are owned exclusively by this app — the operator rejects
 * any other app that references them. Each entry supports an optional pub/sub
 * toggle and a list of durable subscription queue names.
 */
export const AddressManager: React.FC = () => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const state = useBrokerAppFormState();
  const dispatch = useBrokerAppFormDispatch();

  const requiredErrors = validatePrivateAddressEntries(state.privateAddresses);
  const duplicateErrors = validateDuplicateAddressEntries(state.privateAddresses);
  const errors = requiredErrors.map((e, i) => e ?? duplicateErrors[i]);
  const [touched, setTouched] = useState<Set<number>>(new Set());

  return (
    <FormSection title={t('Private Addresses')}>
      <HelperText>
        <HelperTextItem>
          {t(
            'Addresses owned exclusively by this app. Other apps cannot reference these — to share an address, add it to spec.sharedAddresses instead.',
          )}
        </HelperTextItem>
      </HelperText>

      <Stack hasGutter>
        {state.privateAddresses.map((entry, index) => (
          <StackItem key={index}>
            <Stack hasGutter>
              <StackItem>
                <Split hasGutter>
                  <SplitItem isFilled>
                    <FormGroup
                      label={t('Address')}
                      isRequired
                      fieldId={`private-address-${String(index)}`}
                    >
                      <TextInput
                        id={`private-address-${String(index)}`}
                        value={entry.address}
                        onChange={(_e, val) => {
                          dispatch({
                            type: 'UPDATE_ADDRESS_ENTRY',
                            payload: { addressKind: ADDRESS_KIND, index, address: val },
                          });
                        }}
                        onBlur={() => {
                          setTouched((prev) => new Set(prev).add(index));
                        }}
                        placeholder={t('e.g., orders.private')}
                        validated={touched.has(index) && errors[index] ? 'error' : 'default'}
                        isRequired
                        data-test={`private-address-input-${String(index)}`}
                      />
                      {touched.has(index) && errors[index] && (
                        <FormHelperText>
                          <HelperText>
                            <HelperTextItem variant="error">{t(errors[index])}</HelperTextItem>
                          </HelperText>
                        </FormHelperText>
                      )}
                    </FormGroup>
                  </SplitItem>

                  <SplitItem style={{ paddingTop: 'var(--pf-v6-c-form__group-label--PaddingTop)' }}>
                    <Button
                      variant="plain"
                      aria-label={t('Remove private address')}
                      onClick={() => {
                        dispatch({
                          type: 'REMOVE_ADDRESS_ENTRY',
                          payload: { addressKind: ADDRESS_KIND, index },
                        });
                        setTouched((prev) => {
                          const next = new Set<number>();
                          Array.from(prev).forEach((i) => {
                            if (i < index) next.add(i);
                            else if (i > index) next.add(i - 1);
                          });
                          return next;
                        });
                      }}
                      icon={<TimesIcon />}
                      data-test={`remove-private-address-${String(index)}`}
                    />
                  </SplitItem>
                </Split>
              </StackItem>

              <StackItem>
                <Switch
                  id={`private-address-pubsub-${String(index)}`}
                  label={entry.pubSub ? t('Publish / Subscribe') : t('Point-to-Point')}
                  isChecked={entry.pubSub ?? false}
                  onChange={(_e, checked) => {
                    dispatch({
                      type: 'UPDATE_ADDRESS_ENTRY',
                      payload: { addressKind: ADDRESS_KIND, index, pubSub: checked },
                    });
                  }}
                  data-test={`private-address-pubsub-${String(index)}`}
                />
              </StackItem>

              {entry.pubSub && (
                <StackItem>
                  <FormGroup
                    label={t('Subscriptions')}
                    fieldId={`private-address-subscriptions-${String(index)}`}
                  >
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>
                          {t('Durable subscription queue names for this address.')}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                    <SubscriptionListInput
                      inputId={`private-address-subscriptions-${String(index)}`}
                      addressIndex={index}
                      subscriptions={entry.subscriptions ?? []}
                    />
                  </FormGroup>
                </StackItem>
              )}
            </Stack>
          </StackItem>
        ))}

        <StackItem>
          <Button
            variant="link"
            icon={<PlusCircleIcon />}
            onClick={() => {
              dispatch({ type: 'ADD_ADDRESS_ENTRY', payload: { addressKind: ADDRESS_KIND } });
            }}
            data-test="add-private-address-btn"
          >
            {t('Add private address')}
          </Button>
        </StackItem>
      </Stack>
    </FormSection>
  );
};

/**
 * Inline chip input for managing durable subscription queue names on a single
 * address entry. Dispatches ADD_SUBSCRIPTION / REMOVE_SUBSCRIPTION directly so
 * the parent does not need to build or pass callback functions.
 *
 * @param inputId - HTML id for the text input, used for label association
 * @param addressIndex - Position of the owning address entry in the list; forwarded in dispatch payloads
 * @param subscriptions - Current list of subscription names for display
 */
const SubscriptionListInput: React.FC<{
  inputId: string;
  addressIndex: number;
  subscriptions: string[];
}> = ({ inputId, addressIndex, subscriptions }) => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const dispatch = useBrokerAppFormDispatch();
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !subscriptions.includes(trimmed)) {
      dispatch({
        type: 'ADD_SUBSCRIPTION',
        payload: { addressKind: ADDRESS_KIND, addressIndex, name: trimmed },
      });
    }
    setInputValue('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      setInputValue('');
      setIsAdding(false);
    }
  };

  return (
    <LabelGroup
      categoryName={t('Subscriptions')}
      isEditable
      addLabelControl={
        isAdding ? (
          <TextInput
            id={inputId}
            value={inputValue}
            onChange={(_e, val) => {
              setInputValue(val);
            }}
            onBlur={handleConfirm}
            onKeyDown={handleKeyDown}
            placeholder={t('e.g., my-subscription')}
            autoFocus
          />
        ) : (
          <Label
            variant="add"
            onClick={() => {
              setIsAdding(true);
            }}
          >
            {t('Add subscription')}
          </Label>
        )
      }
    >
      {subscriptions.map((sub) => (
        <Label
          key={sub}
          onClose={() => {
            dispatch({
              type: 'REMOVE_SUBSCRIPTION',
              payload: { addressKind: ADDRESS_KIND, addressIndex, name: sub },
            });
          }}
          closeBtnAriaLabel={`${t('Remove')} ${sub}`}
        >
          {sub}
        </Label>
      ))}
    </LabelGroup>
  );
};
