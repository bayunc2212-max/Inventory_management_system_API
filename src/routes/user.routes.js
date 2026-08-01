const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/user.controller');
const v = require('../validators/user.validator');

router.use(auth);

router.get('/', authorize('users:view'), ctrl.index);
router.post('/', authorize('users:manage'), validate(v.createUser), ctrl.create);

router.get('/:id', authorize('users:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('users:manage'), validate(v.idParam, 'params'), validate(v.updateUser), ctrl.update);
router.delete('/:id', authorize('users:manage'), validate(v.idParam, 'params'), ctrl.remove);
router.get('/:id/activities', authorize('users:view'), validate(v.idParam, 'params'), ctrl.activities);

module.exports = router;
