/*! Module dependencies. */

var express = require('express');

/*! Module exports. */

module.exports = {
  name: 'mico-setup',
  install: install
};
function install(app, next) {

  /* Since every application gets its own express engine we can safely set
   * the view parameter to utilize the render engine. */

  app.set('views', app.configuration('views'));
  app.set('view engine', 'jade');
  app.use(express.favicon());
  next();
}
