const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/supplier.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('suppliers:view'), ctrl.index);
router.get('/all', authorize('suppliers:view'), ctrl.listAll);
router.post('/', authorize('suppliers:manage'), validate(v.supplier.createSupplier), ctrl.create);

router.get('/:id', authorize('suppliers:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('suppliers:manage'), validate(v.idParam, 'params'), validate(v.supplier.updateSupplier), ctrl.update);
router.delete('/:id', authorize('suppliers:manage'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
