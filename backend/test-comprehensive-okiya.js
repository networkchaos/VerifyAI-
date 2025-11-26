// Comprehensive test script for OKIYA GEORGE ADISA's ID card
// Tests all possible scenarios: correct data, wrong ID, wrong name, wrong DOB, etc.

import { parseKenyanID } from './services/idParser.js'

console.log('🧪 Comprehensive System Test - OKIYA GEORGE ADISA')
console.log('=' .repeat(70))
console.log('')

// Correct test data
const correctData = {
  fullName: 'OKIYA GEORGE ADISA',
  nationalId: '280773178',
  dateOfBirth: '2007-01-20',
}

// Simulated OCR text based on the ID card description
const mockOcrText = `
JAMHURI YA KENYA
REPUBLIC OF KENYA
KITAMBULISHO CHA TAIFA
NATIONAL IDENTITY CARD

COUNTY: SIAYA
SUB-COUNTY: UGENYA
DIVISION: UKWALA
LOCATION: WEST UGENYA
SUB-LOCATION: KARADOLO WEST

DATE OF ISSUE: 23.04.2025

Surname: OKIYA
Given Name: GEORGE ADISA
Sex: MALE
Nationality: KEN
Place of Birth: NAIROBI
ID Number: 280773178
Date of Birth: 20.01.2007
Date of Expiry: 16.04.2035
Place of Issue: UKWALA

PRINCIPAL REGISTRAR'S SIGN.

IDKEN2807731787<413<4131<<<<<<
0701204M3504163KEN258843435027
OKIYA<<GEORGE<ADISA<<<<<<<<<<
`

// Test scenarios
const testScenarios = [
  {
    name: '✅ Scenario 1: CORRECT DATA (Should PASS)',
    data: correctData,
    expectedResult: 'PASS',
  },
  {
    name: '❌ Scenario 2: WRONG ID NUMBER (Should FAIL)',
    data: {
      ...correctData,
      nationalId: '123456789', // Wrong ID
    },
    expectedResult: 'FAIL',
  },
  {
    name: '⚠️ Scenario 3: WRONG NAME (ID correct, DOB correct - Should PASS)',
    data: {
      ...correctData,
      fullName: 'JOHN DOE SMITH', // Wrong name
    },
    expectedResult: 'PASS', // Will pass because ID matches AND DOB matches
  },
  {
    name: '❌ Scenario 4: WRONG ID + WRONG NAME (Should FAIL)',
    data: {
      fullName: 'JOHN DOE SMITH',
      nationalId: '123456789',
      dateOfBirth: correctData.dateOfBirth,
    },
    expectedResult: 'FAIL',
  },
  {
    name: '⚠️ Scenario 5: WRONG DATE OF BIRTH (ID correct, Name correct - Should PASS)',
    data: {
      ...correctData,
      dateOfBirth: '1990-01-01', // Wrong DOB
    },
    expectedResult: 'PASS', // Will pass because ID matches AND name matches
  },
  {
    name: '❌ Scenario 6: WRONG ID + WRONG DOB (Should FAIL)',
    data: {
      ...correctData,
      nationalId: '123456789',
      dateOfBirth: '1990-01-01',
    },
    expectedResult: 'FAIL',
  },
  {
    name: '⚠️ Scenario 7: CORRECT ID + WRONG NAME (DOB correct - Should PASS)',
    data: {
      fullName: 'JOHN DOE SMITH', // Wrong name
      nationalId: '280773178', // Correct ID
      dateOfBirth: correctData.dateOfBirth,
    },
    expectedResult: 'PASS', // Will pass because ID matches AND DOB matches
  },
  {
    name: '⚠️ Scenario 8: CORRECT ID + WRONG DOB (Name correct - Should PASS)',
    data: {
      ...correctData,
      nationalId: '280773178', // Correct ID
      dateOfBirth: '1990-01-01', // Wrong DOB
    },
    expectedResult: 'PASS', // Will pass because ID matches AND name matches
  },
  {
    name: '❌ Scenario 9: CORRECT ID + WRONG NAME + WRONG DOB (Should FAIL)',
    data: {
      fullName: 'JOHN DOE SMITH', // Wrong name
      nationalId: '280773178', // Correct ID
      dateOfBirth: '1990-01-01', // Wrong DOB
    },
    expectedResult: 'FAIL', // Should fail because ID matches but neither name nor DOB matches
  },
]

