const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/updateavatar', auth, multer, userController.updateAvatar);

module.exports = router;