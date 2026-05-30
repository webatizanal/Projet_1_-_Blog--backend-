const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const partnershipController = require('../controllers/partnershipController');

router.get('/', partnershipController.getAll);
router.get('/:id', partnershipController.getOne);
router.post('/', auth, multer, partnershipController.create);
router.put('/:id', auth, multer, partnershipController.update);
router.delete('/:id', auth, partnershipController.delete);

module.exports = router;