// =========================================================
// main.js : les effets de la page
// 1. Menu sur téléphone
// 2. Déchiffrement du nom
// 3. Empreinte SHA-256
// 4. Terminal qui tape tout seul
// 5. Triangle de chiffres binaires
// 6. Apparition des sections au défilement
// 7. Captures d'écran manquantes
// 8. Année du pied de page
// =========================================================

// Si la personne a désactivé les animations dans son système, on les respecte
const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ---------- 1. Menu sur téléphone ----------
const boutonMenu = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

boutonMenu.addEventListener('click', () => {
  const estOuvert = !menu.classList.toggle('hidden');
  boutonMenu.setAttribute('aria-expanded', estOuvert);
});

// On referme le menu quand on clique sur un lien
menu.querySelectorAll('a').forEach((lien) => {
  lien.addEventListener('click', () => {
    menu.classList.add('hidden');
    boutonMenu.setAttribute('aria-expanded', 'false');
  });
});


// ---------- 2. Déchiffrement du nom ----------
// Les lettres apparaissent d'abord brouillées, puis se fixent une à une
const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@';

function dechiffrer(element, delai) {
  if (mouvementReduit) return;
  const texte = element.textContent;

  // On bloque la largeur du mot à sa taille finale :
  // les lettres au hasard n'ont pas toutes la même largeur,
  // sans ça le nom changerait de taille et la page « sauterait »
  element.style.width = element.getBoundingClientRect().width + 'px';

  let etape = 0;
  setTimeout(() => {
    const minuteur = setInterval(() => {
      element.textContent = texte
        .split('')
        .map((lettre, i) => (i < etape / 2 ? lettre : caracteres[Math.floor(Math.random() * caracteres.length)]))
        .join('');
      etape++;
      if (etape > texte.length * 2) {
        clearInterval(minuteur);
        element.textContent = texte;
        element.style.width = ''; // on libère la largeur à la fin
      }
    }, 35);
  }, delai);
}

// On attend que les polices soient chargées pour mesurer la bonne largeur
document.fonts.ready.then(() => {
  document.querySelectorAll('[data-dechiffre]').forEach((element, i) => dechiffrer(element, 100 + i * 250));
});


// ---------- 3. Empreinte SHA-256 ----------
// Le navigateur calcule la vraie empreinte de « Aurore Ametepe »
async function calculerEmpreinte(texte) {
  const octets = new TextEncoder().encode(texte);
  const resultat = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(resultat)].map((o) => o.toString(16).padStart(2, '0')).join('');
}

const zoneEmpreinte = document.getElementById('empreinte');
if (zoneEmpreinte && window.crypto && crypto.subtle) {
  calculerEmpreinte('Aurore Ametepe')
    .then((empreinte) => {
      zoneEmpreinte.textContent = empreinte.slice(0, 8) + '…' + empreinte.slice(-6);
      zoneEmpreinte.title = empreinte; // l'empreinte complète au survol
    })
    .catch(() => { /* on garde la valeur déjà écrite dans le HTML */ });
}


// ---------- 4. Terminal qui tape tout seul ----------
const lignes = [
  ['$', 'whoami'],
  ['', 'aurore ametepe'],
  ['$', 'cat parcours.txt'],
  ['', 'cybersécurité · L2'],
  ['$', './apprendre --en-cours'],
  ['', 'python  java  docker'],
];
const terminal = document.getElementById('terminal');

function invite() {
  const signe = document.createElement('span');
  signe.className = 'text-or';
  signe.textContent = '$ ';
  return signe;
}

function ecrireLigne(i) {
  // Toutes les lignes sont écrites : on affiche l'invite avec le curseur qui clignote
  if (i >= lignes.length) {
    const derniere = document.createElement('div');
    const curseur = document.createElement('span');
    curseur.className = 'curseur';
    derniere.append(invite(), curseur);
    terminal.append(derniere);
    return;
  }

  const [estCommande, texte] = lignes[i];
  const ligne = document.createElement('div');
  if (estCommande) ligne.append(invite());
  else ligne.className = 'text-ivoire';

  const zoneTexte = document.createElement('span');
  ligne.append(zoneTexte);
  terminal.append(ligne);

  if (mouvementReduit) {
    zoneTexte.textContent = texte;
    ecrireLigne(i + 1);
    return;
  }

  let k = 0;
  const vitesse = estCommande ? 55 : 12; // les commandes sont « tapées », les réponses s'affichent vite
  (function taper() {
    if (k < texte.length) {
      zoneTexte.textContent += texte[k++];
      setTimeout(taper, vitesse);
    } else {
      setTimeout(() => ecrireLigne(i + 1), estCommande ? 250 : 450);
    }
  })();
}

if (terminal) ecrireLigne(0);


// ---------- 5. Triangle de chiffres binaires ----------
const triangle = document.getElementById('triangle');

if (triangle) {
  const taille = 9;
  const cases = [];

  for (let rang = 0; rang < taille; rang++) {
    const ligne = document.createElement('div');
    for (let k = 0; k < taille - rang; k++) {
      const chiffre = document.createElement('span');
      chiffre.textContent = Math.random() > 0.5 ? '1' : '0';
      // Plus on s'éloigne du coin, plus le chiffre est pâle
      const opacite = Math.max(0.12, 0.75 - ((rang + k) / taille) * 0.6);
      chiffre.style.opacity = opacite;
      chiffre.dataset.opacite = opacite;
      ligne.append(chiffre);
      cases.push(chiffre);
    }
    triangle.append(ligne);
  }

  // De temps en temps, quelques chiffres basculent de 0 à 1
  if (!mouvementReduit) {
    setInterval(() => {
      for (let n = 0; n < 3; n++) {
        const chiffre = cases[Math.floor(Math.random() * cases.length)];
        chiffre.style.opacity = 0.05;
        setTimeout(() => {
          chiffre.textContent = chiffre.textContent === '1' ? '0' : '1';
          chiffre.style.opacity = chiffre.dataset.opacite;
        }, 500);
      }
    }, 450);
  }
}


// ---------- 6. Apparition des sections au défilement ----------
const observateur = new IntersectionObserver((entrees) => {
  entrees.forEach((entree) => {
    if (entree.isIntersecting) {
      entree.target.classList.add('visible');
      observateur.unobserve(entree.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((section) => observateur.observe(section));


// ---------- 7. Captures d'écran manquantes ----------
// Si une image n'existe pas, on la cache au lieu d'afficher une icône cassée
document.querySelectorAll('img[data-capture]').forEach((image) => {
  const cacher = () => image.closest('.capture')?.classList.add('capture--vide');
  if (image.complete && image.naturalWidth === 0) cacher();
  else image.addEventListener('error', cacher);
});


// ---------- 8. Année du pied de page ----------
document.getElementById('annee').textContent = new Date().getFullYear();
