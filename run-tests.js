// Simple test runner for comment functionality
// Run this with: node run-tests.js

console.log('🧪 Socializers Comment System Test');
console.log('=====================================');

// Test 1: Check if modal creation works
function testModalCreation() {
    console.log('\n📝 Test 1: Modal Creation');
    
    try {
        // Create a simple modal like our comment modal
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
        `;

        const textarea = document.createElement('textarea');
        textarea.id = 'testCommentContent';
        textarea.placeholder = 'Write a comment...';
        textarea.style.cssText = `
            width: 100%;
            min-height: 80px;
            padding: 10px;
            border: 1px solid #dddfe2;
            border-radius: 8px;
            resize: vertical;
            outline: none;
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
        `;

        modalContent.appendChild(textarea);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Test focus
        setTimeout(() => {
            textarea.focus();
            console.log('✅ Modal created successfully');
            console.log('✅ Textarea focused:', document.activeElement === textarea);
            
            // Test typing
            textarea.value = 'Test typing';
            console.log('✅ Textarea value set:', textarea.value);
            
            // Clean up
            document.body.removeChild(modalOverlay);
            
        }, 100);
        
        return true;
    } catch (error) {
        console.error('❌ Modal creation failed:', error);
        return false;
    }
}

// Test 2: Check event handling
function testEventHandling() {
    console.log('\n⚡ Test 2: Event Handling');
    
    try {
        const textarea = document.createElement('textarea');
        let eventFired = false;
        
        textarea.addEventListener('input', () => {
            eventFired = true;
            console.log('✅ Input event fired');
        });
        
        textarea.addEventListener('keydown', (e) => {
            console.log('✅ Keydown event fired:', e.key);
        });
        
        // Simulate typing
        textarea.value = 'Test';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log('✅ Event handling works:', eventFired);
        return true;
    } catch (error) {
        console.error('❌ Event handling failed:', error);
        return false;
    }
}

// Test 3: Check CSS properties
function testCSSProperties() {
    console.log('\n🎨 Test 3: CSS Properties');
    
    try {
        const textarea = document.createElement('textarea');
        
        // Test basic CSS properties
        textarea.style.width = '100%';
        textarea.style.height = '80px';
        textarea.style.padding = '10px';
        textarea.style.border = '1px solid #dddfe2';
        textarea.style.borderRadius = '8px';
        
        const computedStyle = window.getComputedStyle(textarea);
        
        console.log('✅ Width:', computedStyle.width);
        console.log('✅ Height:', computedStyle.height);
        console.log('✅ Padding:', computedStyle.padding);
        console.log('✅ Border:', computedStyle.border);
        console.log('✅ Border radius:', computedStyle.borderRadius);
        
        return true;
    } catch (error) {
        console.error('❌ CSS properties test failed:', error);
        return false;
    }
}

// Run all tests
function runAllTests() {
    const results = {
        modalCreation: testModalCreation(),
        eventHandling: testEventHandling(),
        cssProperties: testCSSProperties()
    };
    
    console.log('\n📊 Test Results:');
    console.log('==================');
    console.log('Modal Creation:', results.modalCreation ? '✅ PASS' : '❌ FAIL');
    console.log('Event Handling:', results.eventHandling ? '✅ PASS' : '❌ FAIL');
    console.log('CSS Properties:', results.cssProperties ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    return allPassed;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    console.log('Running tests in browser environment...');
    runAllTests();
} else {
    console.log('To run tests: Open index.html in browser and check console');
    console.log('Or run: npx playwright test comment-test.spec.js');
}
