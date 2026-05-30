const Staff = require('../models/Staff');

exports.create = (req, res, next) => {
    const staff = new Staff({ ...req.body });
    staff.save()
        .then(() => res.status(201).json({ message: 'Staff créé !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAll = (req, res, next) => {
    Staff.find().populate('userId', 'username email avatarUrl')
        .then(staff => res.status(200).json(staff))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Staff.findOne({ _id: req.params.id }).populate('userId', 'username email avatarUrl')
        .then(staff => res.status(200).json(staff))
        .catch(error => res.status(404).json({ error }));
};

exports.update = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff non trouvé' });
        }

        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Staff modifié', staff: updatedStaff });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff non trouvé' });
        }

        await Staff.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Staff supprimé' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Route pour fichiers privés
exports.getPrivateFile = (req, res) => {
    const { foldername, filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../data_files', foldername, safeFilename);

    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'Fichier non trouvé' });
    }
};