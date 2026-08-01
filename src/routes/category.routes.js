const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/category.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('categories:view'), ctrl.index);
router.get('/all', authorize('categories:view'), ctrl.listAll);
router.post('/', authorize('categories:manage'), validate(v.category.createCategory), ctrl.create);

router.get('/:id', authorize('categories:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('categories:manage'), validate(v.idParam, 'params'), validate(v.category.updateCategory), ctrl.update);
router.delete('/:id', authorize('categories:manage'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
