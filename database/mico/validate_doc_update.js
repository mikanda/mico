function (doc, oldDoc, userCtx) {

    /* First we ensure that every incoming document is properly equipped with a
     * type field.  All views etc. depend on that field. */

    if (typeof doc.type !== 'string') {
        throw({forbidden: 'Document must have a type field'});
    }

    /* The next step is a list of allowed document types and their optional
     * validation functions. */

    var mapping = {
        page: function validatePage () {
            require('name', 'string');
        },

        /* Options documents are documents with misc user data. */

        options: null
    };

    /* Then we inspect the given list and check if all requirements are met. */

    var _map = mapping[doc.type];
    if (_map === undefined) {

        /* If we have no proper type we drop out the request. */

        throw({forbidden: 'Unknown document type'});
    } else if (_map !== null) {

        /* If the mapping is linked with a validation function we fire that
         * function.  As the function has the same lexical scope we don't
         * provide any arguments. */

        _map();
    }
    function require (field, type) {
        if (doc[field] == null) {
            throw({forbidden: 'Document requires a ' + field + ' field'});
        }
        if (type != null) {
            if (typeof doc[field] !== type) {
                throw({forbidden: 'Field ' + field + ' requires ' + type
                       + ' as type'});
            }
        }
    }
}
