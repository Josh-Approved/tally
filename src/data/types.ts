export type TxKind = 'expense' | 'income';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemePref = 'system' | 'light' | 'dark';

export interface Account {
  id: string;
  name: string;
  startingBalanceMinor: number;
  colorToken: string;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  kind: TxKind;
  icon: string;
  colorToken: string;
  sortOrder: number;
  hidden: boolean;
}

export interface Transaction {
  id: string;
  kind: TxKind;
  amountMinor: number;
  accountId: string;
  categoryId: string;
  occurredAt: string;
  note: string | null;
  recurringRuleId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RecurringRule {
  id: string;
  kind: TxKind;
  amountMinor: number;
  accountId: string;
  categoryId: string;
  note: string | null;
  frequency: Frequency;
  interval: number;
  startDate: string;
  nextDueDate: string;
  paused: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Settings {
  currencyCode: string;
  defaultCategoryId: string | null;
  defaultAccountId: string | null;
  theme: ThemePref;
  syncEnabled: boolean;
}
