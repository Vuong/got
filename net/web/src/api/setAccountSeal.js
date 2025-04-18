import { checkResponse, fetchWithTimeout } from './fetchUtil';

export async function setAccountSeal(token, seal) {
  const res = await fetchWithTimeout('/account/seal?agent=' + token, { method: 'PUT', body: JSON.stringify(seal) })
  checkResponse(res);
}