// Run all test scenarios
for (let i = 0; i < testScenarios.length; i++) {
  const scenario = testScenarios[i]
  console.log(`\n${scenario.name}`)
  console.log('-'.repeat(70))
  console.log(`Test Data:`)
  console.log(`  Full Name: ${scenario.data.fullName}`)
  console.log(`  National ID: ${scenario.data.nationalId}`)
  console.log(`  Date of Birth: ${scenario.data.dateOfBirth}`)
  console.log('')
  
  // Extract data
  const extracted = parseKenyanID(mockOcrText, scenario.data.nationalId)
  console.log('')
  console.log(`Extracted Data:`)
  console.log(`  ID Number: ${extracted.idNumber || 'NOT FOUND'}`)
  console.log(`  Full Name: ${extracted.fullName || 'NOT FOUND'}`)
  console.log(`  Date of Birth: ${extracted.dateOfBirth || 'NOT FOUND'}`)
  console.log('')
  
  // Validate
  const idMatch = extracted.idNumber === scenario.data.nationalId
  const nameMatch = extracted.fullName && (
    extracted.fullName.toUpperCase().replace(/\s+/g, ' ') === scenario.data.fullName.toUpperCase().replace(/\s+/g, ' ') ||
    scenario.data.fullName.toUpperCase().split(/\s+/).some(part => 
      extracted.fullName.toUpperCase().includes(part)
    )
  )
  const dobMatch = extracted.dateOfBirth && 
    new Date(extracted.dateOfBirth).toISOString().split('T')[0] === 
    new Date(scenario.data.dateOfBirth).toISOString().split('T')[0]
  
  console.log(`Validation Results:`)
  console.log(`  ID Number Match: ${idMatch ? '✅' : '❌'}`)
  console.log(`  Name Match: ${nameMatch ? '✅' : '❌'}`)
  console.log(`  Date of Birth Match: ${dobMatch ? '✅' : '❌'}`)
  console.log('')
  
  // Determine result based on CRITICAL ID number requirement
  let actualResult = 'PASS'
  if (!idMatch) {
    actualResult = 'FAIL'
    console.log(`  ❌ CRITICAL: ID number mismatch - test will FAIL`)
  } else if (!nameMatch && !dobMatch) {
    actualResult = 'FAIL'
    console.log(`  ❌ Name and DOB don't match - test will FAIL`)
  } else if (idMatch && (nameMatch || dobMatch)) {
    actualResult = 'PASS'
    console.log(`  ✅ ID matches AND (name or DOB matches) - test will PASS`)
  }
  
  // Compare with expected
  if (actualResult === scenario.expectedResult) {
    console.log(`\n  ✅ TEST RESULT: ${actualResult} (Expected: ${scenario.expectedResult}) - CORRECT`)
  } else {
    console.log(`\n  ❌ TEST RESULT: ${actualResult} (Expected: ${scenario.expectedResult}) - INCORRECT`)
  }
  
  if (i < testScenarios.length - 1) {
    console.log('\n' + '='.repeat(70))
  }
}

console.log('\n' + '='.repeat(70))
console.log('✅ Comprehensive Test Complete')
console.log('')
console.log('📋 Summary:')
console.log('  - ID number is CRITICAL: Wrong ID = Always FAIL')
console.log('  - Name and DOB: At least one must match if ID is correct')
console.log('  - Face similarity: Must be >= 60% for final approval')

