import { checkResponse, fetchWithTimeout } from './fetchUtil';

export async function removeAccount(node: string, secure: boolean, token: string): Promise<void> {
  let endpoint = `http${secure ? 's' : ''}://${node}/profile?agent=${token}`;
  let { status } = await fetchWithTimeout(endpoint, { method: 'DELETE' });
  checkResponse(status);
}
