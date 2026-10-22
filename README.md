

This is a simple Grunt task that implements Trilliant's static site builder. It includes two tasks:
`trilliantBuild` and `trilliantServe`. The former will build static content from templates.
The latter will run `trilliant-webserver` to host a test site locally.

The builder requires a simple options stanza that looks something like this:

```
"options": {
    "site": {
        "name": "<%= meta.site_name %>",
        "cachebust": "<%= grunt.template.today(\"yyyymmddHHMM\") %>",
        "gtm_id": "GTM-00000000",
        "facebook_id": "1234567890"
    },
    "page": {
        "template": "index",
        "show_h1": true
    },

    "output_dir": "www",
    "content_dir": "content",
    "widget_dir": "src/widgets",
    
    "widgets": []
}
```

The options above are mostly self-explanatory. The `site` and `page` sections define variables within certain scopes.
Variables in the `page` scope may be overridden by variables declared in a page's frontmatter. The `content_dir`
field specifies the path for the page contents and `output_dir` is where the built pages are written (default `www`;
it is created if missing). Only files with the extensions `.xht` (preferred), `.htm` and `.md` in `content_dir` are built, and each
`name.ext` is built to `name.html`. The `widget_dir` should include any
widget elements that are callable from your templates; the ones to load are listed in `widgets`. Widgets can include
their own logic, so think of them as scripts that are executed at build time to render various elements. This can be
useful for such things as pulling live data at build time.

## Content

Content is assumed to be HTML and may include a JSON-formatted frontmatter section. The frontmatter must be the first
thing in the file (only whitespace may precede it), begin with `---{` and end with `}---`:

```
---{
    "template": "index",
    "title": "Home",
    "markdown": false
}---
<p>Page body here.</p>
```

- `template` names the template to use, relative to the `tmpl` directory (the `.xht` extension is optional).
- Set `markdown` to `true` to have the body processed as Markdown (using `markdeeper`).
- Frontmatter that cannot be parsed is reported and removed, and the page body is still built.

Before the template is applied, the body gets a first pass that replaces `{{name}}` variables from the `site`, `page`
and `file` scopes (and `id`, the file's base name). This pass supports dotted names only (optional spaces inside the braces are fine), with no filters. Any
variable that cannot be resolved is left in place. The processed body is available to the template as `{{content}}`.

## Templates

Templates live in the `tmpl` directory and use the `.xht` extension by default.

### Variables and filters

`{{ name }}` and `{{ site.name }}` insert a value. Variables that are not defined are left in place, which allows an
inner scope to defer to an outer one (see `EACH`). A filter is applied with a pipe: `{{ price|fixed }}`. Built in:

| Filter | Result |
|---|---|
| `fixed` | Number with two decimal places. |
| `integer` | Integer part (`parseInt`). |
| `json` | JSON string of the value. |
| `slug` | Lower-case, dash-separated string suitable for URLs and ids. |

### Includes

`{%name%}` inserts another template, `name.xht`, found in the same directory as the template that includes it.
`{%$page.header%}` takes the template name from a variable.

### EACH

```
{%EACH list}<li>{{value}} {{site.name}}</li>{%ENDEACH}
```

The body is repeated for every item in `list`. For an array of objects, the item's members are in scope. For an array of
plain values, the value is available as `{{value}}`. For an object, the body is repeated for each key, available as
`{{value}}`. Names that are not found on the item are resolved from the outer scope. `EACH` blocks cannot be nested.

### IF

The simple form is an "if present" test:

```
{%IF page.subtitle}<h2>{{page.subtitle}}</h2>{%ENDIF}
```

The block is output unless the value is undefined, `null`, `false`, an empty string or an empty array. Note that the
number `0` counts as present, so do not use the simple form to test counts or numeric values.

Use the comparator form to compare values:

```
{%IF count > 0}...{%ENDIF}
{%IF page.layout == "wide"}...{%ENDIF}
{%IF user.level != minimum}...{%ENDIF}
```

Supported operators are `==`, `!=`, `<`, `>`, `<=` and `>=`. The left side is a variable. The right side is a quoted
string (which may contain spaces), a number, `true`, `false`, `null` or another variable. There is no `ELSE`. `IF` blocks of either form may be nested.

### Widgets

`{{$name key="value" other="value"$}}` calls the widget `name` (see the `widgets` option) at build time and inserts what
it returns. The widget receives an object with the arguments plus `scope`, the current page data, and may return a
string or a promise of one.

===

The server requires a minimal set of `trilliant-webserver` as an options stanza like this:

```
"options": {
    "port": 8889,
    "rootpath": "www",
    "mimetypes": "etc/mimetypes.json",
    "secure": false
}
```

This will run the test server on port 8889, serving the `www` directory as the root. Setting `secure` to `false` is
necessary since we will not use HTTPS for testing. A mimetypes mapping can also be included. This is helpful if you
are serving content other than HTML.
