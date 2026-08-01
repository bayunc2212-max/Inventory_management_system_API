const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/brand.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('brands:view'), ctrl.index);
router.get('/all', authorize('brands:view'), ctrl.listAll);
router.post('/', authorize('brands:manage'), validate(v.brand.createBrand), ctrl.create);

router.get('/:id', authorize('brands:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('brands:manage'), validate(v.idParam, 'params'), validate(v.brand.updateBrand), ctrl.update);
router.delete('/:id', authorize('brands:manage'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
