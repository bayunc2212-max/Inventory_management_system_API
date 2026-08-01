const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/stockTransfer.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('transfers:view'), ctrl.index);
router.post('/', authorize('transfers:create'), validate(v.createTransfer), ctrl.create);

router.get('/:id', authorize('transfers:view'), validate(v.idParam, 'params'), ctrl.show);
router.post('/:id/ship', authorize('transfers:approve'), validate(v.idParam, 'params'), ctrl.ship);
router.post('/:id/receive', authorize('transfers:approve'), validate(v.idParam, 'params'), ctrl.receive);
router.post('/:id/cancel', authorize('transfers:create'), validate(v.idParam, 'params'), ctrl.cancel);

module.exports = router;
