#!/usr/bin/env python3
"""
Icon generator for WhatsApp Group ID Extractor
Converts SVG to PNG icons in required sizes
"""

import os
import sys
from pathlib import Path

def generate_icons():
    """Generate PNG icons from SVG source"""
    project_root = Path(__file__).parent
    svg_path = project_root / "icons" / "icon.svg"
    
    if not svg_path.exists():
        print("❌ SVG icon file not found")
        return False
        
    # Required icon sizes for Chrome extensions
    sizes = [16, 48, 128]
    
    print("🎨 Generating PNG icons from SVG...")
    
    try:
        # Try using cairosvg (if available)
        try:
            import cairosvg
            
            for size in sizes:
                output_path = project_root / "icons" / f"icon{size}.png"
                cairosvg.svg2png(
                    url=str(svg_path),
                    write_to=str(output_path),
                    output_width=size,
                    output_height=size
                )
                print(f"✅ Generated icon{size}.png")
                
        except ImportError:
            print("⚠️ cairosvg not available. Trying alternative methods...")
            
            # Alternative: Use system convert (ImageMagick) if available
            for size in sizes:
                output_path = project_root / "icons" / f"icon{size}.png"
                cmd = f"convert -size {size}x{size} {svg_path} {output_path}"
                
                if os.system(cmd) == 0:
                    print(f"✅ Generated icon{size}.png using ImageMagick")
                else:
                    print(f"❌ Failed to generate icon{size}.png")
                    print("Please install cairosvg: pip install cairosvg")
                    print("Or install ImageMagick: brew install imagemagick (macOS)")
                    return False
                    
    except Exception as e:
        print(f"❌ Error generating icons: {e}")
        return False
        
    print("🎉 Icon generation complete!")
    return True

def create_fallback_icons():
    """Create simple colored squares as fallback icons"""
    project_root = Path(__file__).parent
    
    # This creates a simple base64 encoded 1x1 pixel PNG that browsers can scale
    # Not ideal but works as a fallback
    
    print("📦 Creating fallback placeholder icons...")
    
    # Simple HTML file that can generate icons
    html_generator = f"""
<!DOCTYPE html>
<html>
<head><title>Icon Generator</title></head>
<body>
<canvas id="canvas" width="128" height="128"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Draw icon
ctx.fillStyle = '#00a884';
ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = 'white';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText('WA', 64, 70);

// Output data URL
console.log('Canvas data URL:', canvas.toDataURL());
</script>
</body>
</html>
"""
    
    fallback_path = project_root / "icons" / "generate_fallback.html"
    with open(fallback_path, 'w') as f:
        f.write(html_generator)
        
    print("📝 Created fallback icon generator at icons/generate_fallback.html")
    print("Open this file in a browser and check the console for data URLs")
    
    return True

def main():
    print("🎨 WhatsApp Group ID Extractor - Icon Generator")
    print("=" * 50)
    
    success = generate_icons()
    
    if not success:
        print("\n📝 Trying fallback icon creation...")
        create_fallback_icons()
        print("\n💡 MANUAL ICON CREATION:")
        print("1. Open icons/generate_fallback.html in a browser") 
        print("2. Copy the data URL from browser console")
        print("3. Use online converter to create PNG files")
        print("4. Or use any graphics editor to create 16x16, 48x48, 128x128 PNG icons")
        
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())