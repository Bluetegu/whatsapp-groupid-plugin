/**
 * WhatsApp Group ID Extractor — Debug Script
 *
 * Paste this into the Chrome DevTools console while the group info panel is open.
 * It replicates each step of the extension's logic and logs exactly what it finds.
 *
 * Step 4 uses the v1.3.1 insertion approach: walk up from ic-perm-media until the
 * parent has >= 4 children (the rows container). No tag names or data-testid used.
 *
 * Updated for v1.6.0: group name extraction now walks child nodes to recover emoji
 * characters rendered as <img alt="…"> by WhatsApp Web.
 */
(async () => {
    // Helper: walk child nodes and recover emoji from <img alt="…"> elements.
    // Plain textContent silently drops <img> tags, losing leading/trailing emoji.
    const getTextWithEmoji = (el) => {
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
    };

    console.group('🔍 WhatsApp Group ID Extractor — Debug');

    // ── Step 1: Locate the panel ────────────────────────────────────────────
    console.group('Step 1: Locate ic-perm-media panel');
    const allTitles = [...document.querySelectorAll('svg > title')]
        .filter(t => t.textContent.trim() === 'ic-perm-media');

    if (allTitles.length === 0) {
        console.warn('❌ ic-perm-media SVG title not found. Is the group info panel open?');
        console.groupEnd();
        console.groupEnd();
        return;
    }
    console.log(`✅ Found ${allTitles.length} ic-perm-media element(s)`);
    const panel = allTitles[0].closest('body > *') ?? document.body;
    console.groupEnd();

    // ── Step 2: Extract the group name ──────────────────────────────────────
    console.group('Step 2: Extract group name from panel');

    // Primary selector
    // Matches both group panels (group-info-drawer-subject-input-read-only)
    // and community panels (community-home-subject-input-read-only)
    const subjectEl = document.querySelector('[data-testid*="subject-input-read-only"]');
    console.log('Subject element (data-testid*=):', subjectEl);
    // Use node-walking so emoji rendered as <img alt="🟠"> are included in the result.
    const subjectText = subjectEl ? getTextWithEmoji(subjectEl).trim() || null : null;
    console.log('Name from primary selector:', subjectText);

    // Fallback selector
    const picContainer = document.querySelector('[aria-label^="Group profile picture for"]');
    console.log('Pic container (aria-label^=):', picContainer);
    const ariaLabel = picContainer?.getAttribute('aria-label') ?? null;
    console.log('aria-label value:', ariaLabel);
    const ariaMatch = ariaLabel?.match(/^Group profile picture for "(.+)"$/) ?? null;
    const ariaName = ariaMatch?.[1] ?? null;
    console.log('Name from aria-label:', ariaName);

    // SVG-only fallback: walk up from ic-person-add until reaching the tightest
    // ancestor that also contains ic-search. That is the buttons row, scoped to
    // the drawer — unaffected by other ic-search icons elsewhere in the document.
    let svgFallbackName = null;
    const personAddSvg = [...document.querySelectorAll('svg > title')]
        .find(t => t.textContent.trim() === 'ic-person-add')?.closest('svg');
    console.log('ic-person-add SVG:', personAddSvg);
    if (personAddSvg) {
        let buttonsRow = personAddSvg;
        while (buttonsRow.parentElement) {
            buttonsRow = buttonsRow.parentElement;
            // ic-search = regular group panel; ic-group-add = community panel
            if ([...buttonsRow.querySelectorAll('svg > title')]
                .some(t => ['ic-search', 'ic-group-add'].includes(t.textContent.trim()))) break;
        }
        console.log('Buttons row (contains ic-search):', buttonsRow);
        // Walk upward from buttonsRow, checking siblings at each level
        let container = buttonsRow;
        let walkLimit = 6;
        while (container.parentElement && walkLimit-- > 0) {
            const parent = container.parentElement;
            console.log(`Checking parent (${parent.children.length} children):`, parent);
            for (const child of parent.children) {
                if (child === container || child.contains(container)) continue;
                // Skip the group/community picture picker area (shows "Add group icon" when no photo set)
                if (child.querySelector('[data-testid="group-pic-picker"], [data-testid="community-pic-picker"]')) continue;
                // Clone and strip SVG elements so icon titles don't bleed into the name,
                // then use node-walking to recover emoji from <img alt="…"> elements.
                const clone = child.cloneNode(true);
                clone.querySelectorAll('svg').forEach(s => s.remove());
                const text = getTextWithEmoji(clone).trim();
                console.log('  Sibling text (SVGs stripped, emoji-aware):', JSON.stringify(text?.slice(0, 80)));
                if (text) {
                    const firstLine = text.split('\n').map(l => l.trim()).find(l => l);
                    if (firstLine) { svgFallbackName = firstLine; break; }
                }
            }
            if (svgFallbackName) break;
            container = parent;
            if (container.tagName === 'BODY') break;
        }
    }
    console.log('Name from SVG traversal:', svgFallbackName);

    const groupName = subjectText || ariaName || svgFallbackName;
    if (!groupName) {
        console.warn('❌ Could not extract group name. Both selectors returned nothing.');
        console.groupEnd();
        console.groupEnd();
        return;
    }
    console.log(`✅ Group name resolved to: "${groupName}"`);
    console.groupEnd();

    // ── Step 3: IndexedDB lookup ─────────────────────────────────────────────
    console.group('Step 3: IndexedDB model-storage → group-metadata lookup');
    await new Promise((resolve) => {
        const req = indexedDB.open('model-storage');
        req.onerror = () => {
            console.error('❌ Failed to open model-storage IndexedDB:', req.error);
            resolve();
        };
        req.onsuccess = (e) => {
            const db = e.target.result;
            console.log('IndexedDB version:', db.version);
            console.log('Object stores:', [...db.objectStoreNames].join(', '));

            if (!db.objectStoreNames.contains('group-metadata')) {
                console.warn('❌ group-metadata object store not found.');
                db.close();
                resolve();
                return;
            }

            const tx = db.transaction('group-metadata', 'readonly');
            const store = tx.objectStore('group-metadata');
            console.log('group-metadata indexes:', [...store.indexNames].join(', ') || '(none)');

            const getAll = store.getAll();
            getAll.onsuccess = () => {
                db.close();
                const records = getAll.result;
                console.log(`Total records in group-metadata: ${records.length}`);

                const groupRecords = records.filter(r => r.id?.includes('@g.us'));
                console.log(`Records with @g.us id: ${groupRecords.length}`);

                // Show first 10 subjects for reference
                console.log('Sample subjects (first 10):',
                    groupRecords.slice(0, 10).map(r => `"${r.subject}"`).join(', '));

                // Tier 1: exact match
                let match = groupRecords.find(r => r.subject === groupName);
                console.log('Tier 1 (exact):', match ? `✅ "${match.subject}"` : '❌ no match');

                // Tier 2: strip all emoji from both sides and compare
                if (!match) {
                    const stripEmoji = s => (s || '')
                        .replace(/\p{Extended_Pictographic}/gu, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    const normalizedSearch = stripEmoji(groupName);
                    console.log('Tier 2 normalised search term:', JSON.stringify(normalizedSearch));
                    if (normalizedSearch) {
                        match = groupRecords.find(r => stripEmoji(r.subject) === normalizedSearch);
                    }
                    console.log('Tier 2 (emoji-stripped):', match ? `✅ "${match.subject}"` : '❌ no match');
                }

                if (match) {
                    console.log(`✅ Match found!`);
                    console.log('  id:', match.id);
                    console.log('  subject:', match.subject);
                } else {
                    console.warn(`❌ No record matched "${groupName}" via any tier`);
                    // Fuzzy hint for debugging
                    const fuzzy = groupRecords.filter(r =>
                        r.subject?.toLowerCase().includes(groupName.toLowerCase()) ||
                        groupName.toLowerCase().includes(r.subject?.toLowerCase())
                    );
                    if (fuzzy.length > 0) {
                        console.warn('⚠️  Possible near-matches (case/whitespace difference?):');
                        fuzzy.forEach(r => console.warn(`  subject: "${r.subject}"  id: ${r.id}`));
                    }
                }
                resolve();
            };
            getAll.onerror = () => {
                console.error('❌ getAll() failed:', getAll.error);
                db.close();
                resolve();
            };
        };
    });
    console.groupEnd();

    // ── Step 4: Insertion point check ───────────────────────────────────────
    console.group('Step 4: Check insertion point (walk-up by sibling count)');
    const mediaTitleEl = allTitles[0];
    let mediaRow = mediaTitleEl;
    while (mediaRow.parentElement && mediaRow.parentElement.children.length < 4) {
        mediaRow = mediaRow.parentElement;
    }
    if (!mediaRow.parentElement) {
        console.warn('❌ Walk-up reached document root — insertion will be skipped.');
    } else {
        console.log(`✅ Rows container (${mediaRow.parentElement.children.length} children):`, mediaRow.parentElement);
        console.log('✅ Media row (insertion target):', mediaRow);
        console.log('✅ Insertion point looks valid. Group ID row will be inserted before this element.');
    }
    console.groupEnd();

    console.groupEnd(); // top-level group
})();
