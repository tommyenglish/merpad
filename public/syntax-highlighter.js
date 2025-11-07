/* Minimal Mermaid Syntax Highlighter (~3KB) */

// Mermaid syntax patterns
const patterns = [
  { regex: /%%.*$/gm, className: 'comment' },
  { regex: /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|requirementDiagram|C4Context|mindmap|timeline|zenuml|sankey-beta)\b/g, className: 'keyword' },
  { regex: /\b(TD|TB|BT|RL|LR)\b/g, className: 'direction' },
  { regex: /\b(subgraph|end|if|else|loop|alt|opt|par|and|rect|note|activate|deactivate|class|click|callback|link|title|section|participant|actor|as)\b/g, className: 'control' },
  { regex: /(-->|---|-\.->|\.\.-|===>|==>|--o|--x|-\.-|<-->|<->|o--o|x--x|\|\||--|->)/g, className: 'arrow' },
  { regex: /"[^"]*"/g, className: 'string' },
  { regex: /\[([^\]]+)\]/g, className: 'label' },
  { regex: /\{([^}]+)\}/g, className: 'decision' },
];

/**
 * Apply syntax highlighting to text
 */
function highlightSyntax(text) {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Track positions to avoid double-highlighting
  const matches = [];

  // Find all matches
  patterns.forEach(({ regex, className }) => {
    const re = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = re.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        className,
        text: match[0],
      });
    }
  });

  // Sort by start position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep first)
  const filtered = [];
  let lastEnd = -1;
  matches.forEach(m => {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  });

  // Build highlighted HTML
  let result = '';
  let pos = 0;
  filtered.forEach(m => {
    // Add text before match
    if (m.start > pos) {
      result += escapeHtml(text.substring(pos, m.start));
    }
    // Add highlighted match
    result += `<span class="hl-${m.className}">${escapeHtml(m.text)}</span>`;
    pos = m.end;
  });
  // Add remaining text
  if (pos < text.length) {
    result += escapeHtml(text.substring(pos));
  }

  return result;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Create a syntax-highlighted editor
 */
export function createSyntaxEditor(container, initialValue = '', onChange = null) {
  // Create structure
  container.innerHTML = `
    <div class="editor-wrapper">
      <div class="line-numbers" aria-hidden="true"></div>
      <div class="editor-content">
        <pre class="highlight-layer" aria-hidden="true"><code></code></pre>
        <textarea class="editor-textarea" spellcheck="false"></textarea>
      </div>
    </div>
  `;

  const textarea = container.querySelector('.editor-textarea');
  const highlightCode = container.querySelector('.highlight-layer code');
  const lineNumbers = container.querySelector('.line-numbers');

  // Set initial value
  textarea.value = initialValue;

  // Update highlighting
  function update(skipOnChange = false) {
    const text = textarea.value;
    highlightCode.innerHTML = highlightSyntax(text) + '\n'; // Add newline for last line

    // Update line numbers
    const lineCount = text.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) =>
      `<span>${i + 1}</span>`
    ).join('');

    // Sync scroll position after updating to ensure alignment
    syncScroll();

    if (onChange && !skipOnChange) onChange();
  }

  // Sync scroll
  function syncScroll() {
    const scrollTop = Math.round(textarea.scrollTop);
    const scrollLeft = Math.round(textarea.scrollLeft);

    // Offset the highlight layer by the negative scroll amount
    // Use translate3d for better rendering performance and pixel-perfect positioning
    highlightCode.style.transform = `translate3d(${-scrollLeft}px, ${-scrollTop}px, 0)`;

    // Sync line numbers scroll
    lineNumbers.scrollTop = scrollTop;
  }

  // Event listeners
  textarea.addEventListener('input', update);
  textarea.addEventListener('scroll', syncScroll);

  // Tab support
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      update();
    }
  });

  // Initial update (skip onChange to avoid double-render on startup)
  update(true);
  syncScroll();

  return {
    getValue: () => textarea.value,
    setValue: (value) => {
      textarea.value = value;
      update(true); // Skip onChange when programmatically setting value (includes syncScroll)
    },
    focus: () => textarea.focus(),
  };
}
