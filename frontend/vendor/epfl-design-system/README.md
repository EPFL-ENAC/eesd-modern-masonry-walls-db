# epfl-design-system (vendored)

The parts of [EPFL-ENAC/epfl-design-skill](https://github.com/EPFL-ENAC/epfl-design-skill)
this app uses, copied unchanged from commit `55fc0a8b7fcff0bf5533923a88ed66ab41023c8d`.
That repository is private, so a GitHub dependency on it breaks `pnpm install`
in CI and in the Docker build. `quasar.config.js` aliases `epfl-design-system`
here, so imports read as they would from the package.

No font files: `tokens/fonts.css` loads Suisse Int'l from
`https://enac-it-fonts.epfl.ch`, which serves `*.epfl.ch` sites only (and
`localhost` from the EPFL network or VPN).

Don't edit these files. To update, copy a newer commit over them:

```bash
git -C ../epfl-design-skill archive <commit> css tokens/colors_and_type.css tokens/fonts.css \
  kits/quasar/epfl-quasar-brand.css kits/vue assets/svg/epfl-logo.svg \
  | tar -x -C vendor/epfl-design-system
```

and put the new commit in this README.
