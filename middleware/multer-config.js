const multer = require('multer');
const path = require('path'); 

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',      
    'image/png': 'png',
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const folder = req.body.folder;
        
        switch (folder) {
            case "articles": 
                callback(null, 'data_files/img_articles');
                break;
            case 'users': 
                callback(null, 'data_files/img_users');
                break;
            case 'private': 
                callback(null, 'data_files/private_files');
                break;
            default: 
                callback(new Error('Destination non supportée: ' + destination), false);
        }
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_').split('.')[0];
        const extension = MIME_TYPES[file.mimetype];
        if (!extension) {
            callback(new Error('Type de fichier non supporté'), null);
        } else {
            callback(null, name + Date.now() + '.' + extension);
        }
    },
});

const fileFilter = (req, file, callback) => {
    if (MIME_TYPES[file.mimetype]) {
        callback(null, true);
    } else {
        callback(new Error('Format non supporté'), false);
    }
}; 

module.exports = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter,
}).single('image');              