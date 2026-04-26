# WhatsApp Group ID Plugin - Debugging Guide

When the WhatsApp Group ID plugin isn't working on someone's Chrome browser, follow this systematic debugging process to identify and resolve the issue.

## Quick Extension Status Check

**First, verify the extension is loaded:**
1. Go to `chrome://extensions/`
2. Check if "WhatsApp Group ID Extractor" appears in the list
3. Ensure the toggle is **ON** (blue)
4. If missing, install using developer mode with the unpacked folder

## Step-by-Step Debugging Process

### 1. Open Developer Console
1. Go to [web.whatsapp.com](https://web.whatsapp.com)
2. Press `F12` or `Ctrl+Shift+I` (`Cmd+Option+I` on Mac)
3. Click the **Console** tab
4. Enter 'allow pasting' 

### 2. Check for Initial Loading
Look for any error messages in the console, particularly:
- Extension loading errors
- Content script injection failures
- Permission denied messages

### 3. Test the Content Script Manually

In the console, paste this diagnostic script:

```javascript
// Check if the extension content script loaded
console.log("=== WhatsApp Group ID Extension Diagnostic ===");

// 1. Check if main app element exists
const app = document.querySelector('[data-testid="app"]') || document.querySelector('#app');
console.log("WhatsApp app element found:", !!app);

// 2. Check for group elements with data-id
const groupElements = document.querySelectorAll('[data-id*="@g.us"]');
console.log("Found", groupElements.length, "elements with @g.us");
groupElements.forEach((el, i) => console.log(`Element ${i}:`, el.getAttribute('data-id')));

// 3. Check for existing extension elements
const existingGroupId = document.querySelector('.whatsapp-group-id-extractor');
console.log("Extension already injected:", !!existingGroupId);

// 4. Look for the media section SVG (matches actual extension logic)
const titleElements = document.querySelectorAll('svg > title');
let mediaTitleElement = null;
for (let titleEl of titleElements) {
    if (titleEl.textContent.trim() === 'ic-perm-media') {
        mediaTitleElement = titleEl;
        break;
    }
}
console.log("Media section SVG title found:", !!mediaTitleElement);

// 5. If found, test the DOM traversal logic the extension uses
if (mediaTitleElement) {
    console.log("✅ Found ic-perm-media title element");
    let mediaContainer = mediaTitleElement;
    
    // Test the exact traversal logic from the extension
    for (let i = 0; i < 9; i++) {
        mediaContainer = mediaContainer.parentElement;
        console.log(`DOM Level ${i+1}:`, mediaContainer?.tagName, mediaContainer?.className);
        if (!mediaContainer) {
            console.log("❌ Cannot traverse DOM - stopped at level", i+1);
            break;
        }
    }
    
    if (mediaContainer) {
        console.log("✅ Successfully traversed to media container");
        console.log("Sections parent:", mediaContainer.parentElement);
        console.log("Previous sibling (separator):", mediaContainer.previousElementSibling);
    }
} else {
    console.log("❌ Media section not found - extension won't work");
    console.log("Available SVG titles:");
    titleElements.forEach((titleEl, i) => 
        console.log(`  ${i}: "${titleEl.textContent.trim()}"`));
}
```

### 4. Test Group Info Panel Detection

1. Open any group chat
2. Click on the group name to open the group info panel
3. In the console, run:

```javascript
// Test if group info panel can be processed
const groupIdPattern = /(\d+(?:-\d+)*@g\.us)/;

// Find group ID
const elements = document.querySelectorAll('[data-id*="@g.us"]');
let foundGroupId = null;

for (let element of elements) {
    const dataId = element.getAttribute('data-id');
    const match = dataId.match(groupIdPattern);
    if (match) {
        foundGroupId = match[1];
        console.log("Found Group ID:", foundGroupId);
        break;
    }
}

if (foundGroupId) {
    console.log("✅ Group ID extracted:", foundGroupId);
    
    // Check if media section can be found the way extension does it
    const titleElements = document.querySelectorAll('svg > title');
    const mediaTitleElement = Array.from(titleElements)
        .find(titleEl => titleEl.textContent.trim() === 'ic-perm-media');
    
    if (mediaTitleElement) {
        console.log("✅ Extension should work - both group ID and media section found");
    } else {
        console.log("❌ Media section not found - extension won't display group ID");
        console.log("Available SVG titles in page:");
        titleElements.forEach((titleEl, i) => 
            console.log(`  "${titleEl.textContent.trim()}"`));
    }
} else {
    console.log("❌ No group ID found - this might be why the extension isn't working");
}
```

### 5. Manual Extension Trigger Test

If the extension should work but isn't triggering, test manual injection:

```javascript
// Manually test the extension's core functionality
class DebugWhatsAppExtractor {
    constructor() {
        this.groupIdPattern = /(\d+(?:-\d+)*@g\.us)/;
    }
    
    extractGroupId() {
        const elements = document.querySelectorAll('[data-id*="@g.us"]');
        for (let element of elements) {
            const dataId = element.getAttribute('data-id');
            const match = dataId.match(this.groupIdPattern);
            if (match) return match[1];
        }
        return null;
    }
    
    findSvgByTitle(container, titleText) {
        const titleElements = container.querySelectorAll('svg > title');
        for (let titleEl of titleElements) {
            if (titleEl.textContent.trim() === titleText) {
                return titleEl;
            }
        }
        return null;
    }
    
    test() {
        console.log("=== Manual Extension Test ===");
        
        // Test group ID extraction
        const groupId = this.extractGroupId();
        console.log("Group ID:", groupId);
        
        if (!groupId) {
            console.log("❌ Cannot extract group ID");
            return;
        }
        
        // Test media section detection
        const mediaTitleElement = this.findSvgByTitle(document, 'ic-perm-media');
        console.log("Media title found:", !!mediaTitleElement);
        
        if (!mediaTitleElement) {
            console.log("❌ Cannot find media section");
            return;
        }
        
        console.log("✅ Both group ID and media section found - extension should work");
        
        // Test DOM traversal (v1.3.0+: closest('section') + walk-up)
        const section = mediaTitleElement.closest('section');
        if (!section) {
            console.log("❌ DOM traversal failed — no parent <section> found");
            return;
        }
        let mediaRow = mediaTitleElement;
        while (mediaRow.parentElement && mediaRow.parentElement !== section) {
            mediaRow = mediaRow.parentElement;
        }
        if (mediaRow.parentElement !== section) {
            console.log("❌ DOM traversal failed — walk-up did not reach section");
            return;
        }
        
        console.log("✅ DOM traversal successful");
        console.log("Extension should be working. Check if MutationObserver is running.");
    }
}

// Run the test
const debugExtractor = new DebugWhatsAppExtractor();
debugExtractor.test();
```

## Common Issues & Solutions

### Issue 1: Extension Not Active
- **Check**: Extension enabled in `chrome://extensions/`
- **Fix**: Toggle the extension off and on
- **Alternative**: Reload the extension by clicking the refresh icon

### Issue 2: WhatsApp Interface Language/Region
- **Problem**: WhatsApp might use different SVG title identifiers in different regions
- **Test**: Check available SVG titles with the diagnostic script above
- **Evidence**: If diagnostic shows different title text than "ic-perm-media"

### Issue 3: WhatsApp Web Updates
- **Problem**: WhatsApp changed their DOM structure
- **Check**: Run the diagnostic scripts to see what's missing
- **Evidence**: Console errors or missing elements in the diagnostic output
- **Fix**: Extension may need updates to handle new DOM structure

### Issue 4: Browser Cache Issues
- **Fix**: Hard refresh WhatsApp Web (`Ctrl+Shift+R` or `Cmd+Shift+R`)
- **Alternative**: Clear browser cache for web.whatsapp.com

### Issue 5: Extension Permissions
- **Check**: Go to `chrome://extensions/`, click on the extension
- **Verify**: "Allow on web.whatsapp.com" is enabled in site access
- **Fix**: Ensure "On specific sites" includes web.whatsapp.com

### Issue 6: Content Script Injection Failure
- **Check**: Look for console errors about content script loading
- **Fix**: Reload the extension or reinstall
- **Alternative**: Check if CSP (Content Security Policy) is blocking the script

## Advanced Debugging

### Check Extension Background Processes
1. Go to `chrome://extensions/`
2. Click on "WhatsApp Group ID Extractor"
3. Click "Inspect views: service worker" (if available)
4. Look for any error messages in that console

### Test MutationObserver
```javascript
// Check if MutationObserver is working
let observerTestCount = 0;
const testObserver = new MutationObserver(() => {
    observerTestCount++;
    console.log("MutationObserver triggered:", observerTestCount);
});

testObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Test by making a DOM change
setTimeout(() => {
    const testDiv = document.createElement('div');
    testDiv.textContent = 'Observer Test';
    document.body.appendChild(testDiv);
    setTimeout(() => document.body.removeChild(testDiv), 100);
}, 1000);
```

## Comprehensive Diagnostic Report

Have the user run this comprehensive diagnostic and send you the output:

```javascript
console.log("=== FULL DIAGNOSTIC REPORT ===");
console.log("URL:", window.location.href);
console.log("User Agent:", navigator.userAgent);
console.log("Chrome Version:", navigator.appVersion);

// Extension status
console.log("WhatsApp app element:", !!(document.querySelector('[data-testid="app"]') || document.querySelector('#app')));
console.log("Group elements count:", document.querySelectorAll('[data-id*="@g.us"]').length);
console.log("Extension elements:", document.querySelectorAll('.whatsapp-group-id-extractor').length);

// SVG analysis
const titleElements = document.querySelectorAll('svg > title');
console.log("Total SVG titles found:", titleElements.length);
console.log("Available SVG titles:");
titleElements.forEach((titleEl, i) => 
    console.log(`  ${i}: "${titleEl.textContent.trim()}"`));

// Media section check
const mediaTitleFound = Array.from(titleElements)
    .some(titleEl => titleEl.textContent.trim() === 'ic-perm-media');
console.log("Media SVG found:", mediaTitleFound);

// Group ID extraction
const groupElements = document.querySelectorAll('[data-id*="@g.us"]');
const groupIdPattern = /(\d+(?:-\d+)*@g\.us)/;
let extractedGroupIds = [];
groupElements.forEach(el => {
    const dataId = el.getAttribute('data-id');
    const match = dataId.match(groupIdPattern);
    if (match) extractedGroupIds.push(match[1]);
});
console.log("Extracted Group IDs:", extractedGroupIds);

console.log("Console errors:", "Check above for any red error messages");
console.log("=== END DIAGNOSTIC REPORT ===");
```

## Expected Diagnostic Output

When the extension is working correctly, you should see:
- ✅ WhatsApp app element found: true
- ✅ Group elements found with @g.us
- ✅ Media section SVG title found: true
- ✅ Successfully traversed to media container
- ✅ Group ID extracted: [number]@g.us

When there are issues, the diagnostic will pinpoint exactly what's missing or broken.

## Extension Architecture Notes

**How the extension works:**
1. **Content Script Injection**: Runs on web.whatsapp.com pages
2. **MutationObserver**: Watches for DOM changes (group info panel opening)
3. **SVG Detection**: Looks for `svg > title` elements with text "ic-perm-media"
4. **DOM Traversal**: Uses `closest('section')` to find the drawer body, then walks up from the title until reaching its direct child of that section (v1.3.0+; replaces hardcoded 9-level traversal)
5. **Group ID Extraction**: Reads `model-storage → group-metadata` IndexedDB, matches group subject to return the `@g.us` JID (v1.2.0+; replaces `data-id` DOM attribute lookup)
6. **Element Injection**: Inserts group ID display before media section

**Critical Dependencies:**
- WhatsApp Web must be fully loaded
- Group info panel must be open
- SVG structure must contain "ic-perm-media" title
- Drawer body wrapped in a `<section>` element
- IndexedDB `model-storage` must contain the group in `group-metadata` object store