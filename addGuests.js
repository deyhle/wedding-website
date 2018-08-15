const {
  config,
  datamanager,
} = require('visual-cms.website')('hochzeit', __dirname);
const { PublicAPI } = require('ec.sdk');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

datamanager.datamanager.setToken(config.accessToken, null, true);

const codeAlphabet = 'ABCDEFGHKLMNPQRSTUVWXYZ123456789'; // must be 32 chars
function generateCode() {
  return [...Array(3)]
    .map(() => Math.floor(crypto.randomBytes(1)[0] / 8)) // 0...255 => 0...31
    .map(i => codeAlphabet[i])
    .join('');
}

const guestsToAdd = [ // arrays with guest names for each card/code
  [ // two adults in one card/code
    { name: 'Waltraud', isChild: false },
    { name: 'Wolfgang', isChild: false },
  ],
  [ // two adults with two children in one card/code
    { name: 'Kathrin', isChild: false },
    { name: 'Benedikt', isChild: false },
    { name: 'David', isChild: true },
    { name: 'Sofia', isChild: true },
  ],
];
guestsToAdd
  .map(guests => async () => {
    const code = generateCode();
    const email = `${code}@${config.fakeEmailDomain}`; // we generate a fake email address for each code
    const password = crypto.createHash('sha256').update(code).digest('base64');
    const userdm = new PublicAPI(config.datamanagerURL, { noCookie: true });
    userdm.setClientID('rest');
    const token = await userdm.signup(email, password);
    userdm.setToken(token);
    const account = jwt.decode(token);
    const accountID = account.sub;
    return guests.map(guest => async () => {
      datamanager.datamanager.setToken(config.accessToken, null, true);
      return datamanager.datamanager.createEntry('guest', Object.assign(guest, {
        answer: 0,
        overnight: 0,
        onlyCeremony: false,
        onlyParty: false,
        invitationCode: code,
        account: accountID,
      }))
        .catch((e) => {
          throw e;
        })
    })
      .reduce((result, promise) => result.then(promise), Promise.resolve())
      .then(() => {
        console.log(`${guests.map(g => g.name).join(', ')}: Code ${code}`);
      });
  })
  .reduce((result, promise) => result.then(promise), Promise.resolve())
  .catch(e => {

    throw e;
  });

