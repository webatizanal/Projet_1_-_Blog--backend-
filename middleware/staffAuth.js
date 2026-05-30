const Staff = require('../models/Staff');

module.exports = async (req, res, next) => {
    try {
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }
        const staffMember = await Staff.findOne({ userId: req.auth.userId, isActive: true });
        if (!staffMember) {
            return res.status(403).json({ error: 'Accès interdit : vous n’êtes pas membre du staff' });
        }
        req.staffRole = staffMember.role;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};