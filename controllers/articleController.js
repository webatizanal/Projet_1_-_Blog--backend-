const Article = require('../models/Article');
const Comment = require('../models/Comment');
const fs = require('fs');
const path = require('path');
const { markdownToHtml } = require('../outils/markdownParser');



exports.create = (req, res, next) => {
    const articleObject = JSON.parse(req.body.article);
    const article = new Article({
        ...articleObject, 
        featuredImage: `${req.protocol}://${req.get('host')}/data_files/img_articles/${req.file.filename}`
    });
    article.save()
        .then(() => res.status(201).json({ message: 'Article enregistré !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAllPublished = (req, res, next) => {
    Article.find({ status: { $eq: 'published'} }).populate('categoryId')
        .then(articles => res.status(200).json(articles))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = async (req, res, next) => {
    try {
        const article = await Article.findOne({ _id: req.params.id })
            .populate('categoryId')
            .populate('authorId');

        
        if (!article) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }

        // Conversion via l'utilitaire
        const htmlContent = await markdownToHtml(article.content);
        article.content = htmlContent 
        
        res.status(200).json( article );
        
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.dashboardUser = async (req, res, next) => {
    try {
        if (!req.auth) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const articles = await Article.find({ userId: req.auth.userId })
            .populate('categoryId')
            .sort({ createdAt: -1 });

        res.status(200).json(articles);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.update = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }

        let articleObject;
        let newImageProvided = false;

        if (req.file) {
            newImageProvided = true;
            articleObject = {
                ...JSON.parse(req.body.article),
                featuredImage: `${req.protocol}://${req.get('host')}/data_files/img_articles/${req.file.filename}`
            };
        } else {
            articleObject = { ...req.body };
        }

        if (article.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: 'Vous n’êtes pas l’auteur' });
        }

        const updatedArticle = await Article.findByIdAndUpdate(
            req.params.id,
            { ...articleObject, _id: req.params.id },
            { new: true, runValidators: true }
        );

        if (newImageProvided && article.featuredImage) {
            const oldFilename = path.basename(article.featuredImage);
            const oldImagePath = path.join(__dirname, '../data_files/img_articles', oldFilename);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log(`Ancienne image supprimée : ${oldImagePath}`);
            }
        }

        res.status(200).json({ message: 'Article modifié', article: updatedArticle });
    } catch (error) {
        if (req.file) {
            const newImagePath = path.join(__dirname, '../data_files/img_articles', req.file.filename);
            if (fs.existsSync(newImagePath)) fs.unlinkSync(newImagePath);
        }
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }

        if (article.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        if (article.featuredImage) {
            const filename = path.basename(article.featuredImage);
            const imagePath = path.join(__dirname, '../data_files/img_articles', filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Article.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Article et image supprimés' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

