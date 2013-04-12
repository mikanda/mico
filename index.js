var express = require('express');
var mikenchinExpress = require('mikenchin-express');
module.exports = mikenchinExpress({
  components: [
    require('./lib/setup'),
    require('./lib/routes'),
    require('./lib/boot')
  ],
  requestListener: express()
});
