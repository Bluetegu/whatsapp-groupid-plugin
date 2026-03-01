#!/usr/bin/env python3
"""
Test script to verify that the updated regex supports dashed group IDs
"""

import re

def test_dash_support():
    """Test the updated regex pattern with dashed group IDs"""
    
    print("🧪 Testing Dashed Group ID Support")
    print("=" * 50)
    
    # Updated pattern that supports dashes
    pattern = r'(\d+(?:-\d+)*@g\.us)'
    
    test_cases = [
        {
            'name': 'User example with dashes',
            'data': 'false_972543343341-1427116328@g.us_3EB0C4DF00BE6127AAA7D5_125048677478451@lid',
            'expected': '972543343341-1427116328@g.us'
        },
        {
            'name': 'Regular format (should still work)',
            'data': 'true_120363406415684625@g.us_AC7593255FE70AF81AEBC12EDF516917_972545751506@c.us',
            'expected': '120363406415684625@g.us'
        },
        {
            'name': 'Multiple dashes',
            'data': 'true_123-456-789-012@g.us_HASH_123@c.us',
            'expected': '123-456-789-012@g.us'
        },
        {
            'name': 'Text containing @g.us (should not match)',
            'data': 'Just some text with @g.us in it',
            'expected': None
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print(f"   Data: {test_case['data']}")
        
        match = re.search(pattern, test_case['data'])
        result = match.group(1) if match else None
        
        if result == test_case['expected']:
            print(f"   ✅ PASS: Found '{result}'")
            passed += 1
        else:
            print(f"   ❌ FAIL: Expected '{test_case['expected']}', got '{result}'")
    
    print(f"\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Dashed group ID support is working correctly.")
    else:
        print("❌ Some tests failed. Please review the implementation.")
    
    return passed == total

if __name__ == "__main__":
    test_dash_support()