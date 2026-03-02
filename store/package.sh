#!/bin/bash
# Chrome Web Store Submission Package Creator
# Creates production-ready ZIP file for Chrome Web Store

set -e  # Exit on any error

echo "🚀 Preparing WhatsApp Group ID Extractor for Chrome Web Store submission..."
echo "=" * 70

# Get to the project root (parent of store directory)
cd "$(dirname "$0")/.."

# Define the package name with version
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
PACKAGE_NAME="whatsapp-groupid-plugin-v${VERSION}"
ZIP_PATH="store/${PACKAGE_NAME}.zip"

echo "📦 Creating package: ${PACKAGE_NAME}"
echo "📁 Output location: ${ZIP_PATH}"

# Remove existing zip if it exists
if [ -f "$ZIP_PATH" ]; then
    rm "$ZIP_PATH"
    echo "🗑️  Removed existing ZIP file"
fi

# Core extension files for Chrome Web Store
FILES=(
    "manifest.json"
    "content-script.js" 
    "styles.css"
    "popup.html"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

# Verify all required files exist
echo "🔍 Verifying required files..."
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: Required file missing: $file"
        exit 1
    fi
    echo "  ✅ $file"
done

# Create ZIP package
echo ""
echo "📦 Creating Chrome Web Store package..."
zip -q "$ZIP_PATH" "${FILES[@]}"

# Verify ZIP was created and get size
if [ -f "$ZIP_PATH" ]; then
    ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
    echo "✅ Package created successfully!"
    echo "📏 Package size: $ZIP_SIZE" 
    echo "📍 Location: $ZIP_PATH"
    
    # List contents for verification
    echo ""
    echo "📋 Package contents:"
    unzip -l "$ZIP_PATH"
    
    echo ""
    echo "🎉 Ready for Chrome Web Store submission!"
    echo "📋 Next steps:"
    echo "   1. Go to https://chrome.google.com/webstore/devconsole/"
    echo "   2. Upload $ZIP_PATH"
    echo "   3. Fill in store listing details (see SUBMISSION.md)"
    echo "   4. Submit for review"
    
else
    echo "❌ ERROR: Failed to create ZIP package"
    exit 1
fi