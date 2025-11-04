#!/bin/bash

# ===============================================
# 🚀 SCRIPT DE DÉPLOIEMENT AUTOMATIQUE
# ===============================================
# GestiHotel - Corrections Sécurité v2.0.0
# Déploie automatiquement les nouvelles règles de sécurité

set -e  # Arrêter en cas d'erreur

# ===============================================
# 🎨 COULEURS
# ===============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===============================================
# 📋 FONCTIONS UTILITAIRES
# ===============================================

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
}

# ===============================================
# 🔍 VÉRIFICATIONS PRÉALABLES
# ===============================================

check_prerequisites() {
    print_header "Vérification des prérequis"
    
    # Vérifier Firebase CLI
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI n'est pas installé"
        print_info "Installation: npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI installé"
    
    # Vérifier connexion Firebase
    if ! firebase projects:list &> /dev/null; then
        print_error "Vous n'êtes pas connecté à Firebase"
        print_info "Exécutez: firebase login"
        exit 1
    fi
    print_success "Connecté à Firebase"
    
    # Vérifier projet actuel
    PROJECT=$(firebase use 2>&1 | grep "Active Project:" | cut -d' ' -f3)
    if [ -z "$PROJECT" ]; then
        print_error "Aucun projet Firebase sélectionné"
        print_info "Exécutez: firebase use [PROJECT_ID]"
        exit 1
    fi
    print_success "Projet actif: $PROJECT"
    
    # Vérifier que les nouveaux fichiers existent
    if [ ! -f "firebase-messaging-sw.js" ] || [ ! -f "firestore.rules" ] || [ ! -f "storage.rules" ]; then
        print_error "Fichiers de correction manquants"
        print_info "Assurez-vous d'avoir copié les fichiers depuis /outputs/"
        exit 1
    fi
    print_success "Fichiers de correction présents"
}

# ===============================================
# 💾 BACKUP
# ===============================================

create_backup() {
    print_header "Création du backup"
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup Service Worker
    if [ -f "public/firebase-messaging-sw.js" ]; then
        cp public/firebase-messaging-sw.js "$BACKUP_DIR/"
        print_success "Service Worker sauvegardé"
    fi
    
    # Backup Firestore Rules
    if [ -f "firestore.rules" ]; then
        cp firestore.rules "$BACKUP_DIR/"
        print_success "Firestore Rules sauvegardées"
    fi
    
    # Backup Storage Rules
    if [ -f "storage.rules" ]; then
        cp storage.rules "$BACKUP_DIR/"
        print_success "Storage Rules sauvegardées"
    fi
    
    print_success "Backup créé dans: $BACKUP_DIR"
}

# ===============================================
# 📝 COPIE DES FICHIERS
# ===============================================

copy_files() {
    print_header "Copie des nouveaux fichiers"
    
    # Créer le dossier public si inexistant
    mkdir -p public
    
    # Copier Service Worker
    cp firebase-messaging-sw.js public/
    print_success "Service Worker copié"
    
    # Copier Firestore Rules
    cp firestore.rules .
    print_success "Firestore Rules copiées"
    
    # Copier Storage Rules
    cp storage.rules .
    print_success "Storage Rules copiées"
}

# ===============================================
# 🧪 TESTS LOCAUX (optionnel)
# ===============================================

run_local_tests() {
    print_header "Tests locaux (optionnel)"
    
    read -p "Voulez-vous tester localement avec les émulateurs ? (o/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        print_info "Démarrage des émulateurs Firebase..."
        
        # Démarrer émulateurs en arrière-plan
        firebase emulators:start --only firestore,storage &
        EMULATOR_PID=$!
        
        print_info "Émulateurs démarrés (PID: $EMULATOR_PID)"
        print_info "Interface: http://localhost:4000"
        print_warning "Testez vos règles puis appuyez sur Entrée pour continuer..."
        read
        
        # Arrêter émulateurs
        kill $EMULATOR_PID
        print_success "Émulateurs arrêtés"
    else
        print_info "Tests locaux ignorés"
    fi
}

# ===============================================
# 🚀 DÉPLOIEMENT
# ===============================================

deploy_rules() {
    print_header "Déploiement sur Firebase"
    
    read -p "Confirmer le déploiement en PRODUCTION ? (o/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        print_error "Déploiement annulé par l'utilisateur"
        exit 1
    fi
    
    print_info "Déploiement en cours..."
    
    # Déployer
    if firebase deploy --only firestore:rules,storage:rules,hosting; then
        print_success "Déploiement réussi !"
    else
        print_error "Erreur lors du déploiement"
        print_info "Consultez les logs ci-dessus pour plus de détails"
        exit 1
    fi
}

# ===============================================
# ✅ VÉRIFICATIONS POST-DÉPLOIEMENT
# ===============================================

verify_deployment() {
    print_header "Vérification du déploiement"
    
    # Vérifier Firestore Rules
    print_info "Vérification Firestore Rules..."
    if firebase firestore:rules:list &> /dev/null; then
        print_success "Firestore Rules déployées"
    else
        print_warning "Impossible de vérifier Firestore Rules"
    fi
    
    # Vérifier Storage Rules
    print_info "Vérification Storage Rules..."
    if firebase storage:rules:list &> /dev/null; then
        print_success "Storage Rules déployées"
    else
        print_warning "Impossible de vérifier Storage Rules"
    fi
    
    # Afficher URL console
    PROJECT=$(firebase use 2>&1 | grep "Active Project:" | cut -d' ' -f3)
    CONSOLE_URL="https://console.firebase.google.com/project/$PROJECT/overview"
    
    print_info "Console Firebase: $CONSOLE_URL"
}

