const validate = require('./src/middlewares/validate');
const userValidation = require('./src/validations/user.validation');

const req = {
    params: { userId: '6a05b4d5a25b79c4d2198d5b' },
    body: { name: 'giathune', role: 'teacher', roles: ['teacher'], status: 'active', email: 'giathu@gmail.com' },
    query: {}
};

const res = {
    status: (code) => ({ json: (data) => console.log('Response:', code, data) })
};

const next = () => {
    console.log('Next called');
    console.log('req.body after validate:', req.body);
};

// Simulate first middleware: validate(..., 'params')
console.log('--- First middleware ---');
validate(userValidation.updateUser, 'params')(req, res, () => {
    console.log('Next called 1. req.body:', req.body);
    
    // Simulate second middleware: validate(..., 'body')
    console.log('--- Second middleware ---');
    validate(userValidation.updateUser, 'body')(req, res, () => {
        console.log('Next called 2. req.body:', req.body);
    });
});
