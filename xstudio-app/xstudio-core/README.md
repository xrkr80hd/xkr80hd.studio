# XSTUDIO core snapshot

This directory preserves the installed XSTUDIO plugin's production specification, references, contracts, and validation/formatting scripts from version 1.0.14. Source: the user's installed `gpt-5b34fae90ccd40f336e1f9d725707106` plugin.

The owner dashboard reads `references/contract.json` to show its six-view and Flow text limits. The Python scripts are preserved for a later server-side production pipeline; the current web app does not execute them or claim to generate images.

Keep this directory server-side. Only the XSTUDIO logo is copied to `public/`.
