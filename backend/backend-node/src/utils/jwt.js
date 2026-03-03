const jwt = require('jsonwebtoken');

const ALG = 'HS256';
const ISS = process.env.JWT_ISS || 'gateway.api';
const AUD = process.env.JWT_AUD || 'web.app';
const REFRESH_SECRET = process.env.REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const Jwt = {
    signAccess(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: ALG, expiresIn: '15m', issuer: ISS, audience: AUD });
    },
    signRefresh(payload) {
        return jwt.sign(payload, REFRESH_SECRET, { algorithm: ALG, expiresIn: '7d', issuer: ISS, audience: AUD });
    },
    verifyAccess(token) {
        return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALG], issuer: ISS, audience: AUD });
    },
    verifyRefresh(token) {
        return jwt.verify(token, REFRESH_SECRET, { algorithms: [ALG], issuer: ISS, audience: AUD });
    }
};

module.exports = Jwt;
