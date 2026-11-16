# Independent releases

This repository owns `@thuraaung2493/nrc-kit`, its changelog and its own `vX.Y.Z`
tags. There is no shared pipeline with the Laravel package. `release-check.yml`
is manually dispatched and produces a review artifact only. It never publishes,
tags, pushes or creates a GitHub release.

Before a release, review the changelog and version, data checksum/provenance,
optional peer constraints and compatibility matrix. Run `npm ci`, `npm run check`,
`npm run test:matrix`, and the browser checks. Inspect `npm pack --dry-run` and
verify clean consumers. A behavior/data correction requires a parity review and
possibly a separate Laravel correction; releases need not share a version.

Publishing, tags, pushes, npm registration/trusted-publisher configuration and
GitHub releases all require separate explicit authorization. After authorization,
publish the first release manually from the verified package checkout with
`npm publish --access public`, completing npm's authentication prompts.
For future automated releases, configure npm trusted publishing with
least-privilege/OIDC and an approved release environment. No registry
credentials or publish job are included in this implementation. Never publish from the local planning
parent. Do not commit the parent's SPEC.md automatically.
