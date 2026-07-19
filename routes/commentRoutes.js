const router = require('express').Router();
const auth = require('../middleware/auth');
const commentController = require('../controllers/commentController');

router.get('/', commentController.getAll);
router.get('/mes-commentaires', auth, commentController.userComments);
router.get('/commentaires-auteur', auth, commentController.authorComments);
router.get('/:id', commentController.getOne);
router.post('/:id', auth, commentController.create);
router.put('/:id', auth, commentController.update);
router.put('/validate/:id', auth, commentController.validateComment);
router.delete('/:id', auth, commentController.delete);

module.exports = router;