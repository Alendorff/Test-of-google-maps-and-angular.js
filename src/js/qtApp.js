angular.module('googleMapRoute', ['ng-sortable'])
	.factory('googleMapService', [function googleMapService() {
		var map;
		var infowindow;
		var polyline;
		return {
			createMap: function (mapNode, options) {
				map = new google.maps.Map(mapNode, options);
				return map;
			},
			createInfoWindow: function (options) {
				options = options || {};
				infowindow = new google.maps.InfoWindow(options);
				return infowindow;
			},
			createPolyline: function () { 
				polyline = new google.maps.Polyline({
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: 2
				});

				polyline.setMap(map);

				return polyline;
			},			
			addMarker: function (title, latLng) {
				var markerOptions = {
					position: latLng || map.getCenter(),
					map: map,
					draggable: true
				};
				if (title) {
					markerOptions.title = title;
					markerOptions.label = title[0];
				}
				return new google.maps.Marker(markerOptions);
			},
			getMap: function () {
				return map;
			},
			getInfoWindow: function () {
				return infowindow;
			},
			getPolyline: function () {
				return polyline;
			}
		};
	}])
	.controller('googleMapRouteController', ['$scope', 'googleMapService', function googleMapRouteController ($scope, googleMapService) {
		'use strict';
		var markers = {}; // pairs {listItemName: marker}
		var currentPath;

		$scope.items = [];
		$scope.newItem = '';

		/* Add new item in the list and on map */
		$scope.addItem = function(item) {
			if (!currentPath) currentPath = googleMapService.getPolyline().getPath();

			if (!item) item = '...'; // for noname markers

			while (markers[item]) {
				item = prompt('Items list already contains item with name: "' + item + '". Please, rename new item.');
			}

			$scope.items.push(item);
			$scope.newItem = '';

			var marker = googleMapService.addMarker(item);
			markers[item] = marker;

			// Add a new marker as a polyline dot
			currentPath.push(marker.getPosition());

			// Change a polyline dot on marker drag
			marker.addListener('drag', function (e) {
				var position = $scope.items.indexOf(marker.getTitle());
				if (position > -1) {
					currentPath.setAt(position, marker.getPosition());
				}
			});

			// dummy marker balloon
			marker.addListener('click', function (e) {
				var infowindow = googleMapService.getInfoWindow();
				infowindow.setContent(marker.title);
				infowindow.open(googleMapService.getMap(), marker);
			});
		};

		// items order changed in the list
		$scope.onUpdate = function(e) {
			var elem = currentPath.getAt(e.oldIndex);
			currentPath.removeAt(e.oldIndex);
			currentPath.insertAt(e.newIndex, elem);
		};

		// if an item removed from the list, remove it from map with route change
		$scope.removeItem = function(item) {
			var i = $scope.items.indexOf(item);
			if (i === -1) throw Error('Item with name ' + item + ' are not in the list.');
			$scope.items.splice(i, 1);
			currentPath.removeAt(i);
			
			var marker = markers[item];
			marker.setMap(null);
			delete markers[item];
		};
	}])
	.directive('googleMap', ['googleMapService', function (googleMapService) {
		return function googleMapDirectiveController (scope, elements, attrs) {
			var mapProp = {
				center: new google.maps.LatLng(51.508742, -0.120850),
				zoom: 5,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				disableDefaultUI: true
			};
			googleMapService.createMap(elements[0], mapProp);
			googleMapService.createInfoWindow();
			googleMapService.createPolyline();
		};
	}]);