# ===============================================
# 📊 RAPPORT FINAL
# ===============================================

generate_report() {
    print_header "Rapport de déploiement"
    
    REPORT_FILE="deployment_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$REPORT_FILE" <<EOF
═══════════════════════════════════════════════
 RAPPORT DE DÉPLOIEMENT - GESTIHOTEL
═══════════════════════════════════════════════

Date: $(date)
Projet: $(firebase use 2>&1 | grep "Active Project:" | cut -d' ' -f3)
Version: 2.0.0

FICHIERS DÉPLOYÉS:
✅ firebase-messaging-sw.js
✅ firestore.rules
✅ storage.rules

BACKUP CRÉÉ:
📁 $BACKUP_DIR/

RÉSULTAT:
✅ Déploiement réussi
✅ Règles actives en production
✅ Service Worker mis à jour

PROCHAINES ÉTAPES:
1. Tester avec différents rôles utilisateurs
2. Vérifier permissions Firestore
3. Tester uploads Storage
4. Vérifier Service Worker (DevTools)
5. Monitorer Firebase Console

RESSOURCES:
- Guide: GUIDE_DEPLOIEMENT.md
- Récap: RECAPITULATIF_CORRECTIONS.md
- Console: https://console.firebase.google.com/project/$(firebase use 2>&1 | grep "Active Project:" | cut -d' ' -f3)/overview

═══════════════════════════════════════════════
EOF

    print_success "Rapport créé: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# ===============================================
# 🎯 CHECKLIST FINALE
# ===============================================

show_checklist() {
    print_header "Checklist post-déploiement"
    
    cat <<EOF
${YELLOW}⚠️  ACTIONS RECOMMANDÉES:${NC}

1. ${BLUE}Tests manuels${NC}
   □ Se connecter avec différents rôles
   □ Tester création/modification interventions
   □ Tester upload photos
   □ Vérifier notifications push

2. ${BLUE}Vérifications techniques${NC}
   □ Chrome DevTools > Application > Service Workers
   □ Firebase Console > Firestore > Usage
   □ Firebase Console > Storage > Usage
   □ Vérifier logs d'erreurs

3. ${BLUE}Monitoring${NC}
   □ Activer alertes Firebase
   □ Configurer budget alerts
   □ Monitorer requêtes refusées

4. ${BLUE}Documentation${NC}
   □ Informer l'équipe des changements
   □ Documenter procédures de rollback
   □ Archiver ce rapport

5. ${BLUE}Optimisations futures${NC}
   □ Implémenter App Check
   □ Créer index Firestore
   □ Mettre en place tests automatisés

${GREEN}✅ Consultez GUIDE_DEPLOIEMENT.md pour plus de détails${NC}
EOF
}

# ===============================================
# 🚨 FONCTION DE ROLLBACK
# ===============================================

rollback() {
    print_header "Rollback"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Aucun backup trouvé pour rollback"
        exit 1
    fi
    
    print_warning "Cette action va restaurer les fichiers d'origine"
    read -p "Confirmer le rollback ? (o/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        print_error "Rollback annulé"
        exit 1
    fi
    
    # Restaurer fichiers
    cp "$BACKUP_DIR/firebase-messaging-sw.js" public/ 2>/dev/null || true
    cp "$BACKUP_DIR/firestore.rules" . 2>/dev/null || true
    cp "$BACKUP_DIR/storage.rules" . 2>/dev/null || true
    
    print_success "Fichiers restaurés depuis $BACKUP_DIR"
    
    # Redéployer
    print_info "Redéploiement des anciennes règles..."
    firebase deploy --only firestore:rules,storage:rules,hosting
    
    print_success "Rollback terminé"
}

# ===============================================
# 📝 FONCTION PRINCIPALE
# ===============================================

main() {
    clear
    
    cat <<EOF
${BLUE}
╔═══════════════════════════════════════════════╗
║                                               ║
║     🔐 DÉPLOIEMENT SÉCURITÉ GESTIHOTEL       ║
║                 Version 2.0.0                 ║
║                                               ║
╚═══════════════════════════════════════════════╝
${NC}
EOF

    # Vérifier le mode
    if [ "$1" == "--rollback" ]; then
        rollback
        exit 0
    fi
    
    # Flux normal
    check_prerequisites
    create_backup
    copy_files
    run_local_tests
    deploy_rules
    verify_deployment
    generate_report
    show_checklist
    
    print_header "🎉 Déploiement terminé avec succès !"
    
    print_success "Votre application est maintenant sécurisée"
    print_info "Consultez $REPORT_FILE pour les détails"
    print_info "En cas de problème: ./deploy.sh --rollback"
}

# ===============================================
# 🚀 LANCEMENT
# ===============================================

# Gérer Ctrl+C
trap 'print_error "Déploiement interrompu"; exit 1' INT

# Lancer le script
main "$@"
