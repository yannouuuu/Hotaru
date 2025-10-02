# 🔐 Instructions pour activer le CAS

## ⚠️ Statut actuel : NON DISPONIBLE

Le système d'authentification CAS est **semi-implémenté mais désactivé** car il nécessite une configuration avancée.

---

## 📋 Pourquoi le CAS ne fonctionne pas en local ?

Le **CAS de l'Université de Lille** (https://cas.univ-lille.fr) n'accepte que les **URLs de callback pré-enregistrées** dans leur système.

Pour des raisons de sécurité, ils ne permettent pas :
- ❌ `http://localhost:3000`
- ❌ URLs Ngrok aléatoires
- ❌ N'importe quelle URL non autorisée

