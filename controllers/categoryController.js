const Category = require('../models/Category');

exports.create = (req, res, next) => {
    const category = new Category({ ...req.body });
    category.save()
        .then(() => res.status(201).json({ message: 'Catégorie créée !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAll = (req, res, next) => {
    Category.find()
        .then(categories => res.status(200).json(categories))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Category.findOne({ _id: req.params.id })
        .then(category => res.status(200).json(category))
        .catch(error => res.status(404).json({ error }));
};

exports.update = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Catégorie modifiée', category: updatedCategory });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Catégorie supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};