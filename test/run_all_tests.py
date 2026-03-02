#!/usr/bin/env python3
"""
Comprehensive test runner for WhatsApp Group ID Extension
Runs all validation and test scripts in sequence
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))
        
        if result.returncode == 0:
            print("✅ SUCCESS")
            if result.stdout.strip():
                print(result.stdout)
            return True
        else:
            print("❌ FAILED")
            if result.stderr.strip():
                print("STDERR:", result.stderr)
            if result.stdout.strip():
                print("STDOUT:", result.stdout)
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 WhatsApp Group ID Extension - Comprehensive Test Suite")
    print("=" * 60)
    
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    venv_python = project_root / '.venv' / 'bin' / 'python'
    
    if not venv_python.exists():
        print("❌ Virtual environment not found. Please run: python -m venv .venv && .venv/bin/pip install -r requirements.txt")
        return False
    
    tests = [
        (f"{venv_python} test/validate_extension.py", "Extension Structure & Manifest Validation"),
        (f"{venv_python} test/test_group_id.py", "Group ID Extraction Pattern Testing"),
        (f"{venv_python} test/test_dash_support.py", "Dashed Group ID Support Testing"),
    ]
    
    passed = 0
    total = len(tests)
    
    for command, description in tests:
        if run_command(command, description):
            passed += 1
    
    print(f"\n{'='*60}")
    print(f"🏁 TEST SUITE COMPLETE")
    print(f"{'='*60}")
    print(f"📊 Results: {passed}/{total} test suites passed")
    
    if passed == total:
        print("🎉 All tests passed! Extension is ready for deployment.")
        print("\n🌐 To test the HTML interface:")
        print(f"   Open: {project_root}/test/test.html")
        return True
    else:
        print("❌ Some tests failed. Please review the output above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)