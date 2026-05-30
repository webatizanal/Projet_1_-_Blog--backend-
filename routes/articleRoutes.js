const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const articleController = require('../controllers/articleController');

router.get('/', articleController.getAll);
router.get('/:id', articleController.getOne);
router.post('/', auth, multer, articleController.create);
router.put('/:id', auth, multer, articleController.update);
router.delete('/:id', auth, articleController.delete);

module.exports = router;