const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/branch.controller');

router.use(auth);
router.get('/all', ctrl.listAll);

module.exports = router;
