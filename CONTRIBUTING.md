# Contributing to WhatsApp Group ID Extractor

Thank you for your interest in contributing to the WhatsApp Group ID Extractor Chrome extension! This guide will help you set up the development environment and understand the testing workflow.

## 📁 Directory Structure

```
whatsapp-groupid-plugin/
├── manifest.json              # Chrome extension manifest
├── content-script.js          # Main extension logic
├── styles.css                 # Extension styling
├── popup.html                 # Extension popup interface
├── icons/                     # Extension icons (16, 48, 128px)
├── dev_server.py              # Development HTTP server
├── generate_icons.py          # Icon generation utility
├── requirements.txt           # Python dependencies
├── package.json              # Project metadata
├── README.md                 # Main documentation
├── CONTRIBUTING.md           # This file
├── .gitignore                # Git ignore rules
└── test/                     # Test suite directory
    ├── test.html             # Interactive test suite
    ├── test_group_id.py      # Core extraction tests
    ├── test_dash_support.py  # Dashed group ID tests
    └── validate_extension.py # Extension validation
```

## 🚀 Development Setup

### Prerequisites
- Python 3.11+ 
- Google Chrome browser
- Basic knowledge of JavaScript and Chrome extensions

### 1. Clone and Setup Environment

```bash
cd /path/to/whatsapp-groupid-plugin
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Verify Installation

```bash
python test/validate_extension.py
```

Expected output: ✅ Extension validation successful!

## 🧪 Testing

### Run All Tests

```bash
# Core group ID extraction tests
python test/test_group_id.py

# Dashed group ID format tests  
python test/test_dash_support.py

# Extension structure validation
python test/validate_extension.py
```

### Interactive Testing

Start the development server:

```bash
python dev_server.py
```

This will:
- Start HTTP server on http://localhost:8000
- Auto-open the test page at http://localhost:8000/test/test.html
- Provide interactive testing interface

**Available Test Functions:**
- **Group ID Extraction**: Tests regex pattern matching
- **DOM Integration**: Tests element insertion logic
- **Copy Functionality**: Tests clipboard operations
- **UI Components**: Tests visual elements and styling

### Test Different Ports

If port 8000 is busy:

```bash
python dev_server.py --port 8001
```

## 🔧 Chrome Extension Development

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the project root directory: `/path/to/whatsapp-groupid-plugin`

### Test on WhatsApp Web

1. Navigate to https://web.whatsapp.com
2. Open any group chat
3. Click on the group name to open group info
4. Verify that "Group ID" appears after "Group created by" section
5. Test the copy functionality

### Development Workflow

1. **Make changes** to `content-script.js`, `styles.css`, or other files
2. **Run tests** to verify functionality:
   ```bash
   python test/validate_extension.py
   python test/test_group_id.py
   ```
3. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the WhatsApp Group ID Extractor card
4. **Test on WhatsApp Web** to verify changes work as expected

## 🐛 Debugging

### Common Issues

**Extension not loading:**
- Check `python test/validate_extension.py` for errors
- Verify all required files exist in project root
- Check Chrome Developer Console for errors

**Group ID not extracted:**
- Verify the regex pattern in `content-script.js` line 8
- Test with `python test/test_group_id.py`
- Check browser console for WhatsApp DOM structure changes

**Tests failing:**
- Ensure Python virtual environment is activated
- Verify dependencies: `pip install -r requirements.txt`
- Check that file paths are correct after any reorganization

### Development Tools

**Validate Extension:**
```bash
python test/validate_extension.py
```

**Generate New Icons:**
```bash
# Place your source image in icons/ and run:
python generate_icons.py
```

**Check Group ID Regex:**
```bash
python test/test_dash_support.py
```

## 📝 Code Guidelines

### JavaScript (content-script.js)
- Use ES6+ features
- Include JSDoc comments for functions
- Handle errors gracefully
- Keep console.log statements for development (remove for production)

### CSS (styles.css)
- Use CSS custom properties for theming
- Support both light and dark modes
- Keep selectors simple and maintainable
- Avoid WhatsApp-specific ephemeral class names

### Python (tests)
- Follow PEP 8 style guidelines
- Include descriptive test names
- Use meaningful assertions
- Add docstrings for test functions

## 🔍 Group ID Format Support

The extension supports multiple group ID formats:

```
Regular format:     120363406415684625@g.us
Dashed format:      972543343341-1427116328@g.us
Multiple dashes:    123-456-789-012@g.us
```

The regex pattern: `(\d+(?:-\d+)*@g\.us)` handles all these cases.

## 📋 Testing Checklist

Before submitting changes:

- [ ] All Python tests pass
- [ ] Extension validation passes
- [ ] Manual testing on WhatsApp Web works
- [ ] Both regular and dashed group IDs are supported
- [ ] Copy functionality works correctly
- [ ] UI integrates well with WhatsApp's design
- [ ] No console errors in browser
- [ ] Extension loads without warnings

## 🚀 Deployment

For production deployment:

1. Remove console.log statements from `content-script.js`
2. Run full test suite
3. Validate extension structure
4. Package for Chrome Web Store submission

## 📞 Support

If you encounter issues:

1. Check existing tests and validation output
2. Review the browser console for errors
3. Test with the interactive test suite
4. Verify WhatsApp Web DOM structure hasn't changed

---

Happy coding! 🎉