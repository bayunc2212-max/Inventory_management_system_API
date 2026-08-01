const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const ctrl = require('../controllers/stockMovement.controller');

router.use(auth);

router.get('/', authorize('movements:view'), ctrl.index);
router.get('/by-product', authorize('movements:view'), ctrl.byProduct);

module.exports = router;
