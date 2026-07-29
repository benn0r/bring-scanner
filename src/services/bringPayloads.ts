import { BringList, Credentials } from '../types';

type ListsResponse = {
  lists?: { listUuid: string; name?: string }[];
};

export function createLoginBody(credentials: Credentials) {
  return new URLSearchParams({
    email: credentials.email.trim(),
    password: credentials.password,
  });
}

export function normalizeLists(body: ListsResponse): BringList[] {
  return (body.lists || []).map((list) => ({
    listUuid: list.listUuid,
    name: list.name || 'Shopping list',
  }));
}

export function createItemBody(label: string, quantity?: number) {
  return new URLSearchParams({
    purchase: label,
    recently: '',
    specification: quantity ? `${quantity}×` : '',
    remove: '',
    sender: 'null',
  });
}
