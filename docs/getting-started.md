<!-- Simple getting started guide -- Used as a placeholder page -->

Compare GitHub release notes. Supports URL parameters for direct linking to comparisons.

**Available Parameters**

- `repo` - GitHub Repository in `owner/name` format
- `from` - Starting release tag
- `to` - Ending release tag
- `prereleases` - Include Pre-releases (`true` or `false`)

**Notes**

- All three main parameters (`repo`, `from` and `to`) are required for the comparison to work.
- Make sure to [URL encode](https://en.wikipedia.org/wiki/Percent-encoding) special characters in parameter values if needed

**Examples**

Basic comparison

<https://example.com/?repo=picocss/pico&from=v1.5.10&to=v2.0.0>

Basic comparison including Pre-release

<https://example.com/?repo=picocss/pico&from=v1.5.10&to=v2.0.0&prereleases=true>
