document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // --- STATE ---
  let bookmarks = JSON.parse(localStorage.getItem('frontier_bookmarks')) || [];
  let papersData = [
    {
      id: 'glm52',
      title: 'GLM-5.2: Built for Long-Horizon Tasks',
      author: 'Z. ai Team',
      date: 'Jun 16, 2026',
      timestamp: '2026-06-16',
      snippet: "GLM-5.2 is Z.ai's latest flagship open-weight model for long-horizon agentic engineering. The release extends GLM-5.1 with a solid Mixture-of-Experts, IndexShare sparse-attention efficiency, improved MTP speculative decoding, and flexible thinking-effort controls. Benchmarks report...",
      tags: ['Agents', 'Coding Agents', 'Language Modeling', 'Math', 'World Knowledge'],
      tech: ['DeepSeek Sparse Attention', 'MCP', 'Mixture-of-Experts (MoE)', 'Transformer'],
      upvotes: 11200,
      citations: 30,
      repo: 'https://github.com',
      category: 'trending',
      pdfType: 'chart'
    },
    {
      id: 'indexcache',
      title: 'IndexCache: Accelerating Sparse Attention via Cross-Layer Index Reuse',
      author: 'Yushi Bai, Qian Dong, Ting Jiang, +5 authors',
      date: 'Mar 12, 2026',
      timestamp: '2026-03-12',
      snippet: 'Long-context agentic workflows have emerged as a defining use case for large language models, making attention efficiency critical for both inference speed and serving cost. Sparse attention addresses this challenge effectively, and DeepSeek Sparse Attention (DSA) is a representative...',
      tags: ['Language Modeling', 'Long Context', 'Efficiency'],
      tech: ['DeepSeek Sparse Attention', 'Gated DeltaNet', 'Key-value cache', 'Kimi Delta Attention'],
      upvotes: 8400,
      citations: 10,
      repo: 'https://github.com',
      category: 'latest',
      pdfType: 'flow'
    },
    {
      id: 'darwin-family',
      title: 'Darwin Family: MRI-Trust-Weighted Evolutionary Merging for Training-Free Scaling of Language-Model Reasoning',
      author: 'Taehong Kim, Youngsil Hong, Minseok Kim, +4 authors',
      date: 'May 14, 2026',
      timestamp: '2026-05-14',
      snippet: 'We present Darwin Family, a framework for training-free evolutionary merging of large language models via gradient-free weight-space optimization. We ask whether frontier-level reasoning performance can be improved without additional training, by reorganizing latent capabilities...',
      tags: ['Language Modeling', 'Reasoning', 'Model Merging'],
      tech: ['Mamba', 'Post-training', 'Transformer'],
      upvotes: 7100,
      citations: 24,
      repo: 'https://github.com',
      category: 'github',
      pdfType: 'grid'
    }
  ];

  // DOM Elements
  const sidebar = document.getElementById('app-sidebar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const searchInput = document.getElementById('search-input');
  const submitPaperBtn = document.getElementById('submit-paper-btn');
  const submitDialog = document.getElementById('submit-dialog');
  const closeDialogBtn = document.getElementById('close-dialog-btn');
  const cancelSubmitBtn = document.getElementById('cancel-submit-btn');
  const submitForm = document.getElementById('submit-paper-form');
  const papersFeed = document.getElementById('papers-feed');
  const profileBtn = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  const bookmarkCountBadge = document.getElementById('bookmark-count');
  const feedTimeTabs = document.getElementById('feed-time-tabs');
  const navBookmarks = document.getElementById('nav-bookmarks');
  const sidebarNavItems = document.querySelectorAll('.sidebar-nav .nav-item');

  // Initialize UI State
  updateBookmarkCount();
  renderFeed();
  syncBookmarkButtons();

  // --- MOBILE SIDEBAR TOGGLE ---
  mobileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileToggle) {
      sidebar.classList.remove('open');
    }
  });

  // --- SHORTCUT: CMD + K FOR SEARCH ---
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // --- SEARCH LIVE FILTERING ---
  searchInput.addEventListener('input', filterFeed);

  // --- TIME TAB FILTERING ---
  feedTimeTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-item');
    if (!tab) return;
    
    // Toggle active tab style
    document.querySelectorAll('.feed-tabs .tab-item').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    
    filterFeed();
  });

  // --- SIDEBAR NAVIGATION ACTION ---
  sidebarNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state in sidebar
      sidebarNavItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      
      // If mobile, close sidebar after tap
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
      }

      // Filter feed depending on selection
      if (item.id === 'nav-bookmarks') {
        renderFeed(true); // render only bookmarks
      } else {
        renderFeed(); // render all
      }
    });
  });

  // --- PROFILE DROPDOWN ---
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (profileDropdown.classList.contains('show') && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove('show');
    }
  });

  // --- SUBMIT PAPER MODAL ---
  submitPaperBtn.addEventListener('click', () => {
    submitDialog.showModal();
  });

  closeDialogBtn.addEventListener('click', () => {
    submitDialog.close();
  });

  cancelSubmitBtn.addEventListener('click', () => {
    submitDialog.close();
  });

  // Close dialog on backdrop click
  submitDialog.addEventListener('click', (e) => {
    const dialogDimensions = submitDialog.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      submitDialog.close();
    }
  });

  // Handle Paper Submission
  submitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Parse tags and tech stack
    const tags = document.getElementById('paper-tags-input').value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const tech = document.getElementById('paper-tech-input').value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Create new paper object
    const newId = 'paper-' + Date.now();
    const newPaper = {
      id: newId,
      title: document.getElementById('paper-title-input').value,
      author: document.getElementById('paper-author-input').value,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: new Date().toISOString().split('T')[0],
      snippet: document.getElementById('paper-abstract-input').value,
      tags: tags.length > 0 ? tags : ['General AI'],
      tech: tech.length > 0 ? tech : ['Transformer'],
      upvotes: 1,
      citations: 0,
      repo: document.getElementById('paper-repo-input').value || 'https://github.com',
      category: 'latest',
      pdfType: ['chart', 'flow', 'grid'][Math.floor(Math.random() * 3)]
    };

    // Add to front of papersData list
    papersData.unshift(newPaper);
    
    // Clear form inputs
    submitForm.reset();
    submitDialog.close();

    // Re-render feed and apply filtering
    renderFeed();
    
    // Smooth scroll to the top of the feed to show the newly added paper
    papersFeed.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // --- RENDER FEED FUNCTION ---
  function renderFeed(onlyBookmarks = false) {
    papersFeed.innerHTML = '';
    
    const targetPapers = onlyBookmarks 
      ? papersData.filter(p => bookmarks.includes(p.id)) 
      : papersData;

    if (targetPapers.length === 0) {
      papersFeed.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox" class="empty-icon"></i>
          <h4>No papers found</h4>
          <p>Try resetting filters or submitting a new paper.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    targetPapers.forEach(paper => {
      const isBookmarked = bookmarks.includes(paper.id);
      const paperElement = document.createElement('article');
      paperElement.className = 'paper-card';
      paperElement.dataset.id = paper.id;
      paperElement.dataset.timestamp = paper.timestamp;
      
      // Determine SVG mock PDF decorations based on paper's type
      let pdfDecoration = '';
      if (paper.pdfType === 'chart') {
        pdfDecoration = `
          <div class="pdf-chart-block">
            <div class="pdf-bar h-1"></div>
            <div class="pdf-bar h-2"></div>
            <div class="pdf-bar h-3"></div>
          </div>
        `;
      } else if (paper.pdfType === 'flow') {
        pdfDecoration = `
          <div class="pdf-flow-block">
            <div class="flow-step"></div>
            <div class="flow-arrow">→</div>
            <div class="flow-step"></div>
          </div>
        `;
      } else {
        pdfDecoration = `
          <div class="pdf-grid-decor">
            <div></div><div></div><div></div><div></div>
          </div>
        `;
      }

      paperElement.innerHTML = `
        <div class="paper-preview">
          <div class="mock-pdf">
            <div class="pdf-header">${paper.title.slice(0, 30)}...</div>
            <div class="pdf-abstract-block">
              <div class="pdf-line long"></div>
              <div class="pdf-line medium"></div>
              <div class="pdf-line short"></div>
            </div>
            ${pdfDecoration}
            <div class="pdf-bottom-decor">${paper.author.split(',')[0]}</div>
          </div>
        </div>
        <div class="paper-main-content">
          <h4 class="paper-title">${paper.title}</h4>
          <div class="paper-meta">
            <span class="author">${paper.author}</span>
            <span class="meta-dot">•</span>
            <span class="date">${paper.date}</span>
          </div>
          <p class="paper-snippet">${paper.snippet}</p>
          <div class="paper-tags">
            ${paper.tags.map(t => `<span class="tag tag-orange">${t}</span>`).join('')}
          </div>
          <div class="paper-tech-tags">
            ${paper.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="paper-metrics">
          <div class="metric-action-col">
            <button class="action-metric upvote-btn" aria-label="Upvote paper">
              <i data-lucide="arrow-up" class="metric-icon"></i>
              <span class="count">${formatNumber(paper.upvotes)}</span>
              <span class="label">Upvotes</span>
            </button>
            <button class="action-metric repo-btn" data-url="${paper.repo}" aria-label="View repository">
              <i data-lucide="github" class="metric-icon"></i>
              <span class="count">${formatNumber(paper.upvotes + 100)}</span>
              <span class="label">Repo</span>
            </button>
            <div class="action-metric citation-btn">
              <i data-lucide="quote" class="metric-icon"></i>
              <span class="count">${paper.citations}</span>
              <span class="label">Citations</span>
            </div>
          </div>
          <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" data-target="${paper.id}" aria-label="Bookmark paper">
            <i data-lucide="bookmark" class="bookmark-icon"></i>
          </button>
        </div>
      `;

      // Upvote Event Listener
      const upvoteBtn = paperElement.querySelector('.upvote-btn');
      upvoteBtn.addEventListener('click', () => {
        if (upvoteBtn.classList.contains('text-orange')) {
          upvoteBtn.classList.remove('text-orange');
          paper.upvotes -= 1;
        } else {
          upvoteBtn.classList.add('text-orange');
          paper.upvotes += 1;
        }
        upvoteBtn.querySelector('.count').textContent = formatNumber(paper.upvotes);
      });

      // Code repository click
      const repoBtn = paperElement.querySelector('.repo-btn');
      repoBtn.addEventListener('click', () => {
        window.open(paper.repo, '_blank');
      });

      // Bookmark Event Listener
      const bookmarkBtn = paperElement.querySelector('.bookmark-btn');
      bookmarkBtn.addEventListener('click', () => {
        toggleBookmark(paper.id, bookmarkBtn);
      });

      papersFeed.appendChild(paperElement);
    });

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // --- FILTER AND SEARCH LOGIC ---
  function filterFeed() {
    const searchVal = searchInput.value.toLowerCase().trim();
    
    // Get active time tab
    const activeTabEl = feedTimeTabs.querySelector('.tab-item.active');
    const timeFilter = activeTabEl ? activeTabEl.dataset.time : 'all';
    
    // Get active sidebar selection
    const activeSidebarNav = document.querySelector('.sidebar-nav .nav-item.active');
    const isBookmarkMode = activeSidebarNav && activeSidebarNav.id === 'nav-bookmarks';

    const cards = papersFeed.querySelectorAll('.paper-card');
    
    cards.forEach(card => {
      const id = card.dataset.id;
      const paperObj = papersData.find(p => p.id === id);
      if (!paperObj) return;

      let matchesSearch = true;
      let matchesTime = true;
      let matchesBookmark = true;

      // 1. Search Filter
      if (searchVal) {
        matchesSearch = 
          paperObj.title.toLowerCase().includes(searchVal) ||
          paperObj.author.toLowerCase().includes(searchVal) ||
          paperObj.snippet.toLowerCase().includes(searchVal) ||
          paperObj.tags.some(t => t.toLowerCase().includes(searchVal)) ||
          paperObj.tech.some(t => t.toLowerCase().includes(searchVal));
      }

      // 2. Time Filter
      if (timeFilter !== 'all') {
        const paperDate = new Date(paperObj.timestamp);
        const today = new Date();
        const diffTime = Math.abs(today - paperDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeFilter === 'today' && diffDays > 1) matchesTime = false;
        else if (timeFilter === 'week' && diffDays > 7) matchesTime = false;
        else if (timeFilter === 'month' && diffDays > 30) matchesTime = false;
      }

      // 3. Bookmark Filter
      if (isBookmarkMode) {
        matchesBookmark = bookmarks.includes(id);
      }

      // Toggle Card visibility
      if (matchesSearch && matchesTime && matchesBookmark) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // Handle Empty States for filtered cards
    const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
    const existingEmptyState = papersFeed.querySelector('.empty-state');
    
    if (visibleCards.length === 0) {
      if (!existingEmptyState) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <i data-lucide="inbox" class="empty-icon"></i>
          <h4>No matches found</h4>
          <p>Try refining your search terms or timeline filters.</p>
        `;
        papersFeed.appendChild(emptyState);
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    } else if (existingEmptyState) {
      existingEmptyState.remove();
    }
  }

  // --- BOOKMARK HELPERS ---
  function toggleBookmark(paperId, buttonEl) {
    const index = bookmarks.indexOf(paperId);
    if (index === -1) {
      bookmarks.push(paperId);
      buttonEl.classList.add('active');
    } else {
      bookmarks.splice(index, 1);
      buttonEl.classList.remove('active');
      
      // If currently in bookmark mode, hide the bookmarked item immediately
      const activeSidebarNav = document.querySelector('.sidebar-nav .nav-item.active');
      if (activeSidebarNav && activeSidebarNav.id === 'nav-bookmarks') {
        const card = document.querySelector(`.paper-card[data-id="${paperId}"]`);
        if (card) card.remove();
        
        // Show empty state if all removed
        if (bookmarks.length === 0) {
          renderFeed(true);
        }
      }
    }
    
    localStorage.setItem('frontier_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkCount();
    syncBookmarkButtons();
  }

  function updateBookmarkCount() {
    if (bookmarkCountBadge) {
      bookmarkCountBadge.textContent = bookmarks.length;
    }
  }

  function syncBookmarkButtons() {
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      const targetId = btn.dataset.target;
      if (bookmarks.includes(targetId)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- UTILS ---
  function formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
});
