const {
  config,
  express,
  router,
  csp,
  datamanager,
  nunjucksEnv,
  cache,
} = require('visual-cms.website')('hochzeit', __dirname);
const { PublicAPI } = require('ec.sdk');
const crypto = require('crypto');

const ecUserDM = new PublicAPI(config.datamanagerURL, { noCookie: true });
ecUserDM.setToken(config.accessToken);

async function loginWithCode(code) {
  const email = `${code}@${config.fakeEmailDomain}`;
  const password = crypto.createHash('sha256').update(code).digest('base64');
  const userdm = new PublicAPI(config.datamanagerURL, { noCookie: true  });
  userdm.setClientID('rest');
  const token = await userdm.login(email, password);
  return token;
}

async function sendEmailLink(email) {
  const guestList = await ecUserDM.entryList('guest', { email });
  const guest = guestList.getFirstItem();
  const token = crypto.randomBytes(64).toString('base64').replace(/\+/g, '-') // Convert '+' to '-'
  .replace(/\//g, '_') // Convert '/' to '_'
  .replace(/=+$/, '');
  await ecUserDM.createEntry('mail_token', {
    recipient: guest.email,
    token,
    account: guest.account,
    used: null,
  });
  return guest.email;
}

async function loginWithToken(token) {
  const mailToken = (await ecUserDM.entryList('mail_token', { token })).getFirstItem();
  if (mailToken.used) {
    throw new Error('token already used');
  }
  mailToken.used = new Date().toISOString();
  await mailToken.save();
  const guest = (await ecUserDM.entryList('guest', { account: mailToken.account })).getFirstItem();
  return loginWithCode(guest.invitationCode);
}

module.exports = {
  loginWithCode,
  sendEmailLink,
  loginWithToken,
}
