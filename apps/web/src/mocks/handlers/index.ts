import { authHandlers } from './auth.handlers';
import { categoriesHandlers } from './categories.handlers';
import { entriesHandlers } from './entries.handlers';

export const handlers = [...authHandlers, ...entriesHandlers, ...categoriesHandlers];
