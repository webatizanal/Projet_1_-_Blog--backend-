const router = require('express').Router();
const auth = require('../middleware/auth');
const newsletterController = require('../controllers/newsletterController');

router.get('/', auth, newsletterController.getAll);
router.get('/:id', auth, newsletterController.getOne);
router.post('/', newsletterController.create);
router.delete('/:id', auth, newsletterController.delete);

module.exports = router;