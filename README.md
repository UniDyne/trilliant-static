

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

    "content_dir": "content",
    "widget_dir": "src/widgets",
    
    "widgets": []
}
```

The options above are mostly self-explanatory. The `site` and `page` sections define variables within certain scopes.
Variables in the `page` scope may be overridden by variables declared in a page's frontmatter. The `content_dir`
field specifies the path for the page contents. Content is assumed to be HTML and may include a JSON-formatted
frontmatter section that begins with `---{` and ends with `}---`. The `widgets_dir` should include any widget elements
that are callable from your templates. Widgets can include their own logic, so think of them as scripts that are
executed at build time to render various elements. This can be useful for such things as pulling live data at build time.

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
