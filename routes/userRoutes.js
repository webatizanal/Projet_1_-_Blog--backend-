const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

router.get('/stats', userController.getStats);
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.put('/update-pwd', auth, userController.updatePwd);
router.get('/token', auth, userController.tokenCheck);
router.put('/updateavatar', auth, multer , userController.updateAvatar);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router; 