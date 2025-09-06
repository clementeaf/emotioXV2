# 🧪 COORDINATE FIDELITY TESTING GUIDE

## Overview
This guide explains how to use the coordinate fidelity testing system to verify 100% precision between NavigationFlowTask (public-tests) and NavigationFlowResults (frontend).

## Test Components

### 1. Public-Tests Testing (`coordinate-fidelity-test.ts`)
- **Location**: `public-tests/src/utils/coordinate-fidelity-test.ts`
- **Purpose**: Records original click events and processed coordinates
- **Integration**: Automatically injected into NavigationFlowTask component
- **Access**: `window.coordinateFidelityTester`

### 2. Frontend Testing (`coordinate-fidelity-test.ts`)
- **Location**: `frontend/src/utils/coordinate-fidelity-test.ts`
- **Purpose**: Validates rendered coordinates match original data
- **Integration**: Automatically injected into NavigationFlowResults component  
- **Access**: `window.frontendCoordinateFidelityTester`

## How to Perform Tests

### Step 1: Test in Public-Tests
1. Open public-tests in browser (`https://emotioxv2-public-tests-dev.s3.amazonaws.com/`)
2. Navigate to a NavigationFlow task
3. Perform clicks on images
4. Open browser console and check logs for fidelity test results
5. Use `window.coordinateFidelityTester.generateFidelityReport()` for summary

### Step 2: Test in Frontend
1. Open frontend dashboard (`https://emotioxv2-frontend-dev.s3.amazonaws.com/`)
2. Navigate to research results → NavigationFlow visualization
3. Use the "🧪 Fidelity Test Control Panel" buttons:
   - **Generate Report**: Shows accuracy statistics
   - **Export Results**: Downloads JSON with detailed results
   - **Clear Tests**: Resets test data
   - **Manual Validate**: Forces validation of current view

### Step 3: Compare Results
1. Export results from both public-tests and frontend
2. Use the comparison function:
   ```javascript
   window.frontendCoordinateFidelityTester.compareWithPublicTests(publicTestResults)
   ```

## Expected Results

### ✅ Success Criteria
- **Pixel Difference**: ≤ 2 pixels tolerance
- **Accuracy Percentage**: ≥ 95% of clicks within tolerance  
- **Consistency**: Frontend renders match original coordinates exactly

### ❌ Failure Indicators
- Large pixel differences (>10px) suggest coordinate scaling issues
- Low accuracy percentage indicates systematic problems
- Console errors during test execution

## Test Data Structure

### Public-Tests Result Format
```json
{
  "testId": "nav-flow-question-img-0-timestamp",
  "originalClick": {
    "x": 150,
    "y": 200,
    "imageNaturalSize": { "width": 1920, "height": 1080 },
    "imageRenderSize": { "width": 800, "height": 450 }
  },
  "processedClick": {
    "x": 150,
    "y": 200,
    "isCorrect": true,
    "imageIndex": 0
  },
  "accuracy": {
    "pixelDifference": 0.5,
    "percentageDifference": 0.1,
    "isAccurate": true
  }
}
```

### Frontend Result Format
```json
{
  "testId": "frontend-validation-researchId-img-0-timestamp",
  "originalData": {
    "x": 150,
    "y": 200,
    "imageIndex": 0,
    "isCorrect": true
  },
  "renderedData": {
    "x": 149.5,
    "y": 200.2,
    "renderedPosition": { "left": 143.5, "top": 194.2 },
    "imageContainer": { /* DOMRect */ }
  },
  "accuracy": {
    "pixelDifference": 0.7,
    "percentageDifference": 0.15,
    "isAccurate": true
  }
}
```

## Debugging Common Issues

### Issue: Large Pixel Differences
**Cause**: Image scaling or coordinate transformation problems
**Solution**: Check imageNaturalSize vs imageRenderSize calculations

### Issue: No Test Results
**Cause**: Test utilities not injected or clicks not recorded
**Solution**: Verify console shows injection messages and click events

### Issue: Frontend Validation Fails
**Cause**: DOM elements not found or data attributes missing
**Solution**: Verify `data-testid` attributes are present on click points

## Console Commands for Advanced Testing

```javascript
// Public-Tests Commands
window.coordinateFidelityTester.generateFidelityReport()
window.coordinateFidelityTester.exportResults()
window.coordinateFidelityTester.getTestResults()

// Frontend Commands  
window.frontendCoordinateFidelityTester.generateFrontendFidelityReport()
window.frontendCoordinateFidelityTester.exportResults()
window.frontendCoordinateFidelityTester.compareWithPublicTests(publicResults)

// Cross-Platform Comparison
const publicResults = window.coordinateFidelityTester.getTestResults()
const frontendResults = window.frontendCoordinateFidelityTester.getTestResults()
// Compare results manually or use built-in comparison function
```

## Automated Test Script

For comprehensive testing, run this script in browser console:

```javascript
// Comprehensive Fidelity Test Script
async function runComprehensiveFidelityTest() {
  console.log('🧪 Starting Comprehensive Fidelity Test...');
  
  // Step 1: Clear previous tests
  if (window.coordinateFidelityTester) {
    window.coordinateFidelityTester.clearResults();
  }
  if (window.frontendCoordinateFidelityTester) {
    window.frontendCoordinateFidelityTester.clearResults();
  }
  
  // Step 2: Generate test report
  const report = window.frontendCoordinateFidelityTester?.generateFrontendFidelityReport() || 
                 window.coordinateFidelityTester?.generateFidelityReport();
  
  console.log('📊 Final Test Report:', report);
  
  // Step 3: Export results
  if (report) {
    const results = window.frontendCoordinateFidelityTester?.exportResults() || 
                   window.coordinateFidelityTester?.exportResults();
    console.log('✅ Test completed. Results exported.');
    return report;
  }
  
  console.log('❌ No test utilities available');
  return null;
}

// Run the test
runComprehensiveFidelityTest();
```

## Validation Checklist

- [ ] Public-tests fidelity tester injected successfully
- [ ] Frontend fidelity tester injected successfully  
- [ ] Click recording works in NavigationFlowTask
- [ ] Click rendering works in NavigationFlowResults
- [ ] Pixel differences are within tolerance (≤2px)
- [ ] Accuracy percentage is high (≥95%)
- [ ] Export/import functions work correctly
- [ ] Cross-platform comparison shows consistency

## Report Interpretation

### Accuracy Levels
- **🟢 Excellent**: 98-100% accuracy, <1px average difference
- **🟡 Good**: 95-97% accuracy, 1-2px average difference  
- **🔴 Poor**: <95% accuracy, >2px average difference

### Action Items Based on Results
- **Poor accuracy**: Review coordinate transformation logic
- **Scaling issues**: Check image sizing and aspect ratio handling
- **Systematic errors**: Verify DOM positioning and CSS transforms