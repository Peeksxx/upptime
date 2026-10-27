# BR Productions Status

Uptime monitoring and public status page for BR Productions services, built on [Upptime](https://upptime.js.org). Checks run on GitHub Actions, incidents are tracked as GitHub Issues, and the status page is served from GitHub Pages.

[![Uptime CI](https://github.com/peeksxx/upptime/workflows/Uptime%20CI/badge.svg)](https://github.com/peeksxx/upptime/actions/workflows/uptime.yml)
[![Response Time CI](https://github.com/peeksxx/upptime/workflows/Response%20Time%20CI/badge.svg)](https://github.com/peeksxx/upptime/actions/workflows/response-time.yml)
[![Graphs CI](https://github.com/peeksxx/upptime/workflows/Graphs%20CI/badge.svg)](https://github.com/peeksxx/upptime/actions/workflows/graphs.yml)
[![Static Site CI](https://github.com/peeksxx/upptime/workflows/Static%20Site%20CI/badge.svg)](https://github.com/peeksxx/upptime/actions/workflows/site.yml)
[![Summary CI](https://github.com/peeksxx/upptime/workflows/Summary%20CI/badge.svg)](https://github.com/peeksxx/upptime/actions/workflows/summary.yml)

Status page: [status.peeksxx.dev](https://status.peeksxx.dev)

## How it works

Uptime CI checks each monitored endpoint on a regular schedule and records the result in [history](./history). A failed check opens an issue labeled `status`, which appears as an incident on the status page and closes when the service recovers. Graphs CI regenerates response time and uptime graphs, and Static Site CI publishes the page.

## Configuration

Monitored sites and page settings are defined in [.upptimerc.yml](./.upptimerc.yml). The page layout is customized by [assets/minimal.js](./assets/minimal.js).

## License

Released under the [MIT License](./LICENSE). Data in the [history](./history) directory is available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).
