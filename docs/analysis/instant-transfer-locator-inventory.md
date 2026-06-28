# Instant Transfer Locator Inventory

Date: 2026-06-25

Locator source of truth: `docs/analysis/locator-repository.json`

| Element ID | Screen | Primary Strategy | Fallback Strategy | Confidence |
| --- | --- | --- | --- | --- |
| TRANSFER.INSTANT_TRANSFERS_CARD | Transfers landing | Text / card context | Transfer card text fallback | High |
| TRANSFER.INSTANT_TRANSFER_FORM | Instant Transfer | Form text context | Method tile visibility | High |
| TRANSFER.INSTANT_MOBILE_NUMBER_TILE | Instant Transfer | Text | Contextual method tile | High |
| TRANSFER.INSTANT_CARD_NUMBER_TILE | Instant Transfer | Text | Contextual method tile | High |
| TRANSFER.INSTANT_BANK_ACCOUNT_TILE | Instant Transfer | Text | Contextual method tile | High |
| TRANSFER.INSTANT_PAYMENT_ADDRESS_TILE | Instant Transfer | Text | Contextual method tile | High |
| TRANSFER.INSTANT_WALLET_TILE | Instant Transfer | Text | Contextual method tile | High |
| TRANSFER.INSTANT_BENEFICIARY_SELECTOR | Instant Transfer | Label/context | Combobox fallback | Medium |
| TRANSFER.INSTANT_ADD_NEW_BENEFICIARY_LINK | Instant Transfer | Text | Button/link text fallback | High |
| TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG | Add Beneficiary | Dialog role/text | Popup text fallback | High |
| TRANSFER.INSTANT_NICKNAME_INPUT | Add Beneficiary | Label/context | Textbox fallback | Medium |
| TRANSFER.INSTANT_PHONE_INPUT | Add Beneficiary | Repository then contextual label | Dialog label followed by textbox | High after healing |
| TRANSFER.INSTANT_CARD_INPUT | Add Beneficiary | Repository then contextual label | Dialog label followed by textbox | High after healing |
| TRANSFER.INSTANT_ACCOUNT_NUMBER_INPUT | Add Beneficiary | Repository then contextual label | Dialog label followed by textbox | High after healing |
| TRANSFER.INSTANT_BANK_NAME_SELECTOR | Add Beneficiary | Label/context | Combobox fallback | Medium |
| TRANSFER.INSTANT_PAYMENT_ADDRESS_INPUT | Add Beneficiary | Repository then contextual label | Dialog label followed by textbox | High after healing |
| TRANSFER.INSTANT_WALLET_INPUT | Add Beneficiary | Repository then contextual label | Dialog label followed by textbox | High after healing |

Screenshots are retained as evidence only. Locator decisions were DOM and Playwright-locator driven.

