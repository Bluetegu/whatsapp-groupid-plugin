/**
 * WhatsApp Group ID Extractor Content Script
 * Monitors WhatsApp Web for group info panels and extracts group IDs
 */

class WhatsAppGroupIdExtractor {
    constructor() {
        this.groupIdPattern = /(\d+(?:-\d+)*@g\.us)/;
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize the extension
     */
    init() {
        if (this.isInitialized) return;

        // Wait for WhatsApp to load
        this.waitForWhatsAppLoad().then(() => {
            this.setupMutationObserver();
            this.isInitialized = true;
        });
    }

    /**
     * Wait for WhatsApp Web to fully load
     */
    waitForWhatsAppLoad() {
        return new Promise((resolve) => {
            const checkLoad = () => {
                const mainApp = document.querySelector('[data-testid="app"]') ||
                    document.querySelector('#app');

                if (mainApp) {
                    resolve();
                } else {
                    setTimeout(checkLoad, 500);
                }
            };
            checkLoad();
        });
    }

    /**
     * Set up MutationObserver to watch for group info panel changes
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Check for added nodes that might be group info panels
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkForGroupInfoPanel(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Check if a node might contain a group info panel
     */
    checkForGroupInfoPanel(element) {
        // Quick check: does this element contain the media icon we're looking for?
        if (this.findSvgByTitle(element, 'ic-perm-media')) {
            setTimeout(() => this.processGroupInfoPanel(element), 100);
        }
    }

    /**
     * Process the group info panel and add group ID if found
     */
    async processGroupInfoPanel(panel) {
        // Don't add multiple group ID elements
        if (document.querySelector('.whatsapp-group-id-extractor')) {
            return;
        }

        const groupId = await this.extractGroupId(panel);
        if (groupId) {
            this.insertGroupIdElement(panel, groupId);
        }
    }

    /**
     * Walk an element's subtree and return its full text content, substituting
     * the alt/data-plain-text attribute of any <img> for the image node.
     * This recovers emoji characters that WhatsApp Web renders as <img> elements
     * and which would be silently dropped by a plain textContent read.
     */
    getTextWithEmoji(el) {
        let result = '';
        const walk = (node) => {
            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    result += child.nodeValue;
                } else if (child.nodeName === 'IMG') {
                    result += child.getAttribute('alt') || child.getAttribute('data-plain-text') || '';
                } else {
                    walk(child);
                }
            }
        };
        walk(el);
        return result;
    }

    /**
     * Extract the group name shown in the info panel header.
     */
    extractGroupNameFromPanel(panel) {
        // Search document-wide: the subject input and profile picture are in the drawer
        // header, which is a different DOM subtree from the body node that triggered
        // the MutationObserver (the node containing ic-perm-media).
        // Matches both group panels (group-info-drawer-subject-input-read-only)
        // and community panels (community-home-subject-input-read-only)
        const subjectEl = document.querySelector('[data-testid*="subject-input-read-only"]');
        if (subjectEl) {
            // Walk child nodes so that emoji rendered as <img alt="🟠"> are included.
            // Plain textContent skips <img> elements, causing a mismatch with the
            // IndexedDB subject field which stores the real emoji character.
            const text = this.getTextWithEmoji(subjectEl).trim();
            if (text) return text;
        }

        // Fallback 1: aria-label on the group profile picture container
        const picContainer = document.querySelector('[aria-label^="Group profile picture for"]');
        if (picContainer) {
            const match = picContainer.getAttribute('aria-label').match(/^Group profile picture for "(.+)"$/);
            if (match) return match[1];
        }

        // Fallback 2: walk up from the ic-person-add SVG until reaching the tightest
        // ancestor that also contains ic-search (the buttons row). Then keep walking
        // upward, checking siblings at each level — the group name may not be an
        // immediate sibling of the buttons row.
        const personAddSvg = [...document.querySelectorAll('svg > title')]
            .find(t => t.textContent.trim() === 'ic-person-add')?.closest('svg');
        if (personAddSvg) {
            let buttonsRow = personAddSvg;
            while (buttonsRow.parentElement) {
                buttonsRow = buttonsRow.parentElement;
                // ic-search = regular group panel; ic-group-add = community panel
                if ([...buttonsRow.querySelectorAll('svg > title')]
                    .some(t => ['ic-search', 'ic-group-add'].includes(t.textContent.trim()))) break;
            }
            let container = buttonsRow;
            let walkLimit = 6;
            while (container.parentElement && walkLimit-- > 0) {
                const parent = container.parentElement;
                for (const child of parent.children) {
                    if (child === container || child.contains(container)) continue;
                    // Skip the group/community picture picker area (shows "Add group icon" when no photo set)
                    if (child.querySelector('[data-testid="group-pic-picker"], [data-testid="community-pic-picker"]')) continue;
                    // Strip SVG elements so icon titles don't bleed into the name,
                    // then walk child nodes to reconstruct emoji rendered as <img alt="…">.
                    const clone = child.cloneNode(true);
                    clone.querySelectorAll('svg').forEach(s => s.remove());
                    const text = this.getTextWithEmoji(clone).trim();
                    if (text) {
                        const firstLine = text.split('\n').map(l => l.trim()).find(l => l);
                        if (firstLine) return firstLine;
                    }
                }
                container = parent;
                if (container.tagName === 'BODY') break;
            }
        }

        return null;
    }

    /**
     * Look up group JID in IndexedDB model-storage → group-metadata by subject (group name).
     */
    lookupGroupIdByName(groupName) {
        return new Promise((resolve) => {
            try {
                const req = indexedDB.open('model-storage');
                req.onerror = () => resolve(null);
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('group-metadata')) {
                        db.close();
                        resolve(null);
                        return;
                    }
                    const tx = db.transaction('group-metadata', 'readonly');
                    const getAll = tx.objectStore('group-metadata').getAll();
                    getAll.onsuccess = () => {
                        db.close();
                        const groups = getAll.result.filter(g => g.id && g.id.includes('@g.us'));
                        // Exact match first
                        let match = groups.find(g => g.subject === groupName);
                        // Fallback: strip all emoji from both strings and compare.
                        // Handles cases where extraction partially failed (e.g. WA sets empty
                        // alt on an emoji image), producing a name missing leading/trailing emoji.
                        if (!match) {
                            const stripEmoji = s => (s || '')
                                .replace(/\p{Extended_Pictographic}/gu, '')
                                .replace(/\s+/g, ' ')
                                .trim();
                            const normalizedSearch = stripEmoji(groupName);
                            if (normalizedSearch) {
                                match = groups.find(g => stripEmoji(g.subject) === normalizedSearch);
                            }
                        }
                        resolve(match ? match.id : null);
                    };
                    getAll.onerror = () => { db.close(); resolve(null); };
                };
            } catch (_) {
                resolve(null);
            }
        });
    }

    /**
     * Extract group ID for the currently open group chat.
     * Strategy 1: DOM attributes (legacy).
     * Strategy 2: IndexedDB model-storage.group-metadata lookup by group name.
     */
    async extractGroupId(panel) {
        // Strategy 1: DOM attributes (legacy)
        for (const attr of ['data-id', 'data-jid']) {
            for (const el of document.querySelectorAll(`[${attr}*="@g.us"]`)) {
                const match = el.getAttribute(attr).match(this.groupIdPattern);
                if (match) return match[1];
            }
        }

        // Strategy 2: IndexedDB lookup by group name from panel header
        const groupName = this.extractGroupNameFromPanel(panel);
        if (groupName) {
            const id = await this.lookupGroupIdByName(groupName);
            if (id) return id;
        }

        console.warn('[WhatsApp Group ID] Could not find group ID via any strategy.');
        return null;
    }

    /**
     * Insert the group ID element into the group info panel.
     *
     * Only depends on the ic-perm-media SVG title already being found.
     * Walks up from the SVG title until the parent element has >= 4 children —
     * that is the rows container (profile pic, description, separator, media row,
     * stars, notifications, …). Inner layout divs have only 2–3 children.
     * No tag names, data-testid, or fixed depth are used.
     */
    insertGroupIdElement(panel, groupId) {
        const mediaTitleElement = this.findSvgByTitle(panel, 'ic-perm-media');
        if (!mediaTitleElement) return;

        // Walk up until the parent is the rows container (many siblings)
        let mediaRow = mediaTitleElement;
        while (mediaRow.parentElement && mediaRow.parentElement.children.length < 4) {
            mediaRow = mediaRow.parentElement;
        }
        if (!mediaRow.parentElement) return;

        mediaRow.parentElement.insertBefore(this.createGroupIdElement(groupId), mediaRow);
    }

    /**
     * Optimized method to find SVG title element by text content
     */
    findSvgByTitle(container, titleText) {
        // Direct query for title elements with specific text content
        const titleElements = container.querySelectorAll('svg > title');
        for (let titleEl of titleElements) {
            if (titleEl.textContent.trim() === titleText) {
                return titleEl;
            }
        }
        return null;
    }

    /**
     * Create the group ID display element
     */
    createGroupIdElement(groupId) {
        const container = document.createElement('div');
        container.className = 'whatsapp-group-id-extractor';

        container.innerHTML = `
      <div class="group-id-horizontal-layout" style="direction: ltr;">
        <span class="group-id-label">Group ID</span>
        <span class="group-id-value"></span>
        <button class="copy-group-id-btn" title="Copy Group ID">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor" opacity="0.6"/>
          </svg>
        </button>
      </div>
    `;

        container.querySelector('.group-id-value').textContent = groupId;

        const copyBtn = container.querySelector('.copy-group-id-btn');
        copyBtn.setAttribute('data-group-id', groupId);
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.copyToClipboard(groupId, copyBtn);
        });

        return container;
    }

    /**
     * Copy group ID to clipboard
     */
    async copyToClipboard(groupId, button) {
        try {
            await navigator.clipboard.writeText(groupId);
            this.showCopyFeedback(button, true);
        } catch (err) {
            this.showCopyFeedback(button, false);
        }
    }

    /**
     * Show visual feedback for copy operation
     */
    showCopyFeedback(button, success) {
        const originalHTML = button.innerHTML;
        const color = success ? '#00a884' : '#f15c6d';
        const path = success
            ? `<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="${color}"/>`
            : `<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="${color}"/>`;

        button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
        button.style.color = color;

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 1500);
    }
}

// Initialize the extension when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new WhatsAppGroupIdExtractor());
} else {
    new WhatsAppGroupIdExtractor();
}