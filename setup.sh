#!/bin/bash

# CityGrid SaaS Setup Script
echo "🏙️ Configuration de CityGrid SaaS Multi-Tenant"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ requis. Version actuelle: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Install dependencies
echo "📦 Installation des dépendances..."
npm install

# Install frontend dependencies
echo "📦 Installation des dépendances frontend..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "📦 Installation des dépendances backend..."
cd backend && npm install && cd ..

# Copy environment files
echo "⚙️ Configuration des variables d'environnement..."
if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "📄 Fichier frontend/.env.local créé"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "📄 Fichier backend/.env créé"
fi

echo ""
echo "🎉 Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurez vos variables d'environnement :"
echo "   - frontend/.env.local (clés Supabase, Stripe, etc.)"
echo "   - backend/.env (clés Supabase service role, JWT secret, etc.)"
echo ""
echo "2. Créez votre projet Supabase et exécutez les migrations :"
echo "   - Consultez sql-migrations/README.md"
echo ""
echo "3. Lancez l'application en développement :"
echo "   npm run dev"
echo ""
echo "4. Ouvrez votre navigateur :"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo "   - API Docs: http://localhost:3001/api/docs"
echo ""
echo "📚 Documentation complète : docs/"
echo "🚀 Guide de déploiement : docs/DEPLOYMENT.md"
echo ""
echo "Happy coding! 🚀"