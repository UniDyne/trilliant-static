
const fs = require('fs'),
    path = require('path');

let markdeeper = null;


/*
    Content is a fancy template. It may start with a header that contains JSON data.
    May add Markdown support later.
*/


function loadData(filepath, meta) {
    const data = {
        frontmatter: {},
        tmpl: '',
        meta: meta
    };

    let raw = fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');

    // 261022-DB : Frontmatter must be '---{' at the start of the file, after optional
    //     whitespace only (no /m, so ^ is position 0), and ends at the first '}---'.
    //     A bare '---' rule is not frontmatter.
    let fm = raw.match(/^\s*---\{([\s\S]*?)\}---/);
    if(fm) {
        // strip the frontmatter block even if it fails to parse, so the page body survives
        data.tmpl = raw.replace(fm[0], '');
        try {
            let jdat = `{${fm[1]}}`;
            // quote bare keys, leaving string values alone (a value like "https://x" or
            // "Qty: 5" contains `word:` and must not be treated as a key)
            jdat = jdat.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([a-z0-9_$]+)\s*:/gi, (w, str, key) => {
                if(key) return `"${key}": `;
                return str[0] === "'" ? JSON.stringify(str.slice(1, -1).replace(/\\'/g, "'")) : str;
            });
            data.frontmatter = JSON.parse(jdat);
        } catch(e) { console.log(`Bad frontmatter in '${filepath}'.`); console.log(e); }
    } else data.tmpl = raw;

    return data;
}


module.exports = class Content {
    constructor(filepath, meta) {
        const basename = path.basename(filepath);
        const id = basename.replace(new RegExp(path.extname(basename)+"$"), '');

        this.filepath = filepath;
        this.meta = meta;

        this.data = loadData(filepath, meta);
        this.data.id = id;
    }

    async process(cfg) {
        const data = Object.assign(
            { id: this.data.id, page:{} },
            cfg,
            {
                page: Object.assign({}, cfg.page, this.data.frontmatter),
                file: this.data.meta
            }
        );

        var scopeEval = str => str.replace(/^\s+|\s+$/g,'').split('.').reduce((o,i) => i==='' ? o : o != null ? o[i] : o, data);
        
        /* replace variables */
        // 261021-DB : This is only a partial. No filter support here (see Template).
        //     Also, vars that cannot be mapped are left in place for template pass.
        //     Not a bug. Behaviour as intended. This pass is only for meta / page vars.
        //     Fixed scope eval so bad dotted vars pass through.
        var partial = this.data.tmpl.replace(/\{\{\s*([a-z0-9_\.]+)\s*\}\}/gi, (w,g) => {
            let v = scopeEval(g);
            if(v == undefined) return w;
		    if(v == null) return '';
            return v;
        });

        if(this.data.frontmatter.markdown??false) {
            if(!markdeeper) markdeeper = await import('markdeeper');
            ({ content: partial } = (await markdeeper.processSection(partial)));
        }

        data.content = partial;
        return data;
    }
}
