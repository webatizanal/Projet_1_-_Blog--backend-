const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash,
                username: req.body.username
            });
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.JWT_SECRET,
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.updateAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.auth.userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        let oldImagePath = null;
        if (user.avatarUrl && !user.avatarUrl.includes('default-avatar.png')) {
            const oldFilename = path.basename(user.avatarUrl);
            oldImagePath = path.join(__dirname, '../data_files/img_users', oldFilename);
        }

        const newAvatarUrl = `${req.protocol}://${req.get('host')}/data_files/img_users/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            req.auth.userId,
            { avatarUrl: newAvatarUrl },
            { new: true, runValidators: true }
        );

        if (oldImagePath && fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log(`Ancien avatar supprimé : ${oldImagePath}`);
        }

        res.status(200).json({ message: 'Avatar mis à jour', user: updatedUser });
    } catch (error) {
        if (req.file) {
            const newImagePath = path.join(__dirname, '../data_files/img_users', req.file.filename);
            if (fs.existsSync(newImagePath)) fs.unlinkSync(newImagePath);
        }
        res.status(500).json({ error: error.message });
    }
};