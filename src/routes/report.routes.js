const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const ctrl = require('../controllers/report.controller');

router.use(auth);

router.get('/dashboard', authorize('dashboard:view'), ctrl.dashboard);
router.get('/stock', authorize('reports:view'), ctrl.stockReport);
router.get('/movements', authorize('reports:view'), ctrl.movementReport);
router.get('/export/stock', authorize('reports:export'), ctrl.exportStock);
router.get('/export/movements', authorize('reports:export'), ctrl.exportMovements);

module.exports = router;
