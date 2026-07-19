const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');

// ========== Routes publiques ==========

// Recherche de tags pour autocomplétion
router.get('/search', tagController.searchTags);

// Récupérer tous les tags
router.get('/', tagController.getAllTags);

// Récupérer un tag par ID
router.get('/:id', tagController.getTagById);

// Récupérer les articles associés à un tag
router.get('/:tagName/articles', tagController.getArticlesByTag);

// ========== Routes protégées ==========

// Créer un tag
router.post('/', auth, tagController.createTag);

// Mettre à jour un tag
router.put('/:id', auth, tagController.updateTag);

// Supprimer un tag (désactivation)
router.delete('/:id', auth, tagController.deleteTag);

module.exports = router;