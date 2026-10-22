const Template = require('./src/Template');

// The Grunt tasks are loaded from ./tasks (see Gruntfile.js). This exposes the
// underlying pieces for use from other build scripts.
module.exports = {
    Content: require('./src/Content'),
    Cache: require('./src/Cache').Cache,
    Template: Template.Template,
    addFilter: Template.addFilter,
    addWidget: Template.addWidget,
    procTemplate: Template.procTemplate,
    procWidgets: Template.procWidgets
};
