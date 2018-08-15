const {
  config,
} = require('visual-cms.website')('hochzeit', __dirname);
const { PublicAPI } = require('ec.sdk');

const dm = new PublicAPI(config.datamanagerURL, { noCookie: true });
dm.setToken(config.accessToken);

const superagent = require('superagent');
const { URL } = require('url');

let currentTokenEntry = null;

async function getAuthForCode(code) {
  const response = await superagent.post('https://accounts.spotify.com/api/token')
  .auth(config.spotify.user, config.spotify.password)
  .type('form')
  .send({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${config.get('publicURL')}spotify`,
  });
  const { access_token, refresh_token, expires_in } = response.body;
  const settings = await dm.entry('spotify', config.spotify.settingsEntryID);
  Object.assign(settings, { access_token, refresh_token, expiration: new Date(new Date().getTime() + (expires_in * 1000)) });
  await settings.save();

  return settings.expiration;
}

async function renewAuth(tokenEntry) {
  const response = await superagent.post('https://accounts.spotify.com/api/token')
  .auth(config.spotify.user, config.spotify.password)
  .type('form')
  .send({
    grant_type: 'refresh_token',
    refresh_token: tokenEntry.refresh_token,
  });
  const { access_token, expires_in } = response.body;
  Object.assign(tokenEntry, { access_token, expiration: new Date(new Date().getTime() + (expires_in * 1000)) });
  await tokenEntry.save();
  currentTokenEntry = tokenEntry;
  return access_token;
}

async function getSpotifyAuth() {
  if (currentTokenEntry && currentTokenEntry.expiration > new Date()) {
    return currentTokenEntry.access_token;
  }
  const settings = await dm.entry('spotify', config.spotify.settingsEntryID);
  if (settings.expiration > new Date()) {
    currentTokenEntry = settings;
    return settings.access_token;
  }
  return renewAuth(settings);
}

async function search(query) {
  const accessToken = await getSpotifyAuth();
  const { body } = await superagent.get(`https://api.spotify.com/v1/search?q=${query}&type=track&market=DE`)
  .set('Authorization', `Bearer ${accessToken}`);
  return body.tracks.items;
}

async function getPlaylistContent() {
  const accessToken = await getSpotifyAuth();
  const response = await superagent.get(config.spotify.playlistURL)
  .set('Authorization', `Bearer ${accessToken}`);
  return response.body;
}

async function addToPlaylist(spotifyURI) {
  const accessToken = await getSpotifyAuth();
  const response = await superagent.post(`${config.spotify.playlistURL}?uris=${spotifyURI}&position=0`)
  .set('Authorization', `Bearer ${accessToken}`);
  return response.status;
}

module.exports = {
  getAuthForCode,
  search,
  getPlaylistContent,
  addToPlaylist,
};
