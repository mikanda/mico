var preparePage = require('../lib/utils').preparePage;
var sprintf = require('sprintf').sprintf;
var async = require('async');
var fs = require('fs');
module.exports = exports = function (app) {

  /* If we have any page component at the end of the url we check if there is
   * a suitable template on the harddrive.  If this is the case we render it
   * and send it to the client. */

  app.get(exports.getLocalPage.bind(this, app));

  /* If there isn't any matching template on the harddrive we check the
   * database for a suitable document to be served. */

  app.get(exports.getDatabasePage.bind(this, app));
};
exports.getLocalPage = function (app, req, resp, next) {
  var configPath,
      viewPath,
      pageName = req.params.page;

  /* Each view can be equipped with a configuration with which we
   * configure the menu for example.  This configuration has the same
   * name as the view but with the ending `-config.json' and without the
   * .jade extension. */

  viewPath = sprintf('%s/%s.jade', app.express.get('views'), pageName);
  configPath = sprintf('%s/%s-config.json',
                       app.express.get('views'), pageName);
  async.map([viewPath, configPath], fs.stat, function (err, results) {
    if (results == null
        || results[0] == null
        || !results[0].isFile()) {
      next();
    } else {
      var pageConfig;
      if (results[1] && results[1].isFile()) {
        pageConfig = require(configPath);
      } else {
        pageConfig = {};
      }
      resp.render(req.params.page, pageConfig);
    }
  });
};
exports.getDatabasePage = function (app, req, res, next) {
  var nanu = app.require('nanu'),
      page = req.params.page;
  return nanu.design('mico').view('all-pages-by-name', {
    key: page
  }, function (error, couchres) {
    if (error) {
      res.status(404).send(error);
    } else if ((page = couchres.rows[0]) != null) {
      page = preparePage(page.value, app.locals);
      res.render(page.extend, page);
    } else {
      next();
    }
  });
}
