const router = require('express').Router();
const auth = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);
router.post('/', auth, categoryController.create);
router.put('/:id', auth, categoryController.update);
router.delete('/:id', auth, categoryController.delete);

module.exports = router;