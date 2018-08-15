const { nunjucksEnv } = require('visual-cms.website')('hochzeit', __dirname);

const minifiedFiles = require('../static/manifest.json');

// allow "data-" attributes
nunjucksEnv.xss.onIgnoreTagAttr = (tag, name, value) => {
  if (name.substr(0, 5) === 'data-') {
    return `${name}="${nunjucksEnv.xss.xss.escapeAttrValue(value)}"`;
  }
  return undefined;
};
nunjucksEnv.xss.whiteList.a.push('rel');
nunjucksEnv.xss.safeAttrValue = (tag, name, value, cssFilter) => {
  if (tag === 'a' && name === 'href' && /^[A-Za-z0-9#/?&=_\-.]+$/.test(value)) {
    return value;
  }
  // use the default safeAttrValue function to process it
  return nunjucksEnv.xss.xss.safeAttrValue(tag, name, value, cssFilter);
};
nunjucksEnv.addFilter('getMinifiedFile', (filename) => {
  if (filename in minifiedFiles) {
    return minifiedFiles[filename];
  }
  throw new Error(`${filename} was not found in manifest.json.`);
});

nunjucksEnv.addFilter('json', (json) => {
  try {
    return nunjucksEnv.filters.safe(JSON.stringify(json));
  } catch (err) {
    return json;
  }
});
