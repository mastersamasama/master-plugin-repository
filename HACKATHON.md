# OKX Internal Claude Code Hackathon

> Internal use only. See [LICENSE](./LICENSE).

## Timeline

- **Kickoff**: {{KICKOFF_DATE}}
- **Submissions open**: {{SUBMISSIONS_OPEN_DATE}}
- **Submission deadline**: {{SUBMISSION_DEADLINE}}
- **Judging period**: {{JUDGING_START}} – {{JUDGING_END}}
- **Winners announced**: {{WINNERS_ANNOUNCEMENT}}

## Eligibility

- Authorized OKX personnel only
- Solo or team submissions allowed (max team size: {{MAX_TEAM_SIZE}})
- One submission per individual or per team

## Rules

1. **Plugins must run on the latest stable Claude Code release.** Older versions are not supported.
2. **Original work only.** You must own the rights to all code in your submission, or have explicit permission to use third-party code.
3. **No secrets.** No API keys, passwords, internal hostnames, customer data, OKX-confidential infrastructure details, or any other sensitive material in your plugin files. CI does not detect this — it's on your honor and the reviewer's manual check.
4. **Compliance with OKX internal IP, security, and compliance policies.** This is not optional.
5. **License compatibility**: any third-party code you include must be compatible with proprietary internal use (Apache-2.0, MIT, BSD, ISC are typically fine; GPL/AGPL are NOT compatible — do not include).
6. **Plugin must validate cleanly** under `node plugins/official-plugins/scripts/validate.mjs --plugin <your-plugin>`.
7. **Plugin must do something useful.** Trivial "hello world" plugins are not eligible for prizes (though they can serve as learning material).

## Judging criteria

| Dimension | Weight | What the judges look for |
|---|---|---|
| **Technical quality** | 30% | Code clarity, correctness, robustness, error handling, validator-clean |
| **Creativity** | 25% | Novel use of Claude Code primitives (skills, hooks, agents), unexpected angles |
| **Usefulness to OKX workflows** | 25% | Does this solve a real internal problem? Would another OKX engineer install this voluntarily? |
| **Documentation & UX** | 20% | README clarity, skill description quality (third-person trigger phrases), QUICKSTART for users, friendliness of error messages |

## Prizes

- **1st place**: {{FIRST_PRIZE}}
- **2nd place**: {{SECOND_PRIZE}}
- **3rd place**: {{THIRD_PRIZE}}
- **Special category — most useful for engineering productivity**: {{SPECIAL_PRIZE}}
- **Special category — most creative use of agents/hooks**: {{SPECIAL_PRIZE_2}}

## How to submit

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the detailed submission workflow. TL;DR:

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/official-plugins:package-plugin
/official-plugins:submit-plugin
```

## What to submit

Anything that runs as a Claude Code plugin: skills, slash commands, agents, hooks, MCP server integrations, or any combination. Real examples that judges will reward:

- A linter / formatter / generator for an OKX-relevant language or framework
- A workflow automation that ties together internal OKX tools (within compliance)
- A code review or QA agent specialized for OKX engineering practices
- A debugging assistant for an OKX-relevant problem domain
- A documentation generator that follows OKX style guides
- A migration helper for an internal framework upgrade
- An on-call helper that surfaces relevant runbooks

## Pinned Claude Code version

{{CLAUDE_CODE_VERSION}}

If your plugin requires a different version, declare it explicitly in your `plugin.json` description and the reviewer will note it.

## Questions

- Open an issue with the `plugin-submission` template
- Contact hackathon organizers through internal OKX channels: {{ORGANIZER_CONTACT}}

---

*Placeholders marked `{{LIKE_THIS}}` are filled in by the hackathon organizers post-merge.*
