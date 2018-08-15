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
const nunjucksFilters = require('./lib/nunjucksFilters');
const auth = require('./lib/auth');
const spotify = require('./lib/spotify');
const { promisify } = require('util');
const superagent = require('superagent');

csp['script-src'] = [
  csp.SELF,
  '\'unsafe-inline\'',
  '\'unsafe-eval\'',
];
csp['connect-src'] = [
  csp.SELF,
  '*.entrecode.de',
];
csp['style-src'] = [
  csp.SELF,
  '\'unsafe-inline\'',
  '*.entrecode.de',
  'https://fonts.googleapis.com',
];
csp['font-src'] = [
  'https://fonts.gstatic.com',
  '*.entrecode.de',
  csp.SELF,
];
csp['child-src'] = [
  'https://www.google.com',
  'https://open.spotify.com',
];
csp['img-src'] = [
  '*',
  '\'self\'',
  'data:',
];

/* define your routes here */
router.get('/', (req, res) => {
  const data = {
    loggedIn: !!req.cookies.auth,
    error: req.query.error,
  };
  res.render('index.njk', data);
});

router.post('/code', async (req, res) => {
  const { code } = req.body;
  // login with code
  try {
    const token = await auth.loginWithCode(code.toUpperCase());
    res.cookie('auth', token, { maxAge: 1000 * 60 * 60 * 24 * 28 });
    // redirect to rsvp
    res.redirect('/rsvp');
  } catch (e) {
    res.redirect('/?error=wrong_code');
  }
});

router.post('/email', async (req, res) => {
  const { email } = req.body;
  // send login link for user
  try {
    const sent = await auth.sendEmailLink(email.toLowerCase());
    const message = `Danke, wir haben dir gerade eine E-Mail an ${sent} geschickt. Darin
    findest du einen Link, mit dem du dich einloggen kannst!`;
    res.render('message.njk', { message });
  } catch (e) {
    console.log('wrong_email', e.message, email);
    res.redirect('/?error=wrong_email');
  }
});

router.get('/login', async (req, res) => {
  const { token: mailtoken } = req.query;
  const token = await auth.loginWithToken(mailtoken);
  res.cookie('auth', token, { maxAge: 1000 * 60 * 60 * 24 * 28} );
  res.redirect('/rsvp');
});

router.get('/rsvp', cache.middleware(60), async (req, res) => {
  // render rsvp
  const cookie = req.cookies.auth;
  if (!cookie) {
    return res.redirect('/');
  }
  const userdm = new PublicAPI(config.datamanagerURL, { noCookie: true });
  userdm.setToken(cookie);
  const guests = await userdm.entryList('guest');
  res.render('rsvp.njk', {
    error: req.query.error,
    guests: guests.items,
    loggedIn: true,
  });
});

router.get('/logout', async (req, res) => {
  res.cookie('auth', null, { maxAge: 0 } );
  res.redirect('/');
});


router.get('/music-search', async (req, res) => {
  res.send(await spotify.search(req.query.q));
});

router.get('/music-get', cache.middleware(60), async (req, res) => {
  res.send(await spotify.getPlaylistContent());
});

router.post('/music-add/:uri', async (req, res) => {
  res.send(await spotify.addToPlaylist(req.params.uri));
});

if (process.env.NODE_ENV !== 'production') {
  router.get('/spotify', async (req, res) => {
    const { code } = req.query;
    let expiration = null;
    if (code) {
      expiration = await spotify.getAuthForCode(code);
    }
    return res.render('spotify.njk', { redirect_uri: `${config.get('publicURL')}spotify`, expiration });
  });
}

router.get('/:route', async (req, res) => {
  const { route } = req.params;
  const cookie = req.cookies.auth;
  const protectedRoutes = new Set(['ablauf', 'anfahrt', 'ansprechpartner', 'location', 'musik']);
  if (protectedRoutes.has(route) && !cookie) {
    return res.redirect('/');
  }
  const data = {
    loggedIn: !!cookie,
  }
  try {
    const body = await new Promise(
      (rs, rj) => res.render(`${route}.njk`, data, (e, r) => e ? rj(e) : rs(r))
    );
    res.send(body);
  } catch (e) {
    if (e.message.startsWith('invalid template name')) {
      res.status(404);
      return 'next';
    }
    throw e;
  }
});



router.use((error, req, res, next) => {
  res.render('message.njk', { error });
});

if (module.parent) {
  module.exports = express;
} else {
  const port = process.env.npm_package_config_port || 3003;
  express.listen(port, () => {
    console.log(`dev server listening at http://localhost:${port}/`);
  });
}
