# QVAC Tweet Length Trimmer

Paste text and a character limit, and an on-device AI trims it down to fit while keeping the core meaning. The limit is enforced in code, so the result never exceeds what you asked for even if the model overshoots. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:31003

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

`src/logic.js` first checks whether the pasted text already fits the requested limit — if so it's returned as-is with `modelUsed: false` and no inference runs at all. Otherwise `completion()` is asked to rewrite the text to fit, dropping filler and secondary details first. Small on-device models aren't reliable at counting characters, so the limit is never trusted to the prompt alone: after the model's output comes back, `hardTruncate()` deterministically cuts it to the exact character limit (on a word boundary where possible, with a trailing `...`) if it still overshoots.

## Example

- **Input:** a 220-character paragraph explaining a product change, **limit:** 100
- **Output:** a rewritten sentence that keeps the single most important point, guaranteed to be 100 characters or fewer — even if the model's own rewrite runs long, the response is hard-truncated to fit.

## Setup

Requires Node.js and a machine that can run the QVAC on-device runtime (see the QVAC SDK docs for platform support). `npm install` pulls in `@qvac/sdk`; `npm start` loads the `LLAMA_3_2_1B_INST_Q4_0` model on first run, which can take a moment.

## License

MIT
