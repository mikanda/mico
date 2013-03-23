var jade = require('jade');
exports.preparePage = function (page, locals) {

  /*! Some keys are ignored on compilation. */

  var verbatimKeys;
  verbatimKeys = [
    'title',
    'type',
    '_id',
    '_rev',
    'format',
    'name',
    'extend'
  ];

  /* Each page template gets a function called `attachment'
   * with which it can render a link to an attachment. */

  page.attachment = exports.attachment.bind(page);
  for (key in page) {
    if (!page.hasOwnProperty(key)) continue;
    if (verbatimKeys.indexOf(key) === -1) {

      /* Each field is precompiled. */

      if (typeof page[key] === 'string') {
        fn = jade.compile(page[key]);
        page[key] = fn(page);
      }
    }
  }
  page.__proto__ = locals;
  return page;
}
exports.attachment = function (page, id, attachment) {
  if (attachment == null) {
    attachment = id;
    id = page._id;
  }
  return app.locals.url(
    [
      'attachment',
      id,
      attachment
    ].join('/')
  );
}
