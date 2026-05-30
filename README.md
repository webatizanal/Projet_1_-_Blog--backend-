# 📝 Mon Blog – Plateforme d’articles

Blog full-stack permettant de créer, modifier, supprimer et commenter des articles. Projet personnel pour maîtriser le développement web de bout en bout.

## 🚀 Fonctionnalités

- Création / modification / suppression d’articles
- Système de commentaires avec validation basique
- Interface responsive (HTML/TailwindCSS/JS vanilla)
- Backend REST avec Node.js + Express
- Base de données MongoDB (Mongoose)
- Recherche d’articles par titre / catégorie

## 🛠️ Stack technique

| Couche          | Technologie                           |
|-----------------|---------------------------------------|
| Frontend        | HTML5, TailwindCSS, JavaScript (ES6+) |
| Backend         | Node.js, Express.js                   |
| Base de données | MongoDB (Mongoose ODM)                |
| Outils          | Git, GitHub, Postman (tests API)      |

## Schema des modèles
1)  const userSchema = mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        username: { type: String, required: true },
        avatarUrl: { type: String },
        createdAt: { type: Date, default: Date.now }
    })

2)  const articlesSchema = mongoose.Schema({
        authorAvatar: { type: String, required: false },
        author: { type: String, required: true },
        title: { type: String, required: true, maxlength: 200 },
        slug: { type: String, required: false, unique: true },
        excerpt: { type: String, required: true },
        content: { type: String, required: true },
        categoryId: { // Sorte de clé étrangère
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category',  // ← Le nom du modèle lié
            required: true 
        },
        tags: { type: Array, required: false }, 
        publishedAt: { type: Date, required: true },
        readingTime: { type: Number },
        views: { type: Number },
        likes: { type: Number },
        featuredImage: { type: String, required: true },
        status: {
            type: String,
            enum: ['published', 'draft', 'disabled'],
            default: 'draft'
        }
    })

3)  const categorySchema = mongoose.Schem({
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        attached_article: { type: Number }
    })

4)  const commentSchema = new mongoose.Schema({
        content: { type: String, required: true },
        articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'pending' }
    });

5)  const newsletterSchema = new mongoose.Schema({
        email: { 
            type: String, 
            required: true, 
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Email invalide']
        },
        subscribedAt: { type: Date, default: Date.now },
        unsubscribeAt: { type: Date, default: null },
        ipAddress: { type: String }
    });

6)  const partnershipSchema = new mongoose.Schema({
        name: { type: String, required: true, unique: true },
        website: { type: String, required: true },
        logoUrl: { type: String },
        description: { type: String, maxlength: 300 },
        type: { 
            type: String, 
            enum: ['sponsor', 'affiliate', 'friend', 'media'], 
            default: 'friend' 
        },
        contactEmail: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        startsAt: { type: Date, default: Date.now },
        endsAt: { type: Date },
        createdAt: { type: Date, default: Date.now }
    }); 

7)  const staffSchema = new mongoose.Schema({
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true,
            unique: true 
        },
        role: { 
            type: String, 
            enum: ['editor', 'moderator', 'contributor'], 
            default: 'contributor' 
        },
        bio: { type: String, maxlength: 500 },
        socialLinks: {
            twitter: { type: String },
            github: { type: String },
            linkedin: { type: String }
        },
        isActive: { type: Boolean, default: true },
        joinedAt: { type: Date, default: Date.now }
    });


## 📦 Installation Backend

```bash
# Tirer le max de ce projet
git clone ...
cd backend

# Installer les dépendances backend
npm install

# Variables d’environnement – créer un fichier .env
PORT=3000
#Configurer MongoDB localement pour mieux vous en tirer.
MONGODB_URI=mongodb://localhost:27017/monBlog 
JWT_SECRET=superSecretKey

# Lancer le serveur (mode dev = nodemon server)
npm run dev

