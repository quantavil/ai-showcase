# AI Showcase

**A Zen-Brutal comparison platform for LLM outputs.**

AI Showcase is a curated gallery designed to compare the performance and creative outputs of leading large language models, including **GPT-4o**, **Claude 3.5 Sonnet**, and **Gemini 1.5 Pro**. It focuses on a "Zen-Brutal" aesthetic—clean, sharp-edged, and highly functional.

## ✨ Key Features

- **Interactive Terminal**: Experience prompts being "executed" in real-time with a smooth typewriter animation.
- **Side-by-Side Comparison**: View model responses in a unified grid, complete with performance scores.
- **Global Leaderboard**: Automatically ranked models based on average performance across all tasks.
- **Universal Search**: Instantly filter prompts by title, category, or content.
- **Zen-Brutal UI**:
    - Custom Dark Mode integration.
    - Zero-radius "Brutalist" design language.
    - Noise texture overlays and glassmorphism.
- **Dynamic Content**: Powered by a single JSON catalog for easy expansion.

## 🛠 Technology Stack

- **Frontend**: [Tailwind CSS](https://tailwindcss.com/) (Styling), [Alpine.js](https://alpinejs.dev/) (Reactivity).
- **Markdown Handling**: [Marked.js](https://marked.js.org/).
- **Typography**: Inter & JetBrains Mono (via Google Fonts).

## 📁 Project Structure

```tree
.
├── app.js                 # Frontend application logic (Alpine.js)
├── data/
│   └── catalog.json       # Project metadata and showcase database
├── index.html             # Main entry point and Zen-Brutal UI
├── LICENSE                # Project license (MPL-2.0)
├── outputs/               # Source AI model outputs (.html, .md, .txt)
│   ├── binary-search-impl/ # Coding task results
│   ├── build-landing-page/ # Design task results
│   └── logic-puzzle/       # Reasoning task results
├── README.md              # Project documentation
└── styles.css             # Supplementary custom styles
```

## 🚀 Getting Started

1.  **Clone the repository**.
2.  **Open `index.html`** in any modern web browser.
3.  **Explore**: Use the search bar or category pills to navigate the collection.

## 📊 Data Architecture

The showcase is driven by `data/catalog.json`. To add new content:
1. Drop your model outputs into a subfolder in `outputs/`.
2. Update the `catalog.json` with a new prompt entry, including model scores and file paths.

## ⚖️ License

This project is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**. See the [LICENSE](LICENSE) file for the full text.
