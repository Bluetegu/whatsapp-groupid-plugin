/**
 * WhatsApp Group ID Extractor Content Script
 * Monitors WhatsApp Web for group info panels and extracts group IDs
 */

class WhatsAppGroupIdExtractor {
    constructor() {
        this.groupIdPattern = /(\d+(?:-\d+)*@g\.us)/;
        this.mediaLinksSectionSelector = 'span:contains("Media, links and docs")';
        this.groupInfoPanelSelector = '[aria-label="Group info"]';
        this.isInitialized = false;

        this.init();
    }

    /**
     * Initialize the extension
     */
    init() {
        if (this.isInitialized) return;

        console.log('WhatsApp Group ID Extractor: Initializing...');

        // Wait for WhatsApp to load
        this.waitForWhatsAppLoad().then(() => {
            this.setupMutationObserver();
            this.isInitialized = true;
            console.log('WhatsApp Group ID Extractor: Initialized successfully');
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
     * Check if a node contains or is a group info panel
     */
    checkForGroupInfoPanel(element) {
        // Check if element itself is a group info panel
        const groupInfoPanel = element.matches && element.matches(this.groupInfoPanelSelector)
            ? element
            : element.querySelector && element.querySelector(this.groupInfoPanelSelector);

        if (groupInfoPanel) {
            console.log('WhatsApp Group ID Extractor: Group info panel detected');
            setTimeout(() => this.processGroupInfoPanel(groupInfoPanel), 100);
        }
    }

    /**
     * Process the group info panel and add group ID if found
     */
    processGroupInfoPanel(panel) {
        // Don't add multiple group ID elements
        if (panel.querySelector('.whatsapp-group-id-extractor')) {
            return;
        }

        const groupId = this.extractGroupId();
        if (groupId) {
            this.insertGroupIdElement(panel, groupId);
        } else {
            console.warn('WhatsApp Group ID Extractor: No group ID found');
        }
    }

    /**
     * Extract group ID from the current page
     */
    extractGroupId() {
        // Look for elements with data-id containing @g.us
        const elements = document.querySelectorAll('[data-id*="@g.us"]');

        for (let element of elements) {
            const dataId = element.getAttribute('data-id');
            const match = dataId.match(this.groupIdPattern);

            if (match) {
                console.log('WhatsApp Group ID Extractor: Found group ID:', match[1]);
                return match[1];
            }
        }

        return null;
    }

    /**
     * Insert the group ID element into the group info panel
     */
    insertGroupIdElement(panel, groupId) {
        // Find the "Group created by" section insertion point
        const insertionPoint = this.findGroupCreatedBySection(panel);

        if (insertionPoint) {
            const groupIdElement = this.createGroupIdElement(groupId);
            insertionPoint.parentNode.insertBefore(groupIdElement, insertionPoint.nextSibling);
            console.log('WhatsApp Group ID Extractor: Group ID element added successfully');
        } else {
            console.warn('WhatsApp Group ID Extractor: Could not find insertion point after Group created by section');
        }
    }

    /**
     * Find the "Group created by" section
     */
    findGroupCreatedBySection(panel) {
        // Look for text content containing "Group created by" or "created" 
        const walker = document.createTreeWalker(
            panel,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('Group created by') ||
                node.textContent.includes('created by') ||
                node.textContent.includes('Created by')) {
                // Find the parent container element
                let parent = node.parentElement;
                while (parent && !parent.classList.contains('x106a9eq')) {
                    parent = parent.parentElement;
                }
                return parent;
            }
        }

        // Fallback: look for media section if group created by section not found
        return this.findMediaLinksSection(panel);
    }

    /**
     * Find the "Media, links and docs" section
     */
    findMediaLinksSection(panel) {
        // Look for text content containing "Media, links and docs"
        const walker = document.createTreeWalker(
            panel,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('Media, links and docs')) {
                // Find the parent container element
                let parent = node.parentElement;
                while (parent && !parent.classList.contains('x106a9eq')) {
                    parent = parent.parentElement;
                }
                return parent;
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
      <div class="group-id-horizontal-layout">
        <span class="group-id-label">
          Group ID
        </span>
        <span class="group-id-value">
          ${groupId}
        </span>
        <button class="copy-group-id-btn" 
                title="Copy Group ID" 
                data-group-id="${groupId}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor" opacity="0.6"/>
          </svg>
        </button>
      </div>
    `;

        // Add click event listener to copy button
        const copyBtn = container.querySelector('.copy-group-id-btn');
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.copyToClipboard(groupId, copyBtn);
        });

        // Add hover effects
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.background = 'var(--background-default-hover, #f0f2f5)';
        });

        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.background = 'none';
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
            console.log('WhatsApp Group ID Extractor: Group ID copied to clipboard:', groupId);
        } catch (err) {
            console.error('WhatsApp Group ID Extractor: Failed to copy to clipboard:', err);
            this.showCopyFeedback(button, false);
        }
    }

    /**
     * Show visual feedback for copy operation
     */
    showCopyFeedback(button, success) {
        const svg = button.querySelector('svg');
        const originalSvg = svg.outerHTML;

        // Replace with checkmark or error icon
        if (success) {
            svg.outerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#00a884"/>
        </svg>
      `;
            button.style.color = '#00a884';
        } else {
            svg.outerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#f15c6d"/>
        </svg>
      `;
            button.style.color = '#f15c6d';
        }

        setTimeout(() => {
            button.innerHTML = originalSvg;
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