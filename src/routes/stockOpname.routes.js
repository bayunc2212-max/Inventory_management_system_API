const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/stockOpname.controller');
const v = require('../validators/transaction.validator');

router.use(auth);

router.get('/', authorize('opnames:view'), ctrl.index);
router.post('/', authorize('opnames:create'), validate(v.createOpname), ctrl.create);

router.get('/:id', authorize('opnames:view'), validate(v.idParam, 'params'), ctrl.show);
router.post('/:id/items', authorize('opnames:create'), validate(v.idParam, 'params'), validate(v.opnameItemBody), ctrl.addItem);
router.put('/:id/items/:itemId', authorize('opnames:create'), validate(v.itemParam, 'params'), validate(v.opnameItemUpdate), ctrl.updateItem);
router.post('/:id/submit', authorize('opnames:create'), validate(v.idParam, 'params'), ctrl.submit);
router.post('/:id/approve', authorize('opnames:approve'), validate(v.idParam, 'params'), ctrl.approve);
router.post('/:id/reject', authorize('opnames:approve'), validate(v.idParam, 'params'), ctrl.reject);

module.exports = router;
