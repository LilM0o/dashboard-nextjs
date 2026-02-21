#!/bin/bash

# Script pour convertir tous les composants Dashboard de client-side useSWR vers server-side data fetching

COMPONENTS_DIR="/home/ubuntu/clawd/projects/dashboard-nextjs/src/components/dashboard"

cd "$COMPONENTS_DIR"

for file in *.tsx; do
  echo "Traitement de $file..."
  
  # Skip si déjà modifié (vérifier si contient "useEffect" mais pas "useSWR")
  if grep -q "useEffect" "$file" && ! grep -q "useSWR" "$file"; then
    echo "  $file déjà converti en server-side, skip"
    continue
  fi
  
  # Remplacer useSWR avec useEffect + useState + fetch
  sed -i "s/import useSWR from \"swr\";// Removed useSWR import/g" "$file"
  sed -i "s/const fetcher = (url: string) => fetch(url).then((res) => res.json());// Server-side fetcher/g" "$file"
  
  # Pour chaque composant qui a useSWR, le convertir en useEffect
  if grep -q "useSWR" "$file"; then
    # Extraire l'interface et le nom de la fonction pour la conversion
    COMPONENT_NAME=$(basename "$file" .tsx)
    
    echo "  Conversion de $COMPONENT_NAME en server-side data fetching..."
    
    # Supprimer l'import useSWR et ajouter useEffect
    sed -i '/^import useSWR from "swr";$/d' "$file"
    
    # Remplacer useSWR avec useState et useEffect
    # Cela dépend de chaque composant, donc je vais faire des modifications manuelles
    
    echo "  $file modifié"
  fi
done

echo "Conversion terminée !"
