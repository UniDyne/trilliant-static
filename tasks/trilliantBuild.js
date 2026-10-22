const fs = require('fs'),
    path = require('path');

const Content = require('../src/Content'),
    { addFilter, addWidget, procTemplate, procWidgets } = require('../src/Template');

// 261022-DB : Only these files in content_dir are built. .xht is preferred.
const CONTENT_EXTS = ['.xht', '.htm', '.md'];

module.exports = function(grunt) {
    grunt.registerTask('trilliantBuild', 'Build pages from templates.', buildTemplates);
};

function buildTemplates() {
    let done = this.async();

    // read global settings
    const cfg = this.options({ site: {}, page: {}, content_dir: 'content', widget_dir: "widgets", widgets: [] });

    
    if(cfg.sqlserver) {
        // SQL was specified
        // create global object
        // load that config
        const { SQLServerPool } = require('trilliant-tedious');
        global.SQL = new SQLServerPool(cfg.sqlserver);
        global.SQL.start();
        console.log("SQL Started");
    }
    
    
    addFilter('slug', x => x.toLowerCase().replace(/^\s+|\s+$/g,'').replace(/[^\w]/g,'-').replace(/-{2,}/g,'-') );

    // needs to load from a KNOWN directory set in config...
    // change this so this task can be separated
    for(let i = 0; i < cfg.widgets.length; i++) try {
        addWidget(cfg.widgets[i], require(path.join(process.cwd(), cfg.widget_dir, cfg.widgets[i])));
    } catch(e) {
        console.log(`Error loading widget: ${cfg.widgets[i]}`);
    }

    // get all the contents files
    const contentDir = path.join(process.cwd(), cfg.content_dir);
    const files = fs.readdirSync(contentDir)

    const contents = [];
    for(let i = 0; i < files.length; i++) {
        const filepath = path.join(contentDir, files[i]);
        const st = fs.statSync(filepath);
        if(st.isDirectory()) continue;
        if(!CONTENT_EXTS.includes(path.extname(files[i]).toLowerCase())) continue;

        contents.push( new Content(filepath, st) );
    }
    
    // 261022-DB : Always release SQL and finish the task, even on failure,
    //     otherwise grunt hangs and the error is lost as an unhandled rejection.
    processContent(contents, cfg).then(() => true, e => {
        console.error(e && e.stack || e);
        return false;
    }).then(ok => {
        if(global.SQL) global.SQL.stop();
        done(ok);
    });
}

async function processContent(contents, cfg) {
    const proc = async function(c) {
        let basename = path.basename(c.filepath);
        let ext = path.extname(basename);

        let data = await c.process(cfg);
        let out = procTemplate(data.page.template, data);
        out = await procWidgets(out, data);
        
        // 261021-DB : ensure directory exists - default to original "www" if not defined
        const outdir = path.join(process.cwd(), cfg.output_dir ?? 'www'); 
        if(!fs.existsSync(outdir)) fs.mkdirSync(outdir,{recursive:true});
        fs.writeFileSync(path.join(outdir, path.basename(c.filepath, ext)+'.html'), out);
    };

    const promises = contents.map(proc);
    await Promise.all(promises);
}
