const router = require('express').Router();
const auth = require('../middleware/auth');
const commentController = require('../controllers/commentController');

router.get('/', commentController.getAll);
router.get('/:id', commentController.getOne);
router.post('/', auth, commentController.create);
router.put('/:id', auth, commentController.update);
router.delete('/:id', auth, commentController.delete);

module.exports = router;