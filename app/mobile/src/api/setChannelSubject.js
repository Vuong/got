import { checkResponse, fetchWithTimeout } from './fetchUtil';

export async function setChannelSubject(server, token, channelId, dataType, data ) {
  var insecure = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|:\d+$|$)){4}$/.test(server);
  var protocol = insecure ? 'http' : 'https';

  const params = { dataType, data: JSON.stringify(data) };
  const channel = await fetchWithTimeout(`${protocol}://${server}/content/channels/${channelId}/subject?agent=${token}`, { method: 'PUT', body: JSON.stringify(params)} );
  checkResponse(channel);
  return await channel.json();
}
