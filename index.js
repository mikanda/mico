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

/*jslint nomen: true, plusplus: true */
'use strict';
module.exports = function (app, configuration, namespace, callback) {
    var fs = require('fs'),
        sprintf = require('sprintf').sprintf,
        jade = require('jade'),
        async = require('async'),
        express = require('express'),
        Nanu = require('nanu').Nanu,
        nanu = new Nanu(configuration.database.name,
                        configuration.database.host);

    /* Since every application gets its own express engine we can safely set
     * the view parameter to utilize the render engine. */

    app.set('views', configuration.views);
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.get('/attachment/:id/:name', function (req, res, next) {
        req.nano.attachment.get(req.params.id, req.params.name, {}).pipe(res);
    });

    /* If we have any page component at the end of the url we check if there is
     * a suitable template on the harddrive.  If this is the case we render it
     * and send it to the client. */

    app.get('/:page', function (req, resp, next) {
        var configPath,
            viewPath,
            pageName = req.params.page;

        /* Each view can be equipped with a configuration with which we
         * configure the menu for example.  This configuration has the same
         * name as the view but with the ending `-config.json' and without the
         * .jade extension. */

        viewPath = sprintf('%s/%s.jade', app.get('views'), pageName);
        configPath = sprintf('%s/%s-config.json',
                             app.get('views'), pageName);
        async.map([viewPath, configPath], fs.stat, function (err, results) {
            /*jslint eqeq: true */
            if (results == null
                    || results[0] == null
                    || !results[0].isFile()) {
                /*jslint eqeq: false */
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
    });

    /* If there isn't any matching template on the harddrive we check the
     * database for a suitable document to be served. */

    app.get('/:page', function (req, res, next) {
        var page = req.params.page;
        return nanu.design('mico').view('all-pages-by-name', {
            key: page
        }, function (error, couchres) {
            var proto = '__proto__',
                config,
                key,
                fn;
            if (error) {
                res.status(404).send(error);
            } else if ((page = couchres.rows[0]) !== undefined) {
                page = page.value;
                config = page;
                config[proto] = app.locals;

                /* Each page template gets a function called `attachment'
                 * with which it can render a link to an attachment. */

                page.attachment = function (id, attachment) {
                    /*jslint eqeq: true */
                    if (attachment == null) {
                        /*jslint eqeq: false */
                        attachment = id;
                        id = page._id;
                    }
                    return namespace + 'attachment/' + id + '/' + attachment;
                };
                for (key in page) {
                    if (page.hasOwnProperty(key)) {
                        switch (key) {
                        case 'title':
                        case 'type':
                        case '_id':
                        case '_rev':
                        case 'format':
                        case 'name':
                        case 'extend':
                            break;
                        default:

                            /* Each field is precompiled. */

                            if (typeof page[key] === 'string') {
                                fn = jade.compile(page[key]);
                                page[key] = fn(config);
                            }
                        }
                    }
                }
                config[proto] = app.locals;
                res.render(page.extend, config);
            }
        });
    });
    if (typeof configuration.options === 'object') {
        async.map(
            configuration.options,
            nanu.get.bind(nanu),
            function (errs, results) {
                if (errs) {
                    callback(errs);
                } else {
                    results.forEach(function (result) {
                        var s = {},
                            key;
                        for (key in result) {
                            if (result.hasOwnProperty(key)
                                && !(
                                    key[0] === '_'
                                        || key === 'couchapp')
                               ) {
                                   s[key] = result[key];
                               }
                        }
                        app.locals(s);
                    });
                    callback();
                }
            }
        );
    } else {
        callback();
    }
};
