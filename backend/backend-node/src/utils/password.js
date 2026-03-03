const argon2 = require('argon2');
const pepper = process.env.PWD_PEPPER || '';

const Password = {
    async hash(plain) {
        return argon2.hash(pepper + plain, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    },
    async verify(hash, plain) {
        return argon2.verify(hash, pepper + plain);
    }
};

module.exports = Password;
