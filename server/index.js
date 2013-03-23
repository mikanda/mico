/* mico is an flexible and extensible cms engine written as application for the
 * mikenchin application server.
 * Copyright (C) 2013  mikanda IT Solutions

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>. */

var fs = require('fs'),
    util = require('util'),
    sprintf = require('sprintf').sprintf,
    jade = require('jade'),
    async = require('async'),
    express = require('express'),
    pageRoute = require('./route/page');
module.exports = function (app, next) {
  var routes = app.require('routes'),
      configuration = app.configuration,
      routingTable;

  /* Since every application gets its own express engine we can safely set
   * the view parameter to utilize the render engine. */

  app.express.set('views', configuration.views);
  app.express.set('view engine', 'jade');
  app.use(express.favicon());
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
  if (configuration.public) {
    app.use(express['static'](configuration.public));
  }
  if (util.isArray(configuration.options)) {
    loadOptions(app, configuration.options, next);
  } else {
    next();
  }
}
function getIndex(app, req, res) {
  res.redirect('/' + (app.locals.defaultPage || 'index'));
}
function getAttachment(req, res, next) {
  req.nano.attachment.get(req.params.id, req.params.name, {}).pipe(res);
}
function loadOptions(app, options, next) {
  var nanu = app.require('nanu');
  async.map(
    options,
    nanu.get.bind(nanu),
    function (errs, results) {
      if (errs) {
        next(errs);
      } else {
        results.forEach(function (result) {
          var s = {},
              key;
          for (key in result) {
            if (!result.hasOwnProperty(key)) continue;
            if (!(key[0] === '_' || key === 'couchapp')) {
              s[key] = result[key];
            }
          }
          app.locals(s);
        });
        next();
      }
    }
  );
}
