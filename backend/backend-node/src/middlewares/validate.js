const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        // Debug: Log schema type
        if (process.env.NODE_ENV !== 'production') {
            console.log('[VALIDATE] Schema type:', typeof schema, 'Has validate:', typeof schema?.validate);
        }
        
        // Handle different schema formats
        // Check Joi schema first (has validate method and is object)
        if (schema && typeof schema === 'object' && typeof schema.validate === 'function') {
            // Direct Joi schema object (not wrapped in {body, params, query})
            const target = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
            const { error, value } = schema.validate(target, {
                abortEarly: false,
                allowUnknown: true,
                stripUnknown: true
            });

            if (error) {
                const errors = error.details.map(err => ({
                    field: `${source}.${err.path.join('.')}`,
                    message: err.message
                }));
                return res.status(422).json({
                    success: false,
                    error: 'Dữ liệu không hợp lệ',
                    code: 'VALIDATION_ERROR',
                    errors
                });
            }

            // Apply validated values back to request
            if (source === 'body') req.body = value;
            else if (source === 'params') req.params = value;
            else if (source === 'query') req.query = value;
        } else if (typeof schema === 'object' && schema !== null && typeof schema.validate !== 'function') {
            // New format - object with body, params, query
            if (process.env.NODE_ENV !== 'production') {
                console.log('[VALIDATE] Using object format, has body:', !!schema.body);
            }
            const validationErrors = [];

            // Validate request body
            if (schema.body) {
                const { error, value } = schema.body.validate(req.body, {
                    abortEarly: false,
                    allowUnknown: true,
                    stripUnknown: true
                });

                if (error) {
                    validationErrors.push(...error.details.map(err => ({
                        field: `body.${err.path.join('.')}`,
                        message: err.message
                    })));
                } else {
                    // Apply validated values back to request
                    req.body = value;
                }
            }

            // Validate request params
            if (schema.params) {
                const { error } = schema.params.validate(req.params, {
                    abortEarly: false,
                    allowUnknown: false,
                    stripUnknown: true
                });

                if (error) {
                    validationErrors.push(...error.details.map(err => ({
                        field: `params.${err.path.join('.')}`,
                        message: err.message
                    })));
                }
            }

            // Validate request query
            if (schema.query) {
                const { error, value } = schema.query.validate(req.query, {
                    abortEarly: false,
                    allowUnknown: true,
                    stripUnknown: true
                });

                if (error) {
                    validationErrors.push(...error.details.map(err => ({
                        field: `query.${err.path.join('.')}`,
                        message: err.message
                    })));
                } else {
                    // Apply validated and transformed query values
                    req.query = value;
                }
            }

            if (validationErrors.length > 0) {
                console.log('Validation errors:', JSON.stringify(validationErrors, null, 2));
                return res.status(422).json({
                    success: false,
                    error: 'Dữ liệu không hợp lệ',
                    code: 'VALIDATION_ERROR',
                    errors: validationErrors
                });
            }
            
            // Apply validated values if no errors (already applied above in else block)
        } else {
            // Unknown schema format
            console.error('Unknown validation schema format:', typeof schema);
            return res.status(500).json({
                success: false,
                error: 'Lỗi cấu hình validation',
                code: 'VALIDATION_SCHEMA_ERROR'
            });
        }

        next();
    } catch (err) {
        console.error('Validation middleware error:', err);
        console.error('Error stack:', err.stack);
        // If it's a Joi validation error, format it properly
        if (err.isJoi) {
            const errors = err.details.map(e => ({
                field: `${source}.${e.path.join('.')}`,
                message: e.message
            }));
            return res.status(422).json({
                success: false,
                error: 'Dữ liệu không hợp lệ',
                code: 'VALIDATION_ERROR',
                errors
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Lỗi xác thực dữ liệu',
            code: 'VALIDATION_MIDDLEWARE_ERROR'
        });
    }
};

module.exports = validate;