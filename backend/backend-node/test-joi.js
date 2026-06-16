const Joi = require('joi');
const schema = Joi.object({
    email: Joi.string().email().optional(),
    name: Joi.string().min(2).max(50).optional(),
    roles: Joi.alternatives().try(
        Joi.string().valid('student', 'teacher', 'admin'),
        Joi.array().items(Joi.string().valid('student', 'teacher', 'admin'))
    ).optional(),
    role: Joi.string().valid('student', 'teacher', 'admin').optional()
});

const reqBody = { name: "test", email: "test@gmail.com", roles: ["teacher"], role: "teacher" };
const { error, value } = schema.validate(reqBody, { stripUnknown: true });
console.log("Error:", error);
console.log("Value:", value);
