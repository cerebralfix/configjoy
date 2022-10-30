### Contributing to configjoy

Hello, and thanks for your interesting in contributing to `configjoy`.

Please see our [code of conduct.](CODE_OF_CONDUCT.md)

Generally there are two major forms of contribution that can be made to this project:

- Contributing `.proto` schema files for your project's configuration file format to the tool's "well known" library
- Contributing code changes and improvements to the core `configjoy` utility and GUI.

### Contributing "well known" schema for your project's configuration file format

It's easy and straightforward to contribute a new well known schema to `configjoy`, and only requires two steps:

- Add the `.proto` file for your config to `schema/well_known`, using both the filename _and_ the extension, e.g. `package.json.proto`. See the other schema in that directory for examples of files.
- Add a key value pair into `well_known.json` that maps the file name to the schema file name.

Create a PR with those two changes and we'll take a look.

### Contributing code changes and improvements to the utility or GUI code

We're always happy to receive contributions and bug fixes. The following information may be helpful:

- The GUI is written in [nextjs](https://github.com/vercel/next.js/)
- The tool ships with a built in `protoc` found in `protogen/bin`
- The general pathway of execution is `configjoy` -> `protogen/scripts/protoc-gen-configjoy.js` -> templates are copied from `templates/`, modified and written into various `generated/` directories -> nextjs server is started with `npm run dev`
- Placeholder values in templates are all caps and surrounded by `__` e.g. `__MESSAGE_NAME__`
