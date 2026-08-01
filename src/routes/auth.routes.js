const router = require('express').Router();
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { loginLimiter } = require('../middlewares/rateLimiter');
const ctrl = require('../controllers/auth.controller');
const v = require('../validators/auth.validator');

router.post('/login', loginLimiter, validate(v.login), ctrl.login);
router.post('/logout', auth, validate(v.refresh), ctrl.logout);
router.post('/refresh', validate(v.refresh), ctrl.refresh);
router.post('/forgot-password', validate(v.forgotPassword), ctrl.forgotPassword);
router.post('/reset-password', validate(v.resetPassword), ctrl.resetPassword);

router.use(auth);
router.post('/change-password', validate(v.changePassword), ctrl.changePassword);
router.get('/me', ctrl.me);
router.put('/profile', validate(v.updateProfile), ctrl.updateProfile);

module.exports = router;
