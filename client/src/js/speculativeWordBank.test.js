// Simple test file for speculative word bank functionality
import { checkSpeculativeLanguage, checkRusheeName, validateComment, generateWarnings } from './speculativeWordBank.js';

// Test speculative language detection
console.log('Testing speculative language detection...');
const testComment1 = "This rushee will probably be a good fit for the organization.";
const result1 = checkSpeculativeLanguage(testComment1);
console.log('Test 1:', result1);
console.log('Expected: hasSpeculativeLanguage: true, flaggedWords: ["will", "probably", "good fit"]');
console.log('Actual:', result1);
console.log('---');

// Test rushee name detection
console.log('Testing rushee name detection...');
const testComment2 = "John Smith seems like a great candidate.";
const result2 = checkRusheeName(testComment2, "John", "Smith");
console.log('Test 2:', result2);
console.log('Expected: hasRusheeName: true, foundNames: ["John", "Smith"]');
console.log('Actual:', result2);
console.log('---');

// Test combined validation
console.log('Testing combined validation...');
const testComment3 = "John will probably be successful in the future.";
const result3 = validateComment(testComment3, "John", "Smith");
console.log('Test 3:', result3);
console.log('Expected: hasWarnings: true');
console.log('Actual:', result3);
console.log('---');

// Test warning generation
console.log('Testing warning generation...');
const warnings = generateWarnings(result3);
console.log('Warnings:', warnings);
console.log('---');

console.log('All tests completed!'); 