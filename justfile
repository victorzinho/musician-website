import '~/.config/bosun/recipes/npm.just'

# The dev server, after the checks.
start: check
    npm run dev

# Every link, other sites' too; weekly in CI (.github/workflows/links.yml).
check-external-links: setup
    npm run links

# The Astro docs at package.json's config.astroDocsCommit, in .docs/astro.
docs:
    npm run docs
