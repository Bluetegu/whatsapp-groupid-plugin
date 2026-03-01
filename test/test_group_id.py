#!/usr/bin/env python3
"""
Quick test to verify group ID extraction functionality
"""

import re

def test_group_id_extraction():
    """Test the group ID extraction logic"""
    
    print("🧪 Testing Group ID Extraction...")
    print("=" * 50)
    
    # Test cases from WhatsApp Web
    test_cases = [
        {
            'name': 'Original example from project definition',
            'data': 'true_120363406415684625@g.us_ACB5BE66BC64B27102BFC22E6019BFA8_972545751506@c.us',
            'expected': '120363406415684625@g.us'
        },
        {
            'name': 'Sample from group-pannel.html', 
            'data': 'true_120363406415684625@g.us_AC7593255FE70AF81AEBC12EDF516917_972545751506@c.us',
            'expected': '120363406415684625@g.us'
        },
        {
            'name': 'Different group ID format',
            'data': 'true_987654321012345678@g.us_SOMEOTHER_DATA_123456@c.us', 
            'expected': '987654321012345678@g.us'
        },
        {
            'name': 'Group ID with dashes (new format)',
            'data': 'false_972543343341-1427116328@g.us_3EB0C4DF00BE6127AAA7D5_125048677478451@lid',
            'expected': '972543343341-1427116328@g.us'
        },
        {
            'name': 'Group ID with multiple dashes',
            'data': 'true_123-456-789-012@g.us_ANOTHER_HASH_987654321@c.us',
            'expected': '123-456-789-012@g.us'
        },
        {
            'name': 'Text content with @g.us (should not match outside data-id)',
            'data': 'This is just text mentioning @g.us but not in data-id',
            'expected': None
        },
        {
            'name': 'Invalid format (should not match)',
            'data': 'some_random_string_without_group_id',
            'expected': None
        }
    ]
    
    # The corrected regex pattern - now supports dashes
    pattern = r'(\d+(?:-\d+)*@g\.us)'
    
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
        print("🎉 All tests passed! Group ID extraction is working correctly.")
    else:
        print("❌ Some tests failed. Please review the regex pattern.")
    
    return passed == total

if __name__ == "__main__":
    test_group_id_extraction()