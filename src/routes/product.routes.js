const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/product.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('products:view'), ctrl.index);
router.get('/all', authorize('products:view'), ctrl.listAll);
router.get('/summary', authorize('products:view'), ctrl.summary);
router.post('/', authorize('products:create'), validate(v.product.createProduct), ctrl.create);

router.get('/:id', authorize('products:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('products:update'), validate(v.idParam, 'params'), validate(v.product.updateProduct), ctrl.update);
router.delete('/:id', authorize('products:delete'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
