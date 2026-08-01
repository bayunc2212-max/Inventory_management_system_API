const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/stockAdjustment.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('adjustments:view'), ctrl.index);
router.post('/', authorize('adjustments:create'), validate(v.createAdjustment), ctrl.create);

router.get('/:id', authorize('adjustments:view'), validate(v.idParam, 'params'), ctrl.show);
router.post('/:id/approve', authorize('adjustments:approve'), validate(v.idParam, 'params'), ctrl.approve);
router.post('/:id/reject', authorize('adjustments:approve'), validate(v.idParam, 'params'), ctrl.reject);

module.exports = router;
