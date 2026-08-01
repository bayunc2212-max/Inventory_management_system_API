const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/purchaseOrder.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('purchase_orders:view'), ctrl.index);
router.post('/', authorize('purchase_orders:manage'), validate(v.createPO), ctrl.create);

router.get('/:id', authorize('purchase_orders:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('purchase_orders:manage'), validate(v.idParam, 'params'), validate(v.updatePO), ctrl.update);
router.post('/:id/submit', authorize('purchase_orders:manage'), validate(v.idParam, 'params'), ctrl.submit);
router.post('/:id/approve', authorize('purchase_orders:approve'), validate(v.idParam, 'params'), ctrl.approve);
router.post('/:id/reject', authorize('purchase_orders:approve'), validate(v.idParam, 'params'), ctrl.reject);
router.post('/:id/cancel', authorize('purchase_orders:manage'), validate(v.idParam, 'params'), ctrl.cancel);

module.exports = router;
