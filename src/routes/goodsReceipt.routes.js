const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/goodsReceipt.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('goods_receipts:view'), ctrl.index);
router.post('/', authorize('goods_receipts:manage'), validate(v.createGR), ctrl.create);

router.get('/:id', authorize('goods_receipts:view'), validate(v.idParam, 'params'), ctrl.show);
router.post('/:id/reject', authorize('goods_receipts:manage'), validate(v.idParam, 'params'), ctrl.reject);

module.exports = router;
