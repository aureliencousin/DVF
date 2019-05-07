// Partie Vue -----------------------------------------------------------------

// On commence par creer des "composants" qu'on va utiliser un peu partout

// Là on donne le nom du composant (comme un span, div, h3, etc)
Vue.component('boite', {
	// Les paramètres sont là
	props: ['couleur', 'valeur', 'icone', 'texte'],
	// La on donne le code source HTML du composant qui peut utiliser des données
	template: 
		`<div class="media d-flex mt-3">
			<div class="align-self-center ml-1 mr-1">
				<i :class="'fa-2x fa-fw ' + icone"></i>
			</div>
			<div class="media-body text-left ml-1">
				<b>{{valeur}}</b><br>
				<span>{{texte}}</span>
			</div>
		</div>`
});


// Ici, on cree l'application Vue (on lui dit de se relier à l'élément HTML app)
var vue = new Vue({
		el: '#app',
		data: {
			fold_left: false,
		},
		methods: {},
	});


// Partie JavaScript standard (sans framework) --------------------------------

// Définition des variables globales

var codeDepartement = null;
var codeCommune = null;

var communesLayer = null;
var sectionsLayer = null;
var evoPrixSection = null;

var dateMin = '01-01-2015';
var dateMax = '01-01-2019';

// Fonctions

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("sidebar_left").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}

$('.input-daterange input').each(function() {
    $(this).datepicker('clearDates');
});

function selectionnerDepartement() {
	// L'utilisateur a cliqué sur la liste déroulante des départements
	var e = document.getElementById("departements");
	var sonCode = e.options[e.selectedIndex].value;
	entrerDansDepartement(sonCode);
};

function selectionnerCommune() {
	// L'utilisateur a cliqué sur la liste déroulante des communes
	var e = document.getElementById("communes");
	var sonCode = e.options[e.selectedIndex].value;
	entrerDansCommune(sonCode);
}

function onEachFeatureCommune(feature, layer) {

	$('#communes').append($('<option />', {
		value: feature.properties.code,
		text: feature.properties.nom
	}));
	layer.on({
		click: onCityClicked
	});
}

var paletteCouleurPrix = [
	"#FF4540", // 0
	"#FF9640", // 1
	"#FFBF40", // 2
	"#FFE740", // 3
	"#EDFD3F", // 4
	"#A7F43D", // 5
	"#38E05D", // 6
];

var prixMinCommune = 0; // TODO recuperer a partir des data
var prixMaxCommune = 10000; // TODO recuperer a partir des data

function changerIntervalle(value, oldMin, oldMax, newMin, newMax) {
	return (((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
}

function trouverCouleurSection(prix, prixMinCommune, prixMaxCommune) {
	var index = Math.floor(changerIntervalle(prix, prixMinCommune, prixMaxCommune, 0, paletteCouleurPrix.length));
	return paletteCouleurPrix[index];
}

function getPrixMoyenSection(section) {
	return  Math.round(Math.random() * 10000 * 100) / 100; // TODO: recuperer depuis DB
}

function getEvoPrixSection(section) {
	// TODO: recuperer depuis DB
	return {
		"2018-01": Math.round(Math.random() * 10000 * 100) / 100,
		"2018-02": Math.round(Math.random() * 10000 * 100) / 100,
		"2018-03": Math.round(Math.random() * 10000 * 100) / 100
	}
}

function onEachFeatureSection(feature, layer) {
	var prixMoyenSection = getPrixMoyenSection(feature.properties.id);
	var couleur = trouverCouleurSection(prixMoyenSection, prixMinCommune, prixMaxCommune);
	layer.setStyle({fillColor:couleur});
	layer.on({
		click: onSectionClicked
	});
}

function onSectionClicked(event) {
	var feature = event.target.feature;
	//TODO : afficher graphe avec evo prix moyen
	var prixMoyenActuel = getPrixMoyenSection(feature.properties.id);
	evoPrixSection = getEvoPrixSection(feature.properties.id);
	console.log(prixMoyenActuel);
	console.log(evoPrixSection);
}


function entrerDansCommune(sonCode) {

	console.log("Nous entrons dans la commune " + sonCode);
	codeCommune = sonCode;
	$.getJSON("https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/" + codeCommune + "/geojson/sections",
		function (data) {
			if (sectionsLayer != null) {
				map.removeLayer(sectionsLayer);
			}
			sectionsLayer = L.geoJson(data, {
					weight: 1,
					fillOpacity: 0.2,
					color: '#212f39',
					onEachFeature: onEachFeatureSection
				});
			sectionsLayer.addTo(map);
			map.fitBounds(sectionsLayer.getBounds());
			
			nom_fichier_commune = codeCommune + '.csv';
			vue.commune = {
				code: sonCode
			};
		}
	);
}

function entrerDansDepartement(sonCode) {

	codeDepartement = sonCode;
	console.log('Nous entrons dans le département ' + codeDepartement);
	vue.commune = null;
	document.getElementById('communes').innerHTML = '<option style="display:none"></option>';
	url = "https://geo.api.gouv.fr/departements/" + codeDepartement + "/communes?geometry=contour&format=geojson&type=commune-actuelle,arrondissement-municipal"
	$.getJSON(url,
		function (data) {
			if (communesLayer != null) {
				map.removeLayer(communesLayer);
			}
			communesLayer = L.geoJson(data, {
					weight: 1,
					fillOpacity: 0,
					color: '#212f39',
					onEachFeature: onEachFeatureCommune
				});
			if (sectionsLayer != null) {
				map.removeLayer(sectionsLayer);
			}
			communesLayer.addTo(map);
			map.fitBounds(communesLayer.getBounds());
		}
	);
}

function onCityClicked(event) {
	// L'utilisateur a cliqué sur la géométrie d'une commune
	var sonCode = event.sourceTarget.feature.properties.code;
	entrerDansCommune(sonCode);
	document.getElementById("communes").value = sonCode;
}

function onDepartementClick(event) {
	// L'utilisateur a cliqué sur la géométrie d'un département
	var id = event.target._leaflet_id;
	var sonCode = event.target._layers[id - 1]['feature'].properties.code;
	entrerDansDepartement(sonCode);
	document.getElementById("departements").value = sonCode;
};


// C'est le code qui est appelé au début (sans que personne ne clique)
(function () {

	// Mise en place de la carte
	map = new L.Map('mapid', min = 0, max = 30);
	var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {
			minZoom: 0,
			maxZoom: 30,
			attribution: osmAttrib
		});
	map.setView(new L.LatLng(47, 3), 5);
	map.addLayer(osm);

	// Chargement de la liste des départements
	$.getJSON("https://geo.api.gouv.fr/departements?fields=nom,code", 
		function (data) {
			var $select = $('#departements');
			$.each(data, function (i, val) {
				$select.append($('<option />', {
					value: data[i].code,
					text: data[i].code + ' - ' + data[i].nom
				}));
			});
		}
	);

	// Chargement des contours des départements
	$.getJSON("donneesgeo/departements-100m.geojson",
		function (data) {
			departements = data;
			departements.features.forEach(function (state) {
				var polygon = L.geoJson(state, {
						weight: 1,
						fillOpacity: 0,
						color: '#212f39',
					}).addTo(map).on('click', onDepartementClick);
			});
		}
	);
	
	// Sur mobile, cacher la barre latérale
	if (window.innerWidth < 768) {
		vue.fold_left = true;
	}
})();
