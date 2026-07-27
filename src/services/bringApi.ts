import { BringList, Credentials } from '../types';

const API_URL = 'https://api.getbring.com/rest/v2/';
const API_KEY = process.env.EXPO_PUBLIC_BRING_API_KEY;
type Session = { userUuid: string; token: string };

async function checkedJson(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.message || fallback);
  return body;
}

export async function login(credentials: Credentials): Promise<Session> {
  const response = await fetch(`${API_URL}bringauth`, { method: 'POST', body: new URLSearchParams({ email: credentials.email.trim(), password: credentials.password }) });
  const body = await checkedJson(response, 'Bring sign-in failed. Check your credentials.');
  if (!body.uuid || !body.access_token) throw new Error('Bring returned an incomplete sign-in response.');
  return { userUuid: body.uuid, token: body.access_token };
}

function headers(session: Session) {
  return { 'X-BRING-API-KEY': API_KEY, 'X-BRING-CLIENT': 'webApp', 'X-BRING-CLIENT-SOURCE': 'webApp', 'X-BRING-COUNTRY': 'CH', 'X-BRING-USER-UUID': session.userUuid, Authorization: `Bearer ${session.token}` };
}

export async function loadLists(credentials: Credentials): Promise<BringList[]> {
  const session = await login(credentials);
  const response = await fetch(`${API_URL}bringusers/${session.userUuid}/lists`, { headers: headers(session) });
  const body = await checkedJson(response, 'Could not load Bring lists.');
  return (body.lists || []).map((list: any) => ({ listUuid: list.listUuid, name: list.name || 'Shopping list' }));
}

export async function addItem(credentials: Credentials, listUuid: string, label: string, barcode: string) {
  const session = await login(credentials);
  const body = new URLSearchParams({ purchase: label, recently: '', specification: `EAN ${barcode}`, remove: '', sender: 'null' });
  const response = await fetch(`${API_URL}bringlists/${encodeURIComponent(listUuid)}`, { method: 'PUT', headers: { ...headers(session), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body.toString() });
  if (!response.ok) throw new Error('Bring did not accept the item. Please try again.');
}
