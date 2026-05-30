const Partnership = require('../models/Partnership');
const fs = require('fs');
const path = require('path');

exports.create = (req, res, next) => {
    const partnershipObject = JSON.parse(req.body.partnership);
    const partnership = new Partnership({
        ...partnershipObject,
        logoUrl: `${req.protocol}://${req.get('host')}/data_files/logo_partners/${req.file.filename}`
    });
    partnership.save()
        .then(() => res.status(201).json({ message: 'Partnership créé !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAll = (req, res, next) => {
    Partnership.find()
        .then(partnerships => res.status(200).json(partnerships))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Partnership.findOne({ _id: req.params.id })
        .then(partnership => res.status(200).json(partnership))
        .catch(error => res.status(404).json({ error }));
};

exports.update = async (req, res) => {
    try {
        const partnership = await Partnership.findById(req.params.id);
        if (!partnership) {
            return res.status(404).json({ error: 'Partnership non trouvé' });
        }

        let partnershipObject;
        let newImageProvided = false;

        if (req.file) {
            newImageProvided = true;
            partnershipObject = {
                ...JSON.parse(req.body.partnership),
                logoUrl: `${req.protocol}://${req.get('host')}/data_files/logo_partners/${req.file.filename}`
            };
        } else {
            partnershipObject = { ...req.body };
        }

        const updatedPartnership = await Partnership.findByIdAndUpdate(
            req.params.id,
            { ...partnershipObject, _id: req.params.id },
            { new: true, runValidators: true }
        );

        if (newImageProvided && partnership.logoUrl) {
            const oldFilename = path.basename(partnership.logoUrl);
            const oldImagePath = path.join(__dirname, '../data_files/logo_partners', oldFilename);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log(`Ancien logo supprimé : ${oldImagePath}`);
            }
        }

        res.status(200).json({ message: 'Partnership modifié', partnership: updatedPartnership });
    } catch (error) {
        if (req.file) {
            const newImagePath = path.join(__dirname, '../data_files/logo_partners', req.file.filename);
            if (fs.existsSync(newImagePath)) fs.unlinkSync(newImagePath);
        }
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const partnership = await Partnership.findById(req.params.id);
        if (!partnership) {
            return res.status(404).json({ error: 'Partnership non trouvé' });
        }

        if (partnership.logoUrl) {
            const filename = path.basename(partnership.logoUrl);
            const imagePath = path.join(__dirname, '../data_files/logo_partners', filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Partnership.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Partnership supprimé' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};