var pageRoute = require('./route/page');
module.exports = {
  name: 'mico-routes',
  dependencies: [
    require('mikenchin-routes')
  ],
  install: install
};
function install(app, next) {
  var routes = app.require('routes');
  routingTable = [
    [
      '/',
      function (app) {
        app.get(getIndex.bind(this, app));
      }
    ],
    [
      '/attachment/:id/:name',
      function (app) {
        app.get(getAttachment.bind(this, app));
      }
    ],
    [ '/:page', pageRoute ]
  ];
  routes(routingTable);
  next();
}
function getIndex(app, req, res) {
  res.redirect('/' + (app.express.locals.defaultPage || 'index'));
}
function getAttachment(req, res, next) {
  req.nano.attachment.get(req.params.id, req.params.name, {}).pipe(res);
}
