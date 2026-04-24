#!/usr/bin/env python3
"""
Tests for WhatsApp Group ID Extractor.

Covers:
  1. Regex pattern matching (Strategy 1 / legacy DOM attribute fallback)
  2. IndexedDB group-metadata lookup logic (Strategy 2 - primary since v1.2.0)
  3. Group name extraction selector logic (panel header parsing)
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

def test_indexeddb_lookup_logic():
    """
    Test the core matching logic used by lookupGroupIdByName() in content-script.js.

    The JS implementation scans all records in the IndexedDB 'group-metadata' object
    store and returns the first record whose 'id' contains '@g.us' and whose 'subject'
    exactly equals the group name extracted from the panel.
    """

    print("\n🧪 Testing IndexedDB group-metadata lookup logic...")
    print("=" * 50)

    def lookup_group_id_by_name(records, group_name):
        """Python equivalent of lookupGroupIdByName() in content-script.js."""
        match = next(
            (r for r in records if '@g.us' in r.get('id', '') and r.get('subject') == group_name),
            None
        )
        return match['id'] if match else None

    # Simulated IndexedDB group-metadata records
    sample_records = [
        {'id': '120363023265834766@g.us', 'subject': 'דיירי בניין איינשטיין 6'},
        {'id': '120363000000000001@g.us', 'subject': 'Family Group'},
        {'id': '120363000000000002@g.us', 'subject': 'Work Team'},
        {'id': 'some-other-record',        'subject': 'Not a group'},   # no @g.us – must be ignored
        {'id': '120363000000000003@g.us', 'subject': 'Duplicate Name'},
        {'id': '120363000000000004@g.us', 'subject': 'Duplicate Name'},  # second with same subject
    ]

    test_cases = [
        {
            'name': 'Exact match – Hebrew group name',
            'group_name': 'דיירי בניין איינשטיין 6',
            'expected': '120363023265834766@g.us',
        },
        {
            'name': 'Exact match – ASCII group name',
            'group_name': 'Family Group',
            'expected': '120363000000000001@g.us',
        },
        {
            'name': 'No match – name not in store',
            'group_name': 'Unknown Group',
            'expected': None,
        },
        {
            'name': 'Record without @g.us in id is ignored',
            'group_name': 'Not a group',
            'expected': None,
        },
        {
            'name': 'Duplicate subject – returns first match',
            'group_name': 'Duplicate Name',
            'expected': '120363000000000003@g.us',
        },
        {
            'name': 'Empty store returns None',
            'group_name': 'Family Group',
            'expected': None,
            'records_override': [],
        },
    ]

    passed = 0
    total = len(test_cases)

    for i, tc in enumerate(test_cases, 1):
        print(f"\n{i}. {tc['name']}")
        records = tc.get('records_override', sample_records)
        result = lookup_group_id_by_name(records, tc['group_name'])
        if result == tc['expected']:
            print(f"   ✅ PASS: '{result}'")
            passed += 1
        else:
            print(f"   ❌ FAIL: expected '{tc['expected']}', got '{result}'")

    print(f"\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} passed")
    if passed == total:
        print("🎉 All IndexedDB lookup tests passed.")
    else:
        print("❌ Some tests failed.")
    return passed == total


def test_group_name_extraction():
    """
    Test the group name extraction logic used by extractGroupNameFromPanel().

    The extension uses two strategies (in order):
      1. Element with data-testid containing 'group-info-drawer-subject-input-read-only'
         → textContent is the group name.
      2. Element with aria-label matching 'Group profile picture for "<name>"'
         → the quoted name is extracted.
    """

    print("\n🧪 Testing group name extraction logic...")
    print("=" * 50)

    SUBJECT_TESTID = 'group-info-drawer-subject-input-read-only'
    PIC_LABEL_RE = re.compile(r'^Group profile picture for "(.+)"$')

    def extract_group_name(subject_text, pic_label=None):
        """Python equivalent of extractGroupNameFromPanel() in content-script.js."""
        # Strategy 1: subject input element
        if subject_text and subject_text.strip():
            return subject_text.strip()
        # Strategy 2: aria-label on group picture container
        if pic_label:
            m = PIC_LABEL_RE.match(pic_label)
            if m:
                return m.group(1)
        return None

    test_cases = [
        {
            'name': 'Hebrew name via subject input (primary path)',
            'subject_text': 'דיירי בניין איינשטיין 6',
            'pic_label': None,
            'expected': 'דיירי בניין איינשטיין 6',
        },
        {
            'name': 'ASCII name via subject input',
            'subject_text': 'Family Group',
            'pic_label': 'Group profile picture for "Family Group"',
            'expected': 'Family Group',   # subject input wins
        },
        {
            'name': 'Fallback to aria-label when subject input absent',
            'subject_text': None,
            'pic_label': 'Group profile picture for "Work Team"',
            'expected': 'Work Team',
        },
        {
            'name': 'Whitespace-only subject text falls through to aria-label',
            'subject_text': '   ',
            'pic_label': 'Group profile picture for "Trimmed Group"',
            'expected': 'Trimmed Group',
        },
        {
            'name': 'Both absent – returns None',
            'subject_text': None,
            'pic_label': None,
            'expected': None,
        },
        {
            'name': 'Malformed aria-label – returns None',
            'subject_text': None,
            'pic_label': 'Profile picture for Work Team',  # missing quotes
            'expected': None,
        },
    ]

    passed = 0
    total = len(test_cases)

    for i, tc in enumerate(test_cases, 1):
        print(f"\n{i}. {tc['name']}")
        result = extract_group_name(tc['subject_text'], tc['pic_label'])
        if result == tc['expected']:
            print(f"   ✅ PASS: '{result}'")
            passed += 1
        else:
            print(f"   ❌ FAIL: expected '{tc['expected']}', got '{result}'")

    print(f"\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} passed")
    if passed == total:
        print("🎉 All group name extraction tests passed.")
    else:
        print("❌ Some tests failed.")
    return passed == total


if __name__ == "__main__":
    r1 = test_group_id_extraction()
    r2 = test_indexeddb_lookup_logic()
    r3 = test_group_name_extraction()
    import sys
    sys.exit(0 if (r1 and r2 and r3) else 1)