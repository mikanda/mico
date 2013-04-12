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

var util = require('util');
var async = require('async');
var express = require('express');
module.exports = {
  name: 'mico-boot',
  dependencies: [
    require('mikenchin-nanu')
  ],
  install: install
};
function install(app, next) {
  var configuration = app.configuration;
  if (configuration('public')) {
    app.use(express['static'](configuration.public));
  }
  if (util.isArray(configuration.options)) {
    loadOptions(app, configuration.options, next);
  } else {
    next();
  }
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
