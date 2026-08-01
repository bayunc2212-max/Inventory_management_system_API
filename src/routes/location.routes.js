const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ctrl = require('../controllers/location.controller');
const v = require('../validators/master.validator');

router.use(auth);

router.get('/', authorize('locations:view'), ctrl.index);
router.get('/all', authorize('locations:view'), ctrl.listAll);
router.post('/', authorize('locations:manage'), validate(v.location.createLocation), ctrl.create);

router.get('/:id', authorize('locations:view'), validate(v.idParam, 'params'), ctrl.show);
router.put('/:id', authorize('locations:manage'), validate(v.idParam, 'params'), validate(v.location.updateLocation), ctrl.update);
router.delete('/:id', authorize('locations:manage'), validate(v.idParam, 'params'), ctrl.remove);

module.exports = router;
