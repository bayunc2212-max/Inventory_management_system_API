const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/warehouse.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('warehouses:view'), ctrl.index);
router.get('/all', authorize('warehouses:view'), ctrl.listAll);
router.post('/', authorize('warehouses:manage'), validate(v.warehouse.createWarehouse), ctrl.create);

router.get('/:id', authorize('warehouses:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('warehouses:manage'), validate(v.idParam, 'params'), validate(v.warehouse.updateWarehouse), ctrl.update);
router.delete('/:id', authorize('warehouses:manage'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
