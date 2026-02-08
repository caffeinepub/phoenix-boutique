# Specification

## Summary
**Goal:** Generate an Android release APK artifact for Phoenix Boutique suitable for installation/distribution using the existing release build configuration.

**Planned changes:**
- Add/update Android release build steps to produce a release APK from the repository without manual code edits.
- Ensure the build outputs a single, clearly identifiable APK filename and document the output path/location for maintainers.
- If release signing requires an uncommitted keystore, use safe placeholders (no secrets committed) and document the required signing values/steps.

**User-visible outcome:** Maintainers can run the release build and obtain a single installable Phoenix Boutique release APK with a clear filename, with documented location and signing requirements (if applicable).
