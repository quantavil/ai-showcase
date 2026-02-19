function app() {
  return {
    // State
    darkMode: false,
    view: 'home',
    catalog: { categories: {}, prompts: [] },
    selectedCategory: null,
    searchQuery: '',
    currentPrompt: null,
    currentOutput: null,
    viewerOpen: false,
    viewerIndex: 0,
    showModelCards: false,
    markdownContent: '',
    typewriterInterval: null,
    
    // Playground State
    playgroundCode: '<div class="p-8 text-center">\n  <h1 class="text-2xl font-bold text-gray-800">Hello World</h1>\n  <p class="text-gray-600">Start editing to see the preview.</p>\n</div>',
    previewFull: false,

    // Computed
    get filteredPrompts() {
      let prompts = this.catalog.prompts || [];

      if (this.selectedCategory) {
        prompts = prompts.filter(p => p.category === this.selectedCategory);
      }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        prompts = prompts.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.prompt.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
        );
      }

      return prompts;
    },

    get uniqueModels() {
      const models = new Set();
      this.catalog.prompts?.forEach(p => {
        p.outputs?.forEach(o => models.add(o.model));
      });
      return models.size;
    },

    get totalOutputs() {
      return this.catalog.prompts?.reduce((sum, p) => sum + (p.outputs?.length || 0), 0) || 0;
    },

    get leaderboardData() {
      const modelStats = {};

      this.catalog.prompts?.forEach(prompt => {
        prompt.outputs?.forEach(output => {
          if (!modelStats[output.model]) {
            modelStats[output.model] = { totalScore: 0, count: 0 };
          }
          modelStats[output.model].totalScore += output.score;
          modelStats[output.model].count++;
        });
      });

      return Object.entries(modelStats)
        .map(([name, stats]) => ({
          name,
          avgScore: stats.totalScore / stats.count,
          outputs: stats.count
        }))
        .sort((a, b) => b.avgScore - a.avgScore);
    },

    // Lifecycle
    init() {
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      this.loadCatalog().then(() => {
        this.handleHash();
      });
      window.addEventListener('hashchange', () => this.handleHash());
    },

    // Methods
    async loadCatalog() {
      try {
        const response = await fetch('data/catalog.json');
        if (!response.ok) throw new Error('Network response was not ok');
        this.catalog = await response.json();
      } catch (error) {
        console.error('Failed to load catalog:', error);
      }
    },

    handleHash() {
      const hash = window.location.hash.slice(1);

      if (hash === 'leaderboard') {
        this.view = 'leaderboard';
        this.viewerOpen = false;
      } else if (hash === 'playground') {
        this.view = 'playground';
        this.viewerOpen = false;
      } else if (hash && this.catalog.prompts) {
        const prompt = this.catalog.prompts.find(p => p.id === hash);
        if (prompt) {
          this.loadPromptState(prompt);
        } else {
            this.viewerOpen = false;
            this.view = 'home';
        }
      } else {
        this.viewerOpen = false;
        this.resetToHome(false);
      }
    },

    resetToHome(updateHash = true) {
      if (updateHash) window.location.hash = '';
      this.view = 'home';
      this.currentPrompt = null;
      this.showModelCards = false;
      this.viewerOpen = false;
    },

    openPrompt(prompt) {
      window.location.hash = prompt.id;
      this.loadPromptState(prompt);
    },

    loadPromptState(prompt) {
      this.currentPrompt = prompt;
      this.view = 'prompt';
      this.showModelCards = false;

      requestAnimationFrame(() => {
        this.startTypewriter(prompt.prompt);
      });
    },

    startTypewriter(text) {
      if (this.typewriterInterval) clearInterval(this.typewriterInterval);

      const container = this.$refs.typewriterContainer;
      if (!container) return;

      container.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';

      let index = 0;
      // Fast speed (5ms per char) but visually pleasing
      const speed = 5; 

      this.typewriterInterval = setInterval(() => {
        if (index < text.length) {
          container.textContent = text.substring(0, index + 1);
          container.appendChild(cursor);
          index++;
        } else {
          clearInterval(this.typewriterInterval);
          this.typewriterInterval = null;

          setTimeout(() => {
            this.showModelCards = true;
          }, 200);
        }
      }, speed);
    },

    openViewer(output, index) {
      this.currentOutput = output;
      this.viewerIndex = index;
      this.viewerOpen = true;

      if (output.file.endsWith('.md')) {
        this.loadMarkdown(output.file);
      } else if (output.file.endsWith('.txt')) {
        this.loadPlainText(output.file);
      }
    },

    closeViewer() {
      this.viewerOpen = false;
    },

    navigateViewer(direction) {
      if (!this.currentPrompt) return;

      const newIndex = this.viewerIndex + direction;
      if (newIndex >= 0 && newIndex < this.currentPrompt.outputs.length) {
        this.viewerIndex = newIndex;
        this.currentOutput = this.currentPrompt.outputs[newIndex];

        if (this.currentOutput.file.endsWith('.md')) {
          this.loadMarkdown(this.currentOutput.file);
        } else if (this.currentOutput.file.endsWith('.txt')) {
          this.loadPlainText(this.currentOutput.file);
        }
      }
    },

    async loadMarkdown(file) {
      try {
        const response = await fetch(this.getOutputPath(file));
        const text = await response.text();
        this.markdownContent = marked.parse(text);
      } catch (error) {
        this.markdownContent = '<p class="text-red-500">Failed to load content.</p>';
      }
    },

    async loadPlainText(file) {
      try {
        const response = await fetch(this.getOutputPath(file));
        const text = await response.text();
        const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        this.markdownContent = `<pre class="whitespace-pre-wrap font-mono text-sm">${escaped}</pre>`;
      } catch (error) {
        this.markdownContent = '<p class="text-red-500">Failed to load content.</p>';
      }
    },

    getOutputPath(file) {
      return `outputs/${this.currentPrompt.id}/${file}`;
    },

    getAvgScore(prompt) {
      if (!prompt.outputs?.length) return 0;
      return prompt.outputs.reduce((sum, o) => sum + o.score, 0) / prompt.outputs.length;
    },

    getScoreColor(score) {
      if (!score) return 'bg-neutral-300';
      if (score >= 9) return 'bg-emerald-500';
      if (score >= 7) return 'bg-amber-400';
      return 'bg-red-500';
    },

    getScoreTextColor(score) {
      if (!score) return 'text-neutral-400';
      if (score >= 9) return 'text-emerald-600 dark:text-emerald-400';
      if (score >= 7) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    }
  };
}