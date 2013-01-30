function (doc) {
    if (doc.type && doc.type === 'page')
        emit(doc.name, doc);
}
