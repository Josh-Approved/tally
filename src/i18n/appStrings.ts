/**
 * App-specific copy. APP-OWNED — every user-facing string in this app's domain
 * screens lives here (canon § Translations: no copy hardcoded in components).
 * Reference it via `t('<key>')` from `../i18n`. Voice canon applies: sentence
 * case, plain second person, no emoji. These overlay the shell strings, so the
 * `common`/`settings`/`about` namespaces extend (not replace) the shell's.
 */

export const APP_STRINGS = {
  // Extends the shell common namespace (back/cancel/done/save/delete/edit/add).
  common: {
    saveChanges: 'Save changes',
    name: 'Name',
    nameRequired: 'Name required',
    none: 'None',
    choose: 'Choose',
    expense: 'Expense',
    income: 'Income',
  },
  home: {
    title: 'Tally',
    searchTitle: 'Search',
    searchComingSoon: 'Coming soon.',
    recurringAddedOne: 'Added {count} recurring transaction.',
    recurringAddedOther: 'Added {count} recurring transactions.',
    spent: 'Spent',
    donutEmpty: 'No transactions yet',
    noExpenses: 'No expenses',
    allAccounts: 'All accounts',
    expense: 'Expense',
    income: 'Income',
  },
  totals: {
    income: 'Income',
    expenses: 'Expenses',
    net: 'Net',
  },
  period: {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    year: 'Year',
  },
  tx: {
    editTitle: 'Edit transaction',
    spent: 'Spent',
    received: 'Received',
    category: 'Category',
    account: 'Account',
    date: 'Date',
    noteOptional: 'Note (optional)',
    notePlaceholder: 'Add a note',
    deleteTitle: 'Delete transaction?',
    deleteMessage: "This can't be undone.",
    listEmpty: 'No transactions yet. Tap + to add one.',
    uncategorized: 'Uncategorized',
  },
  categories: {
    title: 'Categories',
    expenses: 'Expenses',
    income: 'Income',
    empty: 'No categories yet.',
    editTitle: 'Edit category',
    newTitle: 'New category',
    icon: 'Icon',
    namePlaceholderExpense: 'e.g. Coffee',
    namePlaceholderIncome: 'e.g. Bonus',
    add: 'Add category',
  },
  accounts: {
    title: 'Accounts',
    empty: 'No accounts yet.',
    editTitle: 'Edit account',
    newTitle: 'New account',
    add: 'Add account',
    startingBalance: 'Starting balance',
    startingBalanceHint: 'The balance you have right now. Transactions add to this.',
    startingBalancePlaceholder: '0',
    archivedPrefix: 'Archived · ',
    namePlaceholder: 'e.g. Cash, Checking',
  },
  // Extends the shell settings namespace (title/appearance/theme*/language*/about).
  settings: {
    general: 'General',
    currency: 'Currency',
    defaults: 'Defaults',
    defaultAccount: 'Default account',
    defaultCategory: 'Default category',
    library: 'Library',
    categories: 'Categories',
    accounts: 'Accounts',
  },
  // Extends the shell about namespace (support/feedback/source/privacy reused).
  about: {
    blurb: 'Tally — an expense tracker. No paywall. No ads. No tracking. No accounts. Your data stays with you.',
    madeIndependently: 'Made independently. The code is on GitHub.',
  },
} as const;
