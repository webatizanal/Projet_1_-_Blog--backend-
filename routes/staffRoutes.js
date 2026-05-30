const router = require('express').Router();
const auth = require('../middleware/auth');
const staffAuth = require('../middleware/staffAuth');
const staffController = require('../controllers/staffController');

router.get('/private-files/:foldername/:filename', auth, staffAuth, staffController.getPrivateFile);

router.get('/', staffController.getAll);
router.get('/:id', staffController.getOne);
router.post('/', auth, staffController.create);
router.put('/:id', auth, staffController.update);
router.delete('/:id', auth, staffController.delete);

module.exports = router;