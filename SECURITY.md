# Security policy

## Supported version

Security updates apply to the latest published MaglaSync Free version.

## Report privately

Use GitHub private vulnerability reporting. Never open a public issue containing passwords, tokens, private conversations, personal information, or exploit details.

## Designed boundaries

- Manifest V3.
- No remotely hosted code.
- No `eval` or dynamic script download.
- Only the `storage` extension permission.
- Host access limited to ChatGPT, Claude, and Gemini.
- No backend or analytics endpoint.
- User must press Send; the extension does not submit chat messages automatically.
- Backup imports are hash-chain verified before replacement.

## Important limitations

- Local Chrome extension storage is not encrypted.
- A person or malicious program controlling the browser profile can read or replace local extension data.
- SHA-256 chaining detects alteration of an existing history; it does not authenticate who wrote a message or prove that a factual claim is true.
- Supported AI pages can change structure. A selector mismatch may prevent capture or context insertion.
- Do not use the Free edition as the only record for medical, legal, financial, security-critical, or irreversible decisions.

