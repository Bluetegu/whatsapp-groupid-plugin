# WhatsApp Group ID Extractor

A Chrome extension that automatically adds WhatsApp group ID information to the group info panel on WhatsApp Web, making it easy to copy group IDs for Openclaw configuration.

*This extension was developed with the assistance of GitHub Copilot.*

## Features

- 🎯 **Automatic Detection**: Automatically detects when you open a group info panel
- 📋 **Easy Copy**: One-click copy button to copy group IDs to clipboard  
- 🎨 **Native Design**: Matches WhatsApp Web's design system seamlessly
- 🔒 **Privacy Focused**: Runs only on WhatsApp Web, no data collection
- ⚡ **Lightweight**: Minimal impact on WhatsApp Web performance

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the [Chrome Web Store listing]()
2. Click "Add to Chrome"
3. Navigate to WhatsApp Web to start using

### Manual Installation (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Navigate to [web.whatsapp.com](https://web.whatsapp.com) to start using

## How to Use

1. **Open WhatsApp Web**: Navigate to [web.whatsapp.com](https://web.whatsapp.com)
2. **Open Group Chat**: Click on any group conversation
3. **Open Group Info**: Click on the group name at the top to open the group info panel
4. **Find Group ID**: Look for the new "Group ID" section above "Media, links and docs"
5. **Copy ID**: Click the "Copy" button to copy the group ID to your clipboard

## Group ID Format

The extension extracts group IDs in the format: `123456789@g.us`

This is the clean format needed for Openclaw configuration, extracted from WhatsApp's internal data attributes.

## Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome extension standard
- **Content Script**: Runs only on WhatsApp Web pages
- **DOM Observer**: Watches for group info panel changes
- **Clipboard API**: Modern clipboard integration with fallback support

### File Structure
```
whatsapp-groupid-plugin/
├── manifest.json          # Extension configuration
├── content-script.js      # Main functionality
├── styles.css            # WhatsApp-matching styles  
├── popup.html            # Extension popup interface
├── icons/                # Extension icons (16, 48, 128px)
├── test/                 # Test suite and utilities
│   ├── test.html         # Interactive test suite
│   ├── test_group_id.py  # Group ID extraction tests
│   └── validate_extension.py # Extension validation
├── dev_server.py         # Development HTTP server
├── generate_icons.py     # Icon generation utility
├── requirements.txt      # Python dependencies
├── CONTRIBUTING.md       # Development guide
└── README.md             # This file
```

### Browser Support
- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)
- Requires WhatsApp Web access

## Development

### Quick Setup
```bash
# Set up Python environment for development tools
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Testing

**Interactive Test Suite:**
```bash
# Start development server
python dev_server.py
# Opens http://localhost:8000/test/test.html automatically
```

**Automated Tests:**
```bash
# Run all tests
python test/test_group_id.py
python test/validate_extension.py
```

**Test Coverage:**
- Group ID extraction with dashes support
- DOM interaction validation
- Extension structure validation
- Clipboard functionality testing

### Building
No build process required - this is a vanilla JavaScript extension.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Run validation: `python test/validate_extension.py`
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup and guidelines.

## Privacy & Security

- **No Data Collection**: The extension does not collect, store, or transmit any user data
- **Local Processing**: All group ID extraction happens locally in your browser
- **WhatsApp Only**: Only runs on web.whatsapp.com, no other sites are affected
- **Open Source**: Full source code is available for review

## Permissions

The extension requests minimal permissions:
- `activeTab`: Access to the current WhatsApp Web tab only
- `host_permissions`: Limited to `web.whatsapp.com` only

## Changelog

### Version 1.0.0
- Initial release
- Group ID extraction from WhatsApp Web
- Copy to clipboard functionality
- WhatsApp design system integration
- Test suite for development

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/whatsapp-groupid-plugin/issues)
- **Development Guide**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Testing**: Use `python dev_server.py` for interactive testing

## Related Projects

This extension is designed to work with [Openclaw](https://openclaw.com) for WhatsApp group management.