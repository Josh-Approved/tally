/**
 * Brazilian Portuguese (pt-BR) domain-string overlay for tally. Mirrors
 * appStrings.ts. Merged on top of SHELL_LOCALES['pt-BR'] in locales.ts. Voice
 * canon: plain, calm, second person, sentence case. {placeholder} kept verbatim.
 */

const pt_BR = {
  common: {
    saveChanges: 'Salvar alterações',
    name: 'Nome',
    nameRequired: 'Nome obrigatório',
    none: 'Nenhum',
    choose: 'Escolher',
    expense: 'Despesa',
    income: 'Receita',
  },
  home: {
    title: 'Tally',
    searchTitle: 'Buscar',
    searchComingSoon: 'Em breve.',
    recurringAddedOne: '{count} transação recorrente adicionada.',
    recurringAddedOther: '{count} transações recorrentes adicionadas.',
    spent: 'Gasto',
    donutEmpty: 'Ainda não há transações',
    noExpenses: 'Sem despesas',
    allAccounts: 'Todas as contas',
    expense: 'Despesa',
    income: 'Receita',
  },
  totals: {
    income: 'Receitas',
    expenses: 'Despesas',
    net: 'Líquido',
  },
  period: {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
  },
  tx: {
    editTitle: 'Editar transação',
    spent: 'Gasto',
    received: 'Recebido',
    category: 'Categoria',
    account: 'Conta',
    date: 'Data',
    noteOptional: 'Nota (opcional)',
    notePlaceholder: 'Adicionar uma nota',
    deleteTitle: 'Excluir transação?',
    deleteMessage: 'Isso não pode ser desfeito.',
    listEmpty: 'Ainda não há transações. Toque em + para adicionar uma.',
    uncategorized: 'Sem categoria',
  },
  categories: {
    title: 'Categorias',
    expenses: 'Despesas',
    income: 'Receitas',
    empty: 'Ainda não há categorias.',
    editTitle: 'Editar categoria',
    newTitle: 'Nova categoria',
    icon: 'Ícone',
    namePlaceholderExpense: 'ex.: Café',
    namePlaceholderIncome: 'ex.: Bônus',
    add: 'Adicionar categoria',
  },
  accounts: {
    title: 'Contas',
    empty: 'Ainda não há contas.',
    editTitle: 'Editar conta',
    newTitle: 'Nova conta',
    add: 'Adicionar conta',
    startingBalance: 'Saldo inicial',
    startingBalanceHint: 'O saldo que você tem agora. As transações se somam a ele.',
    startingBalancePlaceholder: '0',
    archivedPrefix: 'Arquivada · ',
    namePlaceholder: 'ex.: Dinheiro, Conta corrente',
  },
  settings: {
    general: 'Geral',
    currency: 'Moeda',
    defaults: 'Padrões',
    defaultAccount: 'Conta padrão',
    defaultCategory: 'Categoria padrão',
    library: 'Biblioteca',
    categories: 'Categorias',
    accounts: 'Contas',
  },
  about: {
    blurb: 'Tally — um controle de gastos. Sem paywall. Sem anúncios. Sem rastreamento. Sem contas. Seus dados ficam com você.',
    madeIndependently: 'Feito de forma independente. O código está no GitHub.',
  },
};
export default pt_BR;
