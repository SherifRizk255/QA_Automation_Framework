# Accounts Management Blocker Inventory

| Blocker ID | Screen / Stage | Evidence | Classification | Handling Rule | Impact |
| --- | --- | --- | --- | --- | --- |
| BLK-AM-001 | Login | Active-session prompt appeared during walkthrough. Screenshot captured by existing login flow at `reports/active-session-popup.png`. | Known business blocker | Verify prompt text, capture evidence, click visible `PROCEED` / approved confirmation control, continue login. | Can interrupt every login and must be reported, not hidden. |
| BLK-AM-002 | Dashboard / Accounts | Error toast: `Error fetching theme` observed on dashboard/accounts screenshots. | Environment issue or application defect candidate | Do not dismiss unless it blocks workflow. Capture in screenshots and document. | Does not appear to block Accounts summary, but may indicate environment instability. |
| BLK-AM-003 | Deeper account details discovery | Session-expired modal appeared during one deeper walkthrough attempt. | Environment issue / access-session blocker | Capture evidence; rerun only if needed; do not bypass session rules. | Prevented reliable inventory of account details, identifier view, statement controls. |
| BLK-AM-004 | Statement screens | Guessed statement routes returned page-not-found. | Requirement ambiguity / navigation gap | Do not invent route or locator. Request navigation path or inspect with a stable application menu when available. | REQ-9 automation is blocked until statement navigation/download controls are discovered. |

