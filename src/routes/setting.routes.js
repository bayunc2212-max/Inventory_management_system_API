const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const ctrl = require('../controllers/setting.controller');

router.get('/public', ctrl.publicSettings);

router.use(auth);

router.get('/', authorize('settings:view'), ctrl.index);
router.get('/meta', authorize('settings:view'), ctrl.meta);
router.put('/', authorize('settings:manage'), ctrl.update);

module.exports = router;
