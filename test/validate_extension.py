#!/usr/bin/env python3
"""
Extension validation script for WhatsApp Group ID Extractor
Validates manifest, checks for required files, and runs basic tests
"""

import json
import os
from pathlib import Path

class ExtensionValidator:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent  # Go up one level to the actual project root
        self.errors = []
        self.warnings = []
        
    def validate_manifest(self):
        """Validate the manifest.json file"""
        manifest_path = self.project_root / "manifest.json"
        
        if not manifest_path.exists():
            self.errors.append("❌ manifest.json not found")
            return
            
        try:
            with open(manifest_path) as f:
                manifest = json.load(f)
                
            # Check required fields
            required_fields = ["manifest_version", "name", "version", "permissions"]
            for field in required_fields:
                if field not in manifest:
                    self.errors.append(f"❌ Missing required field in manifest: {field}")
                    
            # Check manifest version
            if manifest.get("manifest_version") != 3:
                self.warnings.append("⚠️ Using Manifest V2 - consider upgrading to V3")
                
            # Check permissions
            if "*://web.whatsapp.com/*" not in manifest.get("host_permissions", []):
                self.errors.append("❌ Missing WhatsApp Web host permission")
                
            print("✅ Manifest validation passed")
            
        except json.JSONDecodeError as e:
            self.errors.append(f"❌ Invalid JSON in manifest.json: {e}")
            
    def validate_files(self):
        """Check for required files"""
        required_files = [
            "content-script.js",
            "styles.css", 
            "popup.html"
        ]
        
        for file in required_files:
            file_path = self.project_root / file
            if not file_path.exists():
                self.errors.append(f"❌ Missing required file: {file}")
            else:
                # Check file size (should not be empty)
                if file_path.stat().st_size == 0:
                    self.warnings.append(f"⚠️ File is empty: {file}")
                    
        # Check icons
        icon_dir = self.project_root / "icons"
        if not icon_dir.exists():
            self.warnings.append("⚠️ Icons directory missing")
        else:
            icon_files = ["icon16.png", "icon48.png", "icon128.png"]
            for icon in icon_files:
                if not (icon_dir / icon).exists():
                    self.warnings.append(f"⚠️ Missing icon: {icon}")
                    
        print("✅ File structure validation completed")
        
    def validate_content_script(self):
        """Basic validation of content script"""
        script_path = self.project_root / "content-script.js"
        
        if not script_path.exists():
            return
            
        with open(script_path) as f:
            content = f.read()
            
        # Check for required functionality
        required_patterns = [
            "extractGroupId",
            "createGroupIdElement", 
            "copyToClipboard",
            "MutationObserver"
        ]
        
        for pattern in required_patterns:
            if pattern not in content:
                self.warnings.append(f"⚠️ Content script may be missing: {pattern}")
                
        # Check for potential issues
        if "console.log" in content:
            self.warnings.append("⚠️ Content script contains console.log statements (consider removing for production)")
            
        print("✅ Content script validation completed")
        
    def run_validation(self):
        """Run all validations"""
        print("🔍 Validating WhatsApp Group ID Extractor...")
        print("=" * 50)
        
        self.validate_manifest()
        self.validate_files()
        self.validate_content_script()
        
        print("\n" + "=" * 50)
        print("📋 VALIDATION RESULTS:")
        
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  {error}")
                
        if self.warnings:
            print(f"\n⚠️ WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  {warning}")
                
        if not self.errors and not self.warnings:
            print("\n🎉 All validations passed! Extension is ready.")
        elif not self.errors:
            print(f"\n✅ No critical errors found. {len(self.warnings)} warnings to review.")
        else:
            print(f"\n❌ Found {len(self.errors)} errors that need to be fixed.")
            
        return len(self.errors) == 0

def main():
    validator = ExtensionValidator()
    success = validator.run_validation()
    
    if success:
        print("\n🚀 Extension validation successful!")
        print("Ready to load in Chrome Developer Mode:")
        print("1. Open chrome://extensions/")
        print("2. Enable 'Developer mode'") 
        print("3. Click 'Load unpacked'")
        print(f"4. Select folder: {validator.project_root}")
    else:
        print("\n🛑 Please fix the errors before loading the extension.")
        
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())