const Newsletter = require('../models/Newsletter');

exports.create = (req, res, next) => {
    const newsletter = new Newsletter({ ...req.body });
    newsletter.save()
        .then(() => res.status(201).json({ message: 'Inscription newsletter réussie !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAll = (req, res, next) => {
    Newsletter.find()
        .then(newsletters => res.status(200).json(newsletters))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Newsletter.findOne({ _id: req.params.id })
        .then(newsletter => res.status(200).json(newsletter))
        .catch(error => res.status(404).json({ error }));
};

exports.delete = async (req, res) => {
    try {
        const newsletter = await Newsletter.findById(req.params.id);
        if (!newsletter) {
            return res.status(404).json({ error: 'Inscription non trouvée' });
        }

        await Newsletter.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Inscription supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};