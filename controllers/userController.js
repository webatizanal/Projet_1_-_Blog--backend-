const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Comment = require('../models/Comment');
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
                        userMail: user.email,
                        userAvatar: user.avatarUrl
                    });
                })
                .catch(error => res.status(500).json({ error: error.message }));
        })
        .catch(error => res.status(500).json({ error: error.message }));
};  

exports.updateAvatar = async (req, res, next) => {
    console.log('=== DÉBUT updateAvatar ===');
    
    try {
        // 1. Vérification de l'utilisateur
        const user = await User.findById(req.auth.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image fournie' });
        }

        // 3. Construction de l'URL
        const imageUrl = `${req.protocol}://${req.get('host')}/data_files/img_users/${req.file.filename}`;

        // 4. Sauvegarde de l'ancien chemin
        const lastImage = user.avatarUrl.split('/img_users/')[1] || null;
        const oldImagePath = path.join(__dirname, '../data_files/img_users', lastImage);

        // 5. Mise à jour de l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            req.auth.userId,
            { avatarUrl: imageUrl },
            { returnDocument: 'after' }
        );
    
        // 6. Suppression de l'ancienne image
        if (oldImagePath) {
            console.log('🔍 Vérification existence:', oldImagePath);
            if (fs.existsSync(oldImagePath)) {
                try {
                    fs.unlinkSync(oldImagePath);
                    console.log('🗑️ Ancien avatar supprimé avec succès');
                } catch (err) {
                    console.log('⚠️ Erreur lors de la suppression:', err.message);
                }
            } else {
                console.log('⚠️ Fichier ancien introuvable:', oldImagePath);
            }
        } else {
            console.log('ℹ️ Aucun ancien avatar à supprimer');
        }

        res.status(200).json({ 
            message: 'Avatar mis à jour avec succès', 
            user: updatedUser 
        });

    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'avatar' });
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
exports.deleteAccount = async (req, res) => {
    try {
        // 1. Vérifier l'authentification
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const userId = req.auth.userId;

        // 2. Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // 3. Supprimer les données associées (sans bloquer si rien n'existe)
        await Article.deleteMany({ userId: userId }).catch(() => {});
        await Comment.deleteMany({ authorId: userId }).catch(() => {});
        await Staff.deleteOne({ userId: userId }).catch(() => {});

        // 4. Supprimer l'avatar physique (seulement s'il existe et n'est pas une URL externe)
        if (user.avatarUrl && 
            !user.avatarUrl.includes('ui-avatars.com') && 
            !user.avatarUrl.startsWith('http')) {
            
            try {
                const filename = path.basename(user.avatarUrl);
                const avatarPath = path.join(__dirname, '..', 'data_files', 'img_users', filename);
                
                if (fs.existsSync(avatarPath)) {
                    fs.unlinkSync(avatarPath);
                }
            } catch (err) {
                console.error('Erreur lors de la suppression de l\'avatar:', err.message);
                // On ne bloque pas la suppression du compte pour autant
            }
        }

        // 5. Supprimer l'utilisateur
        await User.findByIdAndDelete(userId);

        // 6. Réponse succès
        res.status(200).json({ message: 'Compte supprimé avec succès' });
        
    } catch (error) {
        console.error('Erreur deleteAccount:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
};