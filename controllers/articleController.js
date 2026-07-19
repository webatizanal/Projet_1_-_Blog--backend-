const Article = require('../models/Article');
const Comment = require('../models/Comment');
const Staff = require('../models/Staff');
const User = require('../models/User');
const Tag = require('../models/Tag');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
const { markdownToHtml } = require('../outils/markdownParser');





exports.create = async (req, res, next) => {
    try {
        const staff = await Staff.findOne({ userId: req.auth.userId });
        if (!staff) {
            return res.status(404).json({ error: 'Staff non trouvé pour cet utilisateur' });
        }

        const { 
            title, 
            excerpt, 
            content, 
            categoryId, 
            tags,
            status 
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Image de couverture requise' });
        }

        const featuredImage = `${req.protocol}://${req.get('host')}/data_files/img_articles/${req.file.filename}`;

        const slug = slugify(title, { lower: true, strict: true });

        // 6. Calculer le temps de lecture
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);

        // 7. Gérer les tags
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        const processedTags = [];

        for (const tagName of tagsArray) {
            const trimmed = tagName.trim().toLowerCase();
            if (!trimmed) continue;

            let existingTag = await Tag.findOne({ name: trimmed });
            
            if (!existingTag) {   
                existingTag = new Tag({ name: trimmed });
                await existingTag.save();
                console.log(`✅ Nouveau tag créé : ${trimmed}`);
            }
            
            processedTags.push(trimmed);
        }

        // 8. ✅ Créer l'article
        const article = new Article({
            authorId: staff._id,
            title,
            slug,
            excerpt,
            content,
            categoryId,
            tags: processedTags,
            publishedAt: new Date(),
            readingTime: readingTime,
            views: 0,
            likes: 0,
            featuredImage: featuredImage,
            status: status 
        });
        await article.save();

        // 10. Incrémenter les compteurs de tags
        for (const tagName of processedTags) {
            await Tag.findOneAndUpdate(
                { name: tagName },
                { $inc: { usageCount: 1 } },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({
            message: 'Article créé avec succès !',
            article: article
        });

    } catch (error) {
        console.error('❌ Erreur création article :', error);
        res.status(500).json({ 
            error: 'Erreur serveur lors de la création de l\'article',
            details: error.message 
        });
    }
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

        // Récuperation de l'auteur dans la table Staff via user_id
        const auteur = await Staff.findOne({ userId: req.auth.userId });
        // Récuperation de ses articles à lui
        const articles = await Article.find({ authorId: auteur._id })
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
        const staff = await Staff.findOne({ userId: req.auth.userId });
        if (!staff) {
            return res.status(404).json({ error: 'Staff non trouvé pour cet utilisateur' });
        }
        
        // 1. Récupérer l'article existant
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }

        // 2. Vérifier que l'utilisateur est l'auteur
        if (article.authorId.toString() !== staff._id && req.auth.userRole === 'admin') {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        // 3. Récupérer les données (avec ou sans image)
        const { 
            title, 
            excerpt, 
            content, 
            categoryId, 
            tags,
            status 
        } = req.body;

        // 4. Préparer les données de mise à jour
        const updateData = {
            title,
            excerpt,
            content,
            categoryId,
            status
        };

        // 5. Générer le slug si le titre a changé
        if (title && title !== article.title) {
            updateData.slug = slugify(title, { lower: true, strict: true });
        }

        // 6. Gérer les tags
        if (tags) {
            const tagsArray = Array.isArray(tags) ? tags : [tags];
            const processedTags = [];

            for (const tagName of tagsArray) {
                const trimmed = tagName.trim().toLowerCase();
                if (!trimmed) continue;

                let existingTag = await Tag.findOne({ name: trimmed });
                if (!existingTag) {
                    existingTag = new Tag({ name: trimmed });
                    await existingTag.save();
                    console.log(`✅ Nouveau tag créé : ${trimmed}`);
                }
                processedTags.push(trimmed);
            }

            updateData.tags = processedTags;
        }

        // 7. Gérer la nouvelle image
        let newImageProvided = false;
        if (req.file) {
            newImageProvided = true;
            updateData.featuredImage = `${req.protocol}://${req.get('host')}/data_files/img_articles/${req.file.filename}`;
        }

        // 8. Mettre à jour l'article
        const updatedArticle = await Article.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        // 9. Supprimer l'ancienne image si nouvelle image fournie
        if (newImageProvided && article.featuredImage) {
            const oldFilename = path.basename(article.featuredImage);
            const oldImagePath = path.join(__dirname, '../data_files/img_articles', oldFilename);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log(`🗑️ Ancienne image supprimée : ${oldImagePath}`);
            }
        }

        // 10. Mettre à jour les compteurs de tags
        if (tags) {
            // Décrémenter les anciens tags
            for (const oldTag of article.tags) {
                await Tag.findOneAndUpdate(
                    { name: oldTag },
                    { $inc: { usageCount: -1 } }
                );
            }
            // Incrémenter les nouveaux tags
            for (const newTag of updateData.tags) {
                await Tag.findOneAndUpdate(
                    { name: newTag },
                    { $inc: { usageCount: 1 } }
                );
            }
        }

        res.status(200).json({ 
            message: 'Article modifié avec succès', 
            article: updatedArticle 
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour :', error);
        
        // Supprimer la nouvelle image si erreur
        if (req.file) {
            const newImagePath = path.join(__dirname, '../data_files/img_articles', req.file.filename);
            if (fs.existsSync(newImagePath)) {
                fs.unlinkSync(newImagePath);
                console.log(`🗑️ Nouvelle image supprimée (erreur) : ${newImagePath}`);
            }
        }
        
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour',
            details: error.message 
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const staff = await Staff.findOne({ userId: req.auth.userId });
        if (!staff) {
            return res.status(404).json({ error: 'Staff non trouvé pour cet utilisateur' });
        }
        
        // 1. Récupérer l'article existant
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article non trouvé' });
        }

        // 2. Vérifier que l'utilisateur est l'auteur
        if (article.authorId.toString() !== staff._id && req.auth.userRole === 'admin') {
            return res.status(403).json({ error: 'Vous n\'êtes pas l\'auteur' });
        }

        // 3. Supprimer l'image associée
        if (article.featuredImage) {
            const filename = path.basename(article.featuredImage);
            const imagePath = path.join(__dirname, '../data_files/img_articles', filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`🗑️ Image supprimée : ${imagePath}`);
            }
        }

        // 4. Décrémenter les compteurs de tags
        for (const tagName of article.tags) {
            await Tag.findOneAndUpdate(
                { name: tagName },
                { $inc: { usageCount: -1 } }
            );
        }

        // 5. Supprimer l'article
        await Article.findByIdAndDelete(req.params.id);

        res.status(200).json({ 
            message: 'Article et image supprimés avec succès' 
        });

    } catch (error) {
        console.error('❌ Erreur suppression :', error);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression',
            details: error.message 
        });
    }
};

