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
    viewerShowCode: false,
    viewerCodeContent: '',
    viewerMode: 'catalog',
    markdownContent: '',
    leaderboardCategory: null,
    
    // Split State
    viewerSplitMode: false,
    splitOutput: null,
    splitIndex: 1, // Default to next model
    splitContent: '',

    // Playground State
    playgroundCode: '<div class="p-8 text-center">\n  <h1 class="text-2xl font-bold text-gray-800">Hello World</h1>\n  <p class="text-gray-600">Start editing to see the preview.</p>\n</div>',

    // Toast
    toast: { show: false, message: '' },

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
      this.catalog.prompts?.forEach(p => p.outputs?.forEach(o => models.add(o.model)));
      return models.size;
    },

    get totalOutputs() {
      return this.catalog.prompts?.reduce((sum, p) => sum + (p.outputs?.length || 0), 0) || 0;
    },

    get filteredLeaderboard() {
      const modelStats = {};
      const prompts = this.leaderboardCategory
        ? this.catalog.prompts?.filter(p => p.category === this.leaderboardCategory)
        : this.catalog.prompts;

      prompts?.forEach(prompt => {
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
      this.loadCatalog().then(() => this.handleHash());
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
        const parts = hash.split('/');
        const promptId = parts[0];
        const outputIndex = parts[1] ? parseInt(parts[1]) : null;

        const prompt = this.catalog.prompts.find(p => p.id === promptId);
        if (prompt) {
          this.loadPromptState(prompt);
          if (outputIndex !== null && prompt.outputs[outputIndex]) {
             setTimeout(() => this.openViewer(prompt.outputs[outputIndex], outputIndex), 50);
          }
        } else {
          this.resetToHome(false);
        }
      } else {
        this.resetToHome(false);
      }
    },

    resetToHome(updateHash = true) {
      if (updateHash) window.location.hash = '';
      this.view = 'home';
      this.currentPrompt = null;
      this.viewerOpen = false;
    },

    openPrompt(prompt) {
      window.location.hash = prompt.id;
      this.loadPromptState(prompt);
    },

    loadPromptState(prompt) {
      this.currentPrompt = prompt;
      this.view = 'prompt';
    },

    openViewer(output, index) {
      this.viewerMode = 'catalog';
      this.currentOutput = output;
      this.viewerIndex = index;
      this.viewerOpen = true;
      this.viewerShowCode = false;
      this.viewerSplitMode = false;
      this.splitOutput = null;
      window.location.hash = `${this.currentPrompt.id}/${index}`;

      // Preload content
      if (output.file.endsWith('.html')) {
        this.loadCode(output.file);
      } else if (output.file.endsWith('.md')) {
        this.loadMarkdown(output.file, 'markdownContent');
      } else if (output.file.endsWith('.txt')) {
        this.loadPlainText(output.file, 'markdownContent');
      }
    },

    openPlaygroundPreview() {
      this.viewerMode = 'playground';
      this.viewerOpen = true;
      this.viewerSplitMode = false;
    },

    closeViewer() {
      this.viewerOpen = false;
      this.viewerSplitMode = false;
      window.location.hash = this.currentPrompt?.id || '';
    },

    navigateViewer(direction) {
      if (!this.currentPrompt) return;
      const newIndex = this.viewerIndex + direction;
      if (newIndex >= 0 && newIndex < this.currentPrompt.outputs.length) {
        this.openViewer(this.currentPrompt.outputs[newIndex], newIndex);
      }
    },
    
    switchModel(modelName) {
        const index = this.currentPrompt.outputs.findIndex(o => o.model === modelName);
        if (index !== -1) {
            this.openViewer(this.currentPrompt.outputs[index], index);
        }
    },

    toggleSplitView() {
        this.viewerSplitMode = !this.viewerSplitMode;
        if(this.viewerSplitMode) {
            // Initialize right panel with next model if available
            let nextIndex = 0;
            if (this.currentPrompt.outputs.length > 1) {
                nextIndex = (this.viewerIndex + 1) % this.currentPrompt.outputs.length;
            }
            this.splitIndex = nextIndex;
            this.splitOutput = this.currentPrompt.outputs[nextIndex];
            
            // Load content for split panel
             if (this.splitOutput.file.endsWith('.md')) {
                this.loadMarkdown(this.splitOutput.file, 'splitContent');
            } else if (this.splitOutput.file.endsWith('.txt')) {
                this.loadPlainText(this.splitOutput.file, 'splitContent');
            } else {
                // If html, iframe handles it, but we can preload if needed
            }
        }
    },
    
    updatePanel(panelSide, modelName) {
        const index = this.currentPrompt.outputs.findIndex(o => o.model === modelName);
        if (index === -1) return;
        
        if (panelSide === 0) { // Left panel
            this.openViewer(this.currentPrompt.outputs[index], index);
            // Re-enable split mode since openViewer resets it
            this.viewerSplitMode = true; 
        } else { // Right panel
            this.splitIndex = index;
            this.splitOutput = this.currentPrompt.outputs[index];
            if (this.splitOutput.file.endsWith('.md')) {
                this.loadMarkdown(this.splitOutput.file, 'splitContent');
            } else if (this.splitOutput.file.endsWith('.txt')) {
                this.loadPlainText(this.splitOutput.file, 'splitContent');
            }
        }
    },

    async loadCode(file) {
      try {
        const response = await fetch(this.getOutputPath(file));
        this.viewerCodeContent = await response.text();
      } catch (error) {
        this.viewerCodeContent = 'Failed to load code.';
      }
    },

    async loadMarkdown(file, targetVar) {
      try {
        const response = await fetch(this.getOutputPath(file));
        const text = await response.text();
        this[targetVar] = marked.parse(text);
      } catch (error) {
        this[targetVar] = '<p class="text-red-500">Failed to load content.</p>';
      }
    },

    async loadPlainText(file, targetVar) {
      try {
        const response = await fetch(this.getOutputPath(file));
        const text = await response.text();
        const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        this[targetVar] = `<pre class="whitespace-pre-wrap font-mono text-sm">${escaped}</pre>`;
      } catch (error) {
        this[targetVar] = '<p class="text-red-500">Failed to load content.</p>';
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
      if (!score) return 'bg-neutral-200 dark:bg-neutral-700';
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

    copyToClipboard(text, message = 'Copied to clipboard') {
      navigator.clipboard.writeText(text).then(() => this.showToast(message));
    },

    copyCurrentOutput() {
      if (this.viewerShowCode) {
        this.copyToClipboard(this.viewerCodeContent, 'Code copied');
      } else if (this.currentOutput.file.endsWith('.html')) {
        fetch(this.getOutputPath(this.currentOutput.file))
          .then(res => res.text())
          .then(text => this.copyToClipboard(text, 'HTML copied'));
      } else {
        fetch(this.getOutputPath(this.currentOutput.file))
          .then(res => res.text())
          .then(text => this.copyToClipboard(text, 'Content copied'));
      }
    },

    showToast(message) {
      this.toast = { show: true, message };
      setTimeout(() => { this.toast.show = false; }, 2000);
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    }
  };
}