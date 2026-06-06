const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Importation des routes
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const partnershipRoutes = require('./routes/partnershipRoutes');
const staffRoutes = require('./routes/staffRoutes');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://devetdemain.netlify.app'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {  
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');  // ← 🔥 OBLIGATOIRE
    
    if (req.method === 'OPTIONS') { 
        return res.sendStatus(200);
    }
    next();
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connecté à MongoDB'))
    .catch(err => console.error('❌ Erreur MongoDB :', err));

// Serveur statique
app.use('/data_files/img_articles', express.static('data_files/img_articles'));
app.use('/data_files/img_users', express.static('data_files/img_users'));
app.use('/data_files/logo_partners', express.static('data_files/logo_partners'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/staff', staffRoutes);

// Gestion des erreurs
app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

module.exports = app;