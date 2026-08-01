const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/customer.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('customers:view'), ctrl.index);
router.get('/all', authorize('customers:view'), ctrl.listAll);
router.post('/', authorize('customers:manage'), validate(v.customer.createCustomer), ctrl.create);

router.get('/:id', authorize('customers:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('customers:manage'), validate(v.idParam, 'params'), validate(v.customer.updateCustomer), ctrl.update);
router.delete('/:id', authorize('customers:manage'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
