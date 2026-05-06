import type { TxKind } from '../data/types';

export type RootStackParamList = {
  Home: undefined;
  AddTransaction: { kind: TxKind; transactionId?: string };
  Settings: undefined;
  Categories: undefined;
  Accounts: undefined;
};
