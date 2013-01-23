/*jslint nomen: true, plusplus: true */
'use strict';

/* mico uses a template cache. */

var templateCache = {};
module.exports = function (app, configuration) {
    var fs = require('fs'),
        sprintf = require('sprintf').sprintf,
        jade = require('jade'),
        async = require('async'),
        nano = require('nano');
    nano = nano(configuration.database.host
                           + '/'
                           + configuration.database.name);
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
        var page = req.params.page,
            renderTemplate = function (template, config) {
                var templatePath
                        = configuration.views + '/' + template + '.jade',
                    cacheEntry = templateCache[templatePath];
                fs.stat(templatePath, function (error, stat) {
                    if (error) {
                        next(error);
                    } else if (cacheEntry
                                   && cacheEntry.timestamp >= stat.mtime) {
                        res.end(cacheEntry.fn(config));
                    } else {
                        fs.readFile(templatePath, function (error, file) {
                            var fn;
                            if (error) {
                                next(error);
                            }
                            cacheEntry = templateCache[templatePath] = {
                                fn: jade.compile(file),
                                timestamp: new Date()
                            };
                            res.end(cacheEntry.fn(config));
                        });
                    }
                });
            };
        return req.nano.view('mikenchin', 'all-pages-by-name', {
            key: page
        }, function (error, couchres) {
            var proto = '__proto__',
                config,
                key,
                fn;
            if (error) {
                res.send(error);
                res.end();
            } else if ((page = couchres.rows[0]) !== undefined) {
                page = page.value;
                config = page;
                config[proto] = app.locals;

                /* The page content can be written in various formats.  At the
                 * moment we support markdown and jade.  The name of the
                 * desired engine should be given in the `format' key. */

                if (req.locals) {
                    for (key in req.locals) {
                        if (req.locals.hasOwnProperty(key)) {
                            page[key] = req.locals[key];
                        }
                    }
                }

                /* Each page template gets a function called `attachment'
                 * with which it can render a link to an attachment. */

                page.attachment = function (id, attachment) {
                    /*jslint eqeq: true */
                    if (attachment == null) {
                        /*jslint eqeq: false */
                        attachment = id;
                        id = page._id;
                    }
                    return '/attachment/' + id + '/' + attachment;
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
            }
            config[proto] = app.locals;
            renderTemplate(page.extend, config);
        });
    });
};
