# Project: AI Showcase

## Overview
A Zen-Brutal comparison platform for LLM outputs. It allows users to compare results from GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro across various tasks (coding, creative, logic). Built with HTML, Vanilla CSS, and Alpine.js.

## Structure
.
├── app.js                 # Alpine.js application logic
├── data/
│   └── catalog.json       # Central database of prompts and outputs
├── index.html             # Main entry point (UI)
├── outputs/               # Directory for model outputs
│   ├── binary-search-impl/
│   ├── build-landing-page/
│   ├── icici-pulse/       # New addition: DigiPulse v2 demo
│   └── logic-puzzle/
├── styles.css             # Supplemental styles
└── README.md              # Documentation

## Conventions
- **Zen-Brutal Aesthetic**: Sharp edges (zero radius), high contrast, monochromatic with subtle gradients.
- **Catalog-Driven**: All content must be registered in `data/catalog.json`.
- **Output Paths**: `app.js` expects outputs to be in `outputs/{prompt-id}/{filename}`.

## Dependencies & Setup
- Tailwind CSS (via CDN)
- Alpine.js (via CDN)
- Marked.js (via CDN)

## Critical Information
- `app.js` handles routing via URL hash: `#prompt-id/output-index`.
- The noise texture is global and applied via SVG filter in `index.html`.

## Insights
- Simple JSON-based architecture makes it easy to scale comparison data.

## Blunders
- [2026-04-02] Initializing MEMORY.md after project start → Always check for MEMORY.md first.
