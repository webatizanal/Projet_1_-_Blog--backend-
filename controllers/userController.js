const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Article = require('../models/Article');
const fs = require('fs');
const path = require('path');



/**
 * Récupère les statistiques globales :
 * - nombre de lecteurs (userRole = 'lecteur')
 * - nombre d'auteurs (userRole différent de 'lecteur' et différent de 'admin' selon ton besoin)
 * - nombre d'articles publiés (status = 'published')
 */
exports.getStats = async (req, res) => {
    try {
        // 1. Compter les lecteurs
        const lecteursCount = await User.countDocuments({ userRole: 'lecteur' });
        
        // 2. Compter les auteurs (tous les utilisateurs qui ne sont ni lecteurs ni admins)
        //    ou simplement tous ceux qui ont un rôle 'auteur' si tu as normalisé
        const auteursEtAdminsCount = await User.countDocuments({
            userRole: { $in: ['auteur', 'admin'] }
        });
        
        // 3. Compter les articles publiés
        const articlesPublishedCount = await Article.countDocuments({ status: 'published' });
        
        // 4. Retourner les résultats
        res.status(200).json({
            success: true,
            lecteurs: lecteursCount,
            auteurs: auteursEtAdminsCount,
            articlesPublished: articlesPublishedCount
        });
        
    } catch (error) {
        console.error('Erreur getStats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
};

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

exports.login = async (req, res, next) => {
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
                    
                    // Syntaxe ave playload dans le token
                    const token = jwt.sign(
                        {  
                            userId: user._id,
                            userRole: user.userRole
                        },
                        process.env.JWT_SECRET,       // ← secret
                        { expiresIn: '24h' }          // ← options
                    );
                    
                    res.status(200).json({
                        userId: user._id,
                        token: token,
                        userRole: user.userRole,
                        userName: user.username,
                        userMail: user.email
                    });
                })
                .catch(error => res.status(500).json({ error: error.message }));
        })
        .catch(error => res.status(500).json({ error: error.message }));
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

/**
 * @route PUT /api/users/update-password
 * @requires auth (middleware)
 */
exports.updatePwd = async (req, res, next) => {
    try {
        // 1. Vérifier que l'utilisateur est authentifié
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        // 2. Récupérer les données du corps de la requête
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // 3. Vérifier que les champs sont présents
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        // 4. Vérifier que le nouveau mot de passe et la confirmation correspondent
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
        }

        // 5. Vérifier la longueur du nouveau mot de passe
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // 6. Récupérer l'utilisateur en base
        const user = await User.findById(req.auth.userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // 7. Vérifier l'ancien mot de passe
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        // 8. Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 9. Mettre à jour en base
        user.password = hashedPassword;
        await user.save();

        // 10. Réponse succès
        res.status(200).json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        console.error('Erreur updatePwd:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.tokenCheck = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        res.status(200).json({
            valid: true,
            userId: decoded.userId,
            userRole: decoded.userRole
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            error: 'Token invalide ou expiré'
        });
    }
};

/**
 * Suppression du compte utilisateur connecté (lui-même)
 * @route DELETE /api/users/account
 * @requires auth (middleware)
 */
exports.deleteAccount = async (req, res, next) => {
    try {
        // 1. Vérifier que l'utilisateur est authentifié
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const userId = req.auth.userId;

        // 2. Récupérer l'utilisateur pour vérifier son existence
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // 3. Supprimer tous les articles écrits par cet utilisateur
        //    (optionnel selon ton besoin)
        await Article.deleteMany({ userId: userId });

        // 4. Supprimer tous les commentaires écrits par cet utilisateur
        await Comment.deleteMany({ authorId: userId });

        // 5. Si l'utilisateur fait partie du staff, le supprimer aussi
        await Staff.deleteOne({ userId: userId });

        // 6. Supprimer l'avatar physique (si stocké localement)
        if (user.avatarUrl && !user.avatarUrl.includes('ui-avatars.com')) {
            const fs = require('fs');
            const path = require('path');
            const filename = path.basename(user.avatarUrl);
            const avatarPath = path.join(__dirname, '../data_files/img_users', filename);
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }

        // 7. Supprimer l'utilisateur lui-même
        await User.findByIdAndDelete(userId);

        // 8. Réponse succès
        res.status(200).json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteAccount:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};