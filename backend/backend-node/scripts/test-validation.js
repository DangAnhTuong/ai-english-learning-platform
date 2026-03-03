/**
 * Test validation middleware
 */

const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Mật khẩu là bắt buộc'
        })
});

console.log('Schema type:', typeof loginSchema);
console.log('Has validate:', typeof loginSchema.validate === 'function');
console.log('isJoi:', loginSchema.isJoi);

// Test validation
const test1 = loginSchema.validate({ email: 'test@example.com', password: '123456' });
console.log('\nTest 1 (valid):', test1.error ? 'FAILED' : 'PASSED');

const test2 = loginSchema.validate({ email: 'invalid-email', password: '123456' });
console.log('Test 2 (invalid email):', test2.error ? 'PASSED (has error)' : 'FAILED');
console.log('   Error:', test2.error?.details[0]?.message);

const test3 = loginSchema.validate({ password: '123456' });
console.log('Test 3 (missing email):', test3.error ? 'PASSED (has error)' : 'FAILED');
console.log('   Error:', test3.error?.details[0]?.message);
