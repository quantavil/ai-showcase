document.addEventListener('alpine:init', () => {
    Alpine.data('showcase', () => ({
        // ─── State ───
        manifest: null,
        view: 'home',
        activeCategory: 'all',
        search: '',
        selectedPrompt: null,
        selectedOutput: null,
        showViewer: false,
        dark: false,
        animating: false,
        typedText: '',
        outputContent: '',

        // ─── Init ───
        async init() {
            this.dark =
                localStorage.getItem('dark') === 'true' ||
                (!localStorage.getItem('dark') &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', this.dark);

            try {
                const res = await fetch('data/manifest.json');
                this.manifest = await res.json();
            } catch (e) {
                console.error('Failed to load manifest.json:', e);
            }

            this.handleHash();
            window.addEventListener('hashchange', () => this.handleHash());
        },

        // ─── Computed ───
        get categoryList() {
            if (!this.manifest?.categories) return [];
            return Object.entries(this.manifest.categories).map(
                ([id, icon]) => ({ id, icon })
            );
        },

        get filteredPrompts() {
            let list = this.manifest?.prompts || [];
            if (this.activeCategory !== 'all') {
                list = list.filter((p) => p.category === this.activeCategory);
            }
            if (this.search.trim()) {
                const q = this.search.toLowerCase();
                list = list.filter(
                    (p) =>
                        p.title.toLowerCase().includes(q) ||
                        p.prompt.toLowerCase().includes(q) ||
                        p.category.toLowerCase().includes(q)
                );
            }
            return list;
        },

        get totalModels() {
            const set = new Set();
            (this.manifest?.prompts || []).forEach((p) =>
                p.outputs.forEach((o) => set.add(o.model))
            );
            return set.size;
        },

        get totalOutputs() {
            return (this.manifest?.prompts || []).reduce(
                (n, p) => n + p.outputs.length,
                0
            );
        },

        get leaderboard() {
            const map = {};
            (this.manifest?.prompts || []).forEach((p) => {
                p.outputs.forEach((o) => {
                    if (!map[o.model]) map[o.model] = { total: 0, count: 0 };
                    map[o.model].total += o.score;
                    map[o.model].count++;
                });
            });
            return Object.entries(map)
                .map(([model, d]) => ({
                    model,
                    avg: (d.total / d.count).toFixed(1),
                    count: d.count,
                }))
                .sort((a, b) => b.avg - a.avg);
        },

        // ─── Helpers ───
        getCatIcon(cat) {
            return this.manifest?.categories?.[cat] || '•';
        },

        avgScore(prompt) {
            const scores = prompt.outputs.map((o) => o.score);
            if (!scores.length) return '—';
            return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        },

        scoreColor(score) {
            const n = parseFloat(score);
            if (n >= 9) return 'text-emerald-600 dark:text-emerald-400';
            if (n >= 7) return 'text-amber-600 dark:text-amber-400';
            if (n > 0) return 'text-red-500 dark:text-red-400';
            return 'text-neutral-400';
        },

        // ─── Actions ───
        async selectPrompt(prompt) {
            this.selectedPrompt = prompt;
            this.view = 'prompt';
            this.animating = true;
            this.typedText = '';
            window.location.hash = prompt.id;
            window.scrollTo({ top: 0, behavior: 'instant' });

            // typewriter
            const text = prompt.prompt;
            const speed = Math.max(6, Math.min(28, 1000 / text.length));
            for (let i = 0; i <= text.length; i++) {
                this.typedText = text.slice(0, i);
                await this.sleep(speed);
            }
            await this.sleep(500);
            this.animating = false;
        },

        async viewOutput(output) {
            this.selectedOutput = output;
            if (!output.file.endsWith('.html')) {
                try {
                    const res = await fetch(output.file);
                    const text = await res.text();
                    this.outputContent = marked.parse(text);
                } catch {
                    this.outputContent =
                        '<p style="color:#ef4444">Failed to load output file.</p>';
                }
            }
            this.showViewer = true;
            document.body.style.overflow = 'hidden';
        },

        closeViewer() {
            this.showViewer = false;
            this.selectedOutput = null;
            this.outputContent = '';
            document.body.style.overflow = '';
        },

        goHome() {
            this.view = 'home';
            this.selectedPrompt = null;
            this.closeViewer();
            this.animating = false;
            window.location.hash = '';
            window.scrollTo({ top: 0, behavior: 'instant' });
        },

        toggleView(name) {
            if (this.view === name) {
                this.goHome();
            } else {
                this.view = name;
                this.selectedPrompt = null;
                window.location.hash = '';
                window.scrollTo({ top: 0, behavior: 'instant' });
            }
        },

        toggleDark() {
            this.dark = !this.dark;
            document.documentElement.classList.toggle('dark', this.dark);
            localStorage.setItem('dark', this.dark);
        },

        handleHash() {
            const id = window.location.hash.slice(1);
            if (id && this.manifest) {
                const p = this.manifest.prompts.find((x) => x.id === id);
                if (p) {
                    this.selectedPrompt = p;
                    this.view = 'prompt';
                    this.animating = false;
                }
            }
        },

        sleep(ms) {
            return new Promise((r) => setTimeout(r, ms));
        },
    }));
});