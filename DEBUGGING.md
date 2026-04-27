# WhatsApp Group ID Plugin — Debugging Guide

## Quick debug

With the group info panel open in WhatsApp Web:

1. Open Chrome DevTools (`F12` / `Cmd+Option+I`) → **Console** tab
2. Type `allow pasting` and press Enter
3. Copy the entire contents of [`debug_group.js`](debug_group.js) and paste it into the console
4. Read the output — each step is labelled and will show ✅ or ❌

The script runs through four steps:
1. **Panel detection** — finds the `ic-perm-media` SVG (confirms group info panel is open)
2. **Group name extraction** — tries three strategies in order (see below)
3. **IndexedDB lookup** — looks up the group JID from `model-storage → group-metadata`
4. **Insertion point check** — confirms the DOM traversal will land in the right place

---

## First, verify the extension is loaded

1. Go to `chrome://extensions/`
2. Check "WhatsApp Group ID Extractor" is present and the toggle is **ON**
3. If missing: load it in developer mode (Load unpacked → select the repo folder)

---

## Common issues

| Symptom                           | Likely cause                                  | Fix                                                 |
| --------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| Step 1 fails (no `ic-perm-media`) | Panel not open, or extension not injected     | Open group info panel first; reload extension       |
| Step 2 fails (no group name)      | WhatsApp changed its `data-testid` attributes | See notes below                                     |
| Step 3 fails (no IndexedDB match) | Group not yet cached, or name mismatch        | Open the group chat first so WhatsApp caches it     |
| Step 4 fails (walk-up to root)    | WhatsApp restructured the panel DOM           | Row sibling count heuristic needs updating          |
| Row appears in wrong position     | Sibling count threshold off                   | Check "Rows container" child count in Step 4 output |
| Extension row present but blank   | Group ID resolved to null                     | See Step 3 output                                   |

---

## How group name extraction works (Step 2)

Three strategies are tried in order — all reported by the debug script:

1. **`data-testid*="group-info-drawer-subject-input-read-only"`** — most direct; may break if WhatsApp renames the test ID
2. **`aria-label^="Group profile picture for"`** — English UI only; may break if WhatsApp changes the label format
3. **`ic-person-add` SVG structural walk** — attribute-free; walks up from the Add Member button SVG to find the header area, then reads the first text child — works regardless of `data-testid` values

---

## How insertion works (Step 4)

Starting from the `ic-perm-media` SVG title, the code walks up the DOM until the parent element has ≥ 4 children. At that point it has reached the rows container (the element that holds all info panel rows: profile pic, description, media, stars, notifications, etc.). The Group ID row is inserted before the media row.

No tag names, `data-testid`, or fixed depth are used — only `ic-perm-media` and sibling count.

---

## Architecture notes

1. **MutationObserver** watches `document.body` for newly added nodes containing `ic-perm-media`
2. After a 100 ms delay (lets the panel finish rendering), `processGroupInfoPanel` runs
3. Group name is extracted (three strategies above), used to query IndexedDB
4. IndexedDB `model-storage → group-metadata` is scanned for a record whose `subject` matches
5. If found, the Group ID row is inserted before the media row

---

## WhatsApp implementation dependencies

| Dependency                                                      | Used for                                         | Risk     | Fallback?                  |
| --------------------------------------------------------------- | ------------------------------------------------ | -------- | -------------------------- |
| `data-testid="app"` or `#app`                                   | Startup gate — wait for WhatsApp to load         | Low      | No (failure = no observer) |
| SVG `<title>ic-perm-media</title>`                              | Detect group info panel opened                   | Medium   | No                         |
| SVG `<title>ic-perm-media</title>`                              | Insertion point walk-up anchor                   | Medium   | No                         |
| `[data-testid*="group-info-drawer-subject-input-read-only"]`    | Name extraction strategy 1 (primary)             | Medium   | Yes → strategies 2 & 3     |
| `[aria-label^="Group profile picture for"]` + regex `"..."`     | Name extraction strategy 2                       | Medium   | Yes → strategy 3           |
| SVG `<title>ic-person-add</title>` + `<title>ic-search</title>` | Name extraction strategy 3 (SVG structural walk) | Medium   | No (last fallback)         |
| IndexedDB database `model-storage`                              | Group JID lookup                                 | **High** | No                         |
| Object store `group-metadata`                                   | Group JID lookup                                 | **High** | No                         |
| Record fields `id` (`@g.us`) and `subject`                      | Group JID lookup                                 | **High** | No                         |
| `data-id` / `data-jid` attributes with `@g.us`                  | Legacy group ID extraction                       | Low      | Yes → IndexedDB            |

