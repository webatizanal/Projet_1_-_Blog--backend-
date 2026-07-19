const Tag = require('../models/Tag');
const Article = require('../models/Article');

// ========== CRUD ==========

// Créer un tag
exports.createTag = async (req, res) => {
    try {
        const { name } = req.body;
        
        const existingTag = await Tag.findOne({ name: name.toLowerCase() });
        if (existingTag) {
            return res.status(400).json({ 
                error: 'Ce tag existe déjà',
                tag: existingTag 
            });
        }

        const tag = new Tag({ name: name.toLowerCase() });
        await tag.save();
        
        res.status(201).json({ message: 'Tag créé avec succès', tag });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer tous les tags
exports.getAllTags = async (req, res) => {
    try {
        const { search, limit = 50 } = req.query;
        
        const query = { isActive: true };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const tags = await Tag.find(query)
            .sort({ name: 1 })
            .limit(parseInt(limit));

        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer un tag par ID
exports.getTagById = async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag non trouvé' });
        }
        res.status(200).json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Mettre à jour un tag
exports.updateTag = async (req, res) => {
    try {
        const { name, isActive } = req.body;
        
        const tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag non trouvé' });
        }

        if (name && name !== tag.name) {
            const existingTag = await Tag.findOne({ 
                name: name.toLowerCase(),
                _id: { $ne: req.params.id }
            });
            if (existingTag) {
                return res.status(400).json({ error: 'Ce nom de tag est déjà utilisé' });
            }
            tag.name = name.toLowerCase();
        }

        if (isActive !== undefined) tag.isActive = isActive;

        await tag.save();
        res.status(200).json({ message: 'Tag mis à jour avec succès', tag });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprimer un tag (désactivation uniquement)
exports.deleteTag = async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag non trouvé' });
        }

        // Désactiver au lieu de supprimer
        tag.isActive = false;
        await tag.save();

        res.status(200).json({ message: 'Tag désactivé avec succès', tag });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ========== Fonctions spéciales ==========

// Recherche de tags pour l'autocomplétion (frontend)
exports.searchTags = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Terme de recherche trop court (minimum 2 caractères)' });
        }

        const tags = await Tag.find({
            name: { $regex: `^${q}`, $options: 'i' },
            isActive: true
        })
        .sort({ name: 1 })
        .limit(10);

        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les articles associés à un tag
exports.getArticlesByTag = async (req, res) => {
    try {
        const tagName = req.params.tagName.toLowerCase();
        const { page = 1, limit = 10 } = req.query;

        const articles = await Article.find({
            tags: { $in: [tagName] },
            status: 'published'
        })
        .populate('authorId', 'username avatarUrl')
        .populate('categoryId', 'name')
        .sort({ publishedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Article.countDocuments({
            tags: { $in: [tagName] },
            status: 'published'
        });

        res.status(200).json({
            articles,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};