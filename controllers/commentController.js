const Article = require('../models/Article');
const Staff = require('../models/Staff');
const Comment = require('../models/Comment');

exports.create = (req, res, next) => {
    const comment = new Comment({
        ...req.body,
        userId: req.auth.userId,
        articleId: req.params.id 
    });
    comment.save()
        .then(() => res.status(201).json({ message: 'Commentaire créé !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAll = (req, res, next) => {
    Comment.find({status: {$eq: 'approved'}})
        .populate('userId', 'username email avatarUrl')
        .populate('articleId', 'title slug')
        .then(comments => res.status(200).json(comments))
        .catch(error => res.status(400).json({ error }));
};

exports.authorComments = async (req, res, next) => {
    try {
        // 1. Récupérer l'auteur dans Staff
        const auteur = await Staff.findOne({ userId: req.auth.userId });
        if (!auteur) {
            return res.status(404).json({ error: 'Auteur non trouvé' });
        }

        // 2. Récupérer les IDs de ses articles
        const articles = await Article.find({ authorId: auteur._id }, '_id');
        const articleIds = articles.map(a => a._id);

        if (articleIds.length === 0) {
            return res.status(200).json({ 
                comments: [], 
                message: 'Cet auteur n\'a pas encore d\'articles' 
            });
        }

        // 3. ✅ Récupérer TOUS les commentaires sur SES articles (peu importe l'utilisateur)
        const comments = await Comment.find({ 
            articleId: { $in: articleIds }  // ← Filtrer par les IDs des articles de l'auteur
        })
        .populate('userId', 'username avatarUrl') // Qui a commenté
        .populate('articleId', 'title slug')      // Quel article
        .sort({ createdAt: -1 });

        res.status(200).json({
            comments: comments,
            totalComments: comments.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.userComments = (req, res, next) => {
    Comment.find()
        .populate('userId', 'username email avatarUrl')
        .populate('articleId', 'title slug')
        .then(comments => res.status(200).json(comments))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Comment.findOne({ _id: req.params.id })
        .populate('userId', 'username email avatarUrl')
        .populate('articleId', 'title slug')
        .then(comment => res.status(200).json(comment))
        .catch(error => res.status(404).json({ error }));
};

exports.update = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        if (comment.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        // ✅ Filtrer les champs autorisés
        const allowedFields = ['content', 'status']; // Seulement ces champs
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Vérifier si au moins un champ à mettre à jour
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            updateData, // données filtrées
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Commentaire modifié', comment: updatedComment });
    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.validateComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const { status } = req.body;

        // 1. Vérifier que le commentaire existe
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }

        // 2. Vérifier les statuts autorisés
        const allowedStatus = ['pending', 'approved', 'spam'];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ error: 'Statut non valide' });
        }

        // 3. Mettre à jour le statut
        comment.status = status;
        await comment.save();

        // 4. Réponse
        res.status(200).json({
            message: 'Statut du commentaire mis à jour avec succès',
            comment: {
                id: comment._id,
                status: comment.status,
                updatedAt: comment.updatedAt
            }
        });

    } catch (error) {
        console.error('❌ Erreur validation commentaire:', error);
        res.status(500).json({
            error: 'Erreur serveur lors de la mise à jour du commentaire',
            details: error.message
        });
    }
};

exports.delete = async (req, res) => { 
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        
        if (comment.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Commentaire supprimé' });
    } catch (error) {
        console.error('Erreur détaillée:', error); 
        res.status(500).json({ error: error.message });
    }
};