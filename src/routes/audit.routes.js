const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const ctrl = require('../controllers/audit.controller');

router.use(auth);

router.get('/', authorize('audit:view'), ctrl.index);
router.get('/options', authorize('audit:view'), ctrl.actions);

module.exports = router;
