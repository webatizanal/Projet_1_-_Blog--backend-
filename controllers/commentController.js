const Comment = require('../models/Comment');

exports.create = (req, res, next) => {
    const comment = new Comment({
        ...req.body,
        authorId: req.auth.userId
    });
    comment.save()
        .then(() => res.status(201).json({ message: 'Commentaire créé !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAll = (req, res, next) => {
    Comment.find().populate('articleId').populate('authorId', 'username')
        .then(comments => res.status(200).json(comments))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Comment.findOne({ _id: req.params.id })
        .then(comment => res.status(200).json(comment))
        .catch(error => res.status(404).json({ error }));
};

exports.update = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        if (comment.authorId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Commentaire modifié', comment: updatedComment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        if (comment.authorId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Commentaire supprimé' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};