const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/stockOut.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('stock_outs:view'), ctrl.index);
router.post('/', authorize('stock_outs:create'), validate(v.createStockOut), ctrl.create);

router.get('/:id', authorize('stock_outs:view'), validate(v.idParam, 'params'), ctrl.show);
router.post('/:id/approve', authorize('stock_outs:approve'), validate(v.idParam, 'params'), ctrl.approve);
router.post('/:id/reject', authorize('stock_outs:approve'), validate(v.idParam, 'params'), ctrl.reject);

module.exports = router;
