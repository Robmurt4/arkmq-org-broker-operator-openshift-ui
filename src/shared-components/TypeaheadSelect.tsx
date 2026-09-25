import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
} from '@patternfly/react-core';

export interface TypeaheadSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  onClose?: () => void;
  options: string[];
  placeholder: string;
  ariaLabel: string;
  allowCreate?: boolean;
  emptyText: string;
  error?: string;
  isDisabled?: boolean;
  dataTest?: string;
}

/**
 * Typeahead select with optional "Create" option for values not in the list.
 * Manages its own open/close state internally. Encapsulates the PatternFly
 * Select + MenuToggle + TextInputGroup boilerplate used across form typeaheads.
 *
 * @param value - Current input value (controlled)
 * @param onChange - Called on every keystroke for typeahead filtering
 * @param onSelect - Called when the user picks an option from the dropdown
 * @param onClose - Called when the dropdown closes without a selection (blur/escape)
 * @param options - Pre-filtered options to display
 * @param emptyText - Text shown when options list is empty
 * @param allowCreate - When true, shows a "Create" option for values not in the list
 */
export const TypeaheadSelect: React.FC<TypeaheadSelectProps> = ({
  id,
  value,
  onChange,
  onSelect,
  onClose,
  options,
  placeholder,
  ariaLabel,
  allowCreate,
  emptyText,
  error,
  isDisabled,
  dataTest,
}) => {
  const { t } = useTranslation('plugin__arkmq-org-broker-operator-openshift-ui');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Select
        id={id}
        isOpen={isOpen}
        onSelect={(_e, val) => {
          onSelect(String(val));
          setIsOpen(false);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setIsOpen(false);
            onClose?.();
          }
        }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            status={error ? 'danger' : undefined}
            onClick={() => {
              if (!isDisabled) setIsOpen(!isOpen);
            }}
            isExpanded={isOpen}
            isFullWidth
            isDisabled={isDisabled}
          >
            <TextInputGroup isPlain>
              <TextInputGroupMain
                value={value}
                onClick={() => {
                  if (!isDisabled) setIsOpen(true);
                }}
                onChange={(_e, val) => {
                  onChange(val);
                  if (!isOpen && !isDisabled) setIsOpen(true);
                }}
                autoComplete="off"
                placeholder={placeholder}
                aria-label={ariaLabel}
              />
            </TextInputGroup>
          </MenuToggle>
        )}
        data-test={dataTest}
      >
        <SelectList>
          {allowCreate && value.trim() && !options.includes(value.trim()) && (
            <SelectOption value={value.trim()}>
              {t('Create "{{value}}"', { value: value.trim() })}
            </SelectOption>
          )}
          {options.length > 0 ? (
            options.map((opt) => (
              <SelectOption key={opt} value={opt}>
                {opt}
              </SelectOption>
            ))
          ) : (
            <SelectOption isDisabled value="">
              {emptyText}
            </SelectOption>
          )}
        </SelectList>
      </Select>
      {error && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="error">{t(error)}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </>
  );
};
