# Contributing Guidelines

Guidelines for contributing to GSS.


## Issues

Issues are most appropriate for bugs and other problems encountered using GSS. Ideally, include a demo project (GitHub repo, CodePen, JSFiddle, etc) that focuses on the issue.

Please search existing issues before filing new ones.


## Pull requests

Pull requests should be issued from dedicated branches, as opposed to `master`.

It may be worth opening an issue to discuss feature requests and major changes before attemping to implement them.

Prefixing a pull request will `[WIP]` and committing early is a good way to get feedback without too much investment.


## Questions

When questions are asked, consider providing an answer by opening a pull request against the GSS documentation.


## Dependencies

Dependencies should be referenced by an appropriate version number or tag and never by overly-permissive references such as branch names or `*`. In the case that a dependency has no available versions or tags, use a git commit SHA.


## Releases

Releases should always be made from `master` and follow [semantic versioning](http://semver.org/).

References in code to the version number should be updated before building for distribution and tagging a new release.

Prefer using the [GitHub UI](https://github.com/gss/engine/releases/new) and provide useful release notes.

Lastly, releases should be published to npm by running `npm publish`.
