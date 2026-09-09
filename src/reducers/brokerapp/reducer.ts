import type { Dispatch } from 'react';
import { createContext, useContext } from 'react';
import type { BrokerAppCapability, BrokerAppCR, BrokerAppSpec } from '../../k8s/types';

export interface MatchLabel {
  id: string;
  key: string;
  value: string;
}

export type AddressField = 'producerOf' | 'consumerOf';

export interface BrokerAppFormState {
  cr: BrokerAppCR;
  matchLabels: MatchLabel[];
  producerOf: string[];
  consumerOf: string[];
}

export type BrokerAppFormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'ADD_ADDRESS'; field: AddressField; payload: string }
  | { type: 'REMOVE_ADDRESS'; field: AddressField; payload: string }
  | { type: 'ADD_MATCH_LABEL' }
  | { type: 'REMOVE_MATCH_LABEL'; payload: string }
  | { type: 'UPDATE_MATCH_LABEL'; payload: { id: string; key: string; value: string } }
  | { type: 'SET_MODEL'; payload: BrokerAppCR; preserveLabels?: boolean };

// --- helpers ---

const buildCapabilities = (
  producerOf: string[],
  consumerOf: string[],
): BrokerAppCapability[] | undefined => {
  const cap: BrokerAppCapability = {};
  if (producerOf.length) cap.producerOf = producerOf.map((a) => ({ address: a }));
  if (consumerOf.length) cap.consumerOf = consumerOf.map((a) => ({ address: a }));
  return Object.keys(cap).length ? [cap] : undefined;
};

// First occurrence wins so duplicate form rows do not overwrite YAML preview values.
const buildMatchLabels = (labels: MatchLabel[]): Record<string, string> | undefined => {
  const result: Record<string, string> = {};
  labels.forEach(({ key, value }) => {
    if (key && !(key in result)) {
      result[key] = value;
    }
  });
  return Object.keys(result).length ? result : undefined;
};

const matchLabelsFromRecord = (record: Record<string, string> | undefined): MatchLabel[] => {
  if (!record || !Object.keys(record).length) {
    return [{ id: String(Date.now()), key: '', value: '' }];
  }
  return Object.entries(record).map(([key, value], i) => ({
    id: `imported-${String(i)}-${String(Date.now())}`,
    key,
    value,
  }));
};

const mergeMatchLabelsWithYaml = (
  formLabels: MatchLabel[],
  yamlLabels: Record<string, string> | undefined,
): MatchLabel[] => {
  if (!yamlLabels) {
    return formLabels;
  }
  const existingKeys = new Set(formLabels.map(({ key }) => key).filter(Boolean));
  const merged = [...formLabels];
  Object.entries(yamlLabels).forEach(([key, value]) => {
    if (!existingKeys.has(key)) {
      merged.push({ id: String(Date.now()), key, value });
      existingKeys.add(key);
    }
  });
  return merged;
};

const addressesFromCapabilities = (
  capabilities: BrokerAppCapability[] | undefined,
  field: AddressField,
): string[] => {
  const arr = capabilities?.[0]?.[field];
  return arr ? arr.map((a) => a.address) : [];
};

/**
 * Derives spec from the form-level state fields.
 * Called once at the reducer tail on the final next-state, so individual cases
 * never need to thread positional argument lists manually.
 */
const buildSpec = ({ matchLabels, producerOf, consumerOf }: BrokerAppFormState): BrokerAppSpec => {
  const resolvedMatchLabels = buildMatchLabels(matchLabels);
  const capabilities = buildCapabilities(producerOf, consumerOf);
  const spec: BrokerAppSpec = {};
  if (resolvedMatchLabels) spec.selector = { matchLabels: resolvedMatchLabels };
  if (capabilities) spec.capabilities = capabilities;
  return spec;
};

// --- reducer ---

export const brokerAppReducer = (
  state: BrokerAppFormState,
  action: BrokerAppFormAction,
): BrokerAppFormState => {
  let next = { ...state };

  switch (action.type) {
    case 'SET_NAME':
      return {
        ...state,
        cr: { ...state.cr, metadata: { ...state.cr.metadata, name: action.payload } },
      };

    case 'ADD_ADDRESS': {
      if (state[action.field].includes(action.payload)) return state;
      next[action.field] = [...state[action.field], action.payload];
      break;
    }

    case 'REMOVE_ADDRESS': {
      next[action.field] = state[action.field].filter((a) => a !== action.payload);
      break;
    }

    case 'ADD_MATCH_LABEL': {
      next.matchLabels = [...state.matchLabels, { id: String(Date.now()), key: '', value: '' }];
      break;
    }

    case 'REMOVE_MATCH_LABEL': {
      next.matchLabels = state.matchLabels.filter((l) => l.id !== action.payload);
      break;
    }

    case 'UPDATE_MATCH_LABEL': {
      next.matchLabels = state.matchLabels.map((l) =>
        l.id === action.payload.id
          ? { ...l, key: action.payload.key, value: action.payload.value }
          : l,
      );
      break;
    }

    case 'SET_MODEL': {
      const newCr = action.payload;
      if (action.preserveLabels) {
        const mergedMatchLabels = mergeMatchLabelsWithYaml(
          state.matchLabels,
          newCr.spec.selector?.matchLabels,
        );
        next = {
          ...state,
          matchLabels: mergedMatchLabels,
          producerOf: addressesFromCapabilities(newCr.spec.capabilities, 'producerOf'),
          consumerOf: addressesFromCapabilities(newCr.spec.capabilities, 'consumerOf'),
          cr: newCr,
        };
      } else {
        next = {
          ...state,
          matchLabels: matchLabelsFromRecord(newCr.spec.selector?.matchLabels),
          producerOf: addressesFromCapabilities(newCr.spec.capabilities, 'producerOf'),
          consumerOf: addressesFromCapabilities(newCr.spec.capabilities, 'consumerOf'),
          cr: newCr,
        };
      }
      break;
    }

    default:
      return state;
  }

  return { ...next, cr: { ...next.cr, spec: buildSpec(next) } };
};

export const createInitialBrokerAppState = (namespace: string): BrokerAppFormState => ({
  cr: {
    apiVersion: 'broker.arkmq.org/v1beta2',
    kind: 'BrokerApp',
    metadata: { name: 'my-messaging-app', namespace },
    spec: {},
  },
  matchLabels: [{ id: String(Date.now()), key: '', value: '' }], // MatchLabel id is kept — it guards against duplicate key-entry collisions on rapid adds
  producerOf: [],
  consumerOf: [],
});

export const BrokerAppFormStateContext = createContext<BrokerAppFormState | undefined>(undefined);
export const BrokerAppFormDispatchContext = createContext<
  Dispatch<BrokerAppFormAction> | undefined
>(undefined);

export const useBrokerAppFormState = (): BrokerAppFormState => {
  const ctx = useContext(BrokerAppFormStateContext);
  if (!ctx)
    throw new Error('useBrokerAppFormState must be used inside BrokerAppFormStateContext.Provider');
  return ctx;
};

export const useBrokerAppFormDispatch = (): Dispatch<BrokerAppFormAction> => {
  const ctx = useContext(BrokerAppFormDispatchContext);
  if (!ctx)
    throw new Error(
      'useBrokerAppFormDispatch must be used inside BrokerAppFormDispatchContext.Provider',
    );
  return ctx;
};
