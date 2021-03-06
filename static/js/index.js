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
var labelsSections = [];

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


function exportCSV(el, data, fileName) {
	
	var json = data;
	var fields = Object.keys(json[0])
	var replacer = function(key, value) { return value === null ? '' : value } 
	var csv = json.map(function(row){
	  return fields.map(function(fieldName){
		return JSON.stringify(row[fieldName], replacer)
	  }).join(';')
	})
	csv.unshift(fields.join(';')); // add header column
	csv = csv.join('\r\n');
	
	el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
	el.setAttribute("download", fileName);
}

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

function selectionnerSection() {
	// L'utilisateur a cliqué sur la liste déroulante des sections
	var e = document.getElementById("sections");
	var sonCode = e.options[e.selectedIndex].value;
	console.log(sonCode);
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

function onEachFeatureSection(feature, layer) {

	var label = L.marker(layer.getBounds().getCenter(), {
			interactive: false,
			icon: L.divIcon({
				className: 'labelSection',
				html: (feature.properties.prefixe + feature.properties.code).replace(/^0+/, ''),
			})
		});
	label.addTo(map);
	labelsSections.push(label);
	$('#sections').append($('<option />', {
		value: (feature.properties.prefixe + ('0' + feature.properties.code).slice(-2)),
		text: (feature.properties.prefixe + ('0' + feature.properties.code).slice(-2)).replace(/^0+/, '')
	}));
	layer.on({
		click: onSectionClicked
	});
}

function viderLabelsSections() {
	for (label of labelsSections) {
		map.removeLayer(label);
	}
	labelsSections = [];
}

function onSectionClicked(event) {
	sonCode = event.target.feature.properties.prefixe + ('0' + event.target.feature.properties.code).slice(-2);
	document.getElementById("sections").value = sonCode;
	console.log(sonCode);
}


function entrerDansCommune(sonCode) {

	console.log("Nous entrons dans la commune " + sonCode);
	viderLabelsSections();
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
	viderLabelsSections();
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

	// Paramètres français du range picker
	$('input[name="daterange"]').daterangepicker({
		opens: 'left',
		"locale": {
			"format": "DD/MM/YYYY",
			"separator": " - ",
			"applyLabel": "Valider",
			"cancelLabel": "Annuler",
			"fromLabel": "De",
			"toLabel": "à",
			"customRangeLabel": "Custom",
			"daysOfWeek": [
				"Dim",
				"Lun",
				"Mar",
				"Mer",
				"Jeu",
				"Ven",
				"Sam"
			],
			"monthNames": [
				"Janvier",
				"Février",
				"Mars",
				"Avril",
				"Mai",
				"Juin",
				"Juillet",
				"Août",
				"Septembre",
				"Octobre",
				"Novembre",
				"Décembre"
			],
			"firstDay": 1
		}
	}, function (start, end) {
		// Fonction executée quand la personne change les dates
		console.log("L'utilisateur a modifié la plage de dates. Rechargement des données.");
		dateMin = start.format('DD-MM-YYYY');
		dateMax = end.format('DD-MM-YYYY');
	});

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
