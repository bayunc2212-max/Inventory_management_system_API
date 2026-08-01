const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/stockIn.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('stock_ins:view'), ctrl.index);
router.post('/', authorize('stock_ins:manage'), validate(v.createStockIn), ctrl.create);

router.get('/:id', authorize('stock_ins:view'), validate(v.idParam, 'params'), ctrl.show);
router.post('/:id/cancel', authorize('stock_ins:manage'), validate(v.idParam, 'params'), ctrl.cancel);

module.exports = router;
