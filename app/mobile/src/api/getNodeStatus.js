import { checkResponse, fetchWithTimeout } from './fetchUtil';

export async function getNodeStatus(server) {
  var insecure = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|:\d+$|$)){4}$/.test(server);
  var protocol = insecure ? 'http' : 'https';

  let status = await fetchWithTimeout(`${protocol}://${server}/admin/status`, { method: 'GET' });
  checkResponse(status);
  return await status.json();
}

