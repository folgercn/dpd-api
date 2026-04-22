/////____google-maps_Anbindung____\\\\\
var directionsDisplay;
var place;
var map;
var renderOptions;
var markers = [];
var openwindows = [];
var openmarks = [];

function initialize(divMap) {
    directionsDisplay = new google.maps.DirectionsRenderer();
    var styles = [
        {
            "featureType": "landscape",
            "stylers": [
                { "visibility": "on" },
                { "color": "#ebebeb" }
            ]
        }, {
            "featureType": "poi.sports_complex",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "poi.attraction",
            "stylers": [
                { "visibility": "off" }
            ]
        }, {
            "featureType": "poi.government",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "poi.medical",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "poi.place_of_worship",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "poi.school",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                { "visibility": "on" },
                { "color": "#d2e4f3" }
            ]
        }, {
            "featureType": "water",
            "elementType": "labels",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "transit",
            "elementType": "labels",
            "stylers": [
                { "visibility": "off" }
            ]
        }, {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [
                { "visibility": "on" },
                { "color": "#ffffff" }
            ]
        }, {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [
                { "visibility": "on" },
                { "color": "#ebebeb" }
            ]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [
                { "visibility": "on" },
                { "color": "#666666" }
            ]
        }, {
            "featureType": "poi.business",
            "stylers": [
                { "visibility": "off" }
            ]
        }, {
            "featureType": "road",
            "elementType": "labels.icon",
            "stylers": [
                { "visibility": "off" }
            ]
        }, {
            "featureType": "poi",
            "elementType": "geometry.fill",
            "stylers": [
                { "visibility": "on" },
                { "color": "#dbdbdb" }
            ]
        }, {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [
                { "visibility": "on" },
                { "color": "#999999" }
            ]
        }, {
            "featureType": "transit.station",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [
                { "visibility": "on" },
                { "color": "#dbdbdb" }
            ]
        }, {
            "elementType": "labels.icon",
            "stylers": [
                { "visibility": "on" },
                { "saturation": -100 }
            ]
        }, {
            "featureType": "road",
            "elementType": "labels.icon",
            "stylers": [
                { "visibility": "off" }
            ]
        }, {
            "elementType": "labels.text",
            "stylers": [
                { "visibility": "on" }
            ]
        }, {
            "featureType": "transit.line",
            "elementType": "labels.text",
            "stylers": [
                { "visibility": "off" }
            ]
        }
    ];
    var mapOptions = {
        controlSize: 24,
        zoom: 6,
        styles: styles,
        disableDefaultUI: true,
        center: new google.maps.LatLng(51.056355, 10.307433),
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById(divMap), mapOptions);
    renderOptions = {
        suppressMarkers: true,
        suppressPolylines: true
    };

    directionsDisplay.setOptions(renderOptions);
    directionsDisplay.setMap(map);


    // Positionsmarkierung des Empfängers
    var shipAddress_latitude = $('input[ID*="hidShipAddress_Latitude"]').val();
    var shipAddress_longitude = $('input[ID*="hidShipAddress_Longitude"]').val();
    if (shipAddress_latitude > 0 && shipAddress_longitude > 0) {
        var shipAddress_Info = $('input[ID*="hidShipAddress"]').val();
        var shipAddress_Icon = {
            url: "../../Images/tracking30/shipAddress_Marker.svg",
            size: { width: 44, height: 64, widthUnit: "px", heightUnit: "px" }
        };
        var shipAddress_Marker = new google.maps.Marker(
            {
                position: new google.maps.LatLng(shipAddress_latitude, shipAddress_longitude),
                map: map,
                title: shipAddress_Info
            });
                
        shipAddress_Marker.setTitle(shipAddress_Info); // Tooltip
        shipAddress_Marker.setIcon(shipAddress_Icon);
        shipAddress_Marker.setZIndex(1);

        // Popup mit Empfängeradresse
        var shipAddress_Split = shipAddress_Info.split("\n");
        var shipAddress_Label =
            "<div class='shopfinder_PopupContainer'><div class='shopfinder_Popup_Distance'>" +
            shipAddress_Split[0] +
            "</div><div class='shopfinder_Popup_ShopName'>" +
            shipAddress_Split[1] +
            "</div><div class='shopfinder_Popup_Address'>";
        for (var i = 2; i < shipAddress_Split.length; i++) {
            shipAddress_Label += shipAddress_Split[i] + "<br />";
        }
        shipAddress_Label += "</div></div>";

        google.maps.event.addListener(shipAddress_Marker, 'click', function () {
            var shipAddress_infoWindow = new google.maps.InfoWindow(
                {
                    content: shipAddress_Label,
                    maxWidth: 320,
                    maxHeight: 400
                });
            shipAddress_infoWindow.open(shipAddress_Marker.get('map'), shipAddress_Marker);
            //openwindows.push(shipAddress_infoWindow);
            //openmarks.push(shipAddress_Marker);
        });
    }
}
/////____google-maps_Anbindung____\\\\\



/////____Funktion_für_Shopfinder____\\\\\
function getPlace(latlng) {
    var openingHeadline = $('input[ID*="hidHeadlineOpening"]').val();
    var holydayHeadline = $('input[ID*="hidHeadlineHolyday"]').val();
    
    for (var i = 0; i < latlng.length; i++) {
        var parcelstation = latlng[i].parcelstation;
        var myLatlng = new google.maps.LatLng(latlng[i].lat, latlng[i].lng);
        if (i == 0) {
            map.setCenter(myLatlng);
        }
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map
        });

        marker.setTitle();

        var pic;
        if (parcelstation == "no_parcelstation") {
            pic = {
                url: "../Images/paketshop.png",
                size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
            };
        } else {
            pic = {
                url: "../images/pickupbox_locationmarker_pickup.png",
                size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
            };
        }
        marker.setIcon(pic);
        marker.setZIndex(2);
        attachSecretMessage(marker, i);

    }

    function attachSecretMessage(marker, a) {
        var parcelstation = $('input[ID*="hidParcelStation"]')[a].value;
        var opening = $('input[ID*="hidOpening"]')[a].value;
        var holidays = $('input[ID*="hidShopHolyday"]')[a].value;
        var shopname = $('div[ID*="txtShopName"]')[a].innerHTML;
        var distance = "";
        if ($('div[ID*="txtShopDistance"]').length > 0) {
            distance = $('div[ID*="txtShopDistance"]')[a].innerHTML
        }
        var shopstreet = $('div[ID*="txtShopAdr"]')[a].innerHTML
        var services = $('div[ID*="shopServiceList"]')[a].innerHTML
        var days = [];
        var check = true
        var shopID = $('.mapShopList')[a].getAttribute("ID")

        while (check) {
            if (opening.indexOf(",") > 1) {
                days.push(opening.substring(0, opening.indexOf(",")));
                opening = opening.substring(opening.indexOf(",") + 1);
            } else {
                days.push(opening)
                check = false
            }
        }

        var content = opening.value;
        content = "<div class='shopfinder_PopupContainer'><div class='shopfinder_Popup_Distance'>" + distance +
            "</div><div class='shopfinder_Popup_ShopName'>" + shopname +
            "</div><div class='cb'> </div></div>" +
            "<div class='shopfinder_Popup_Address'>" + shopstreet + "</div>" +
            "<div class='shopfinder_Popup_Servicelist'>" + services + "</div>" +
            $('.shopfinder_OpeningHours')[a].innerHTML
        var tmpList = holidays.split(";");
        if (tmpList.length > 1) {
            content = content + "<div class='shopfinder_Popup_opening'>" + holydayHeadline + "</div><div class='shopfinder_holiday_table'><table>";

            for (var u = 0; u < tmpList.length; u++) {
                content = content + "<tr><td>" + tmpList[u] + "</td></tr>";
            }
            content = content + "</table>"

            content = content + "</div>"
        }
        google.maps.event.addListener(marker, 'click', function () {
            $('.mapShopList').each(function () {
                this.className = "mapShopList";
                this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                this.removeAttribute("style");
            });
            $('.scrollDiv').css("overflow", "auto");
            $('.closeDetails').hide();
            for (var i = 0; i < openwindows.length; i++) {
                openwindows[i].close();
            }
            var request;
            $('.mapShopListHover.mapShopList').removeClass("mapShopListHover");
            $('.mapShopList')[a].className = "mapShopList mapShopListHover";
            $('.mapShopList').get(a).className = "mapShopList mapShopListHover";
            $('.mapShopList').get(a).querySelector(".shopfinder_OpeningHours").classList.remove("noOpeningHours");
            $('.mapShopList').get(a).style.height = "555px";
            $('.mapShopList').get(a).scrollIntoView(true);
            $('.scrollDiv').css("overflow", "hidden");
            $('.closeDetails').show().click(function () {
                $('.mapShopList').each(function () {
                    this.className = "mapShopList";
                    this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                    this.removeAttribute("style");
                });
                $('.scrollDiv').css("overflow", "auto");
                $('.closeDetails').hide();
            });
            for (var i = 0; i < openmarks.length; i++) {
                if (parcelstation == "no_parcelstation") {
                    request = {
                        url: "../Images/paketshop.png",
                        size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                    };
                } else {
                    request = {
                        url: "../images/pickupbox_locationmarker_pickup.png",
                        size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                    };
                }
                openmarks[i].setIcon(request);
            }
            openmarks = [];
            marker.setZIndex(2);

            var infowindow = new google.maps.InfoWindow({
                content: content,
                maxWidth: 320,
                maxHeight: 400
            });
            google.maps.event.addListener(infowindow, 'closeclick', function () {
                $('.mapShopList').each(function () {
                    this.className = "mapShopList";
                    this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                    this.removeAttribute("style");
                });
                $('.scrollDiv').css("overflow", "auto");
                $('.closeDetails').hide();
                marker.setZIndex(1);
                var request;
                if (parcelstation == "no_parcelstation") {
                    request = {
                        url: "../Images/paketshop.png",
                        size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                    };
                } else {
                    request = {
                        url: "../images/pickupbox_locationmarker_pickup.png",
                        size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                    };
                }
                marker.setIcon(request);
                openmarks = [];
            });
            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../Images/paketshop_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            }
            marker.setIcon(request);
            infowindow.open(marker.get('map'), marker);
            openwindows.push(infowindow);
            openmarks.push(marker);
            $('.mapShopListHover.mapShopList').removeClass("mapShopListHover");
            $('.mapShopList')[a].className = "mapShopList mapShopListHover";
        });

        $('#' + shopID).click(function () {
            $('.mapShopList').each(function () {
                this.className = "mapShopList";
                this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                this.removeAttribute("style");
            });
            $('.scrollDiv').css("overflow", "auto");
            $('.closeDetails').hide();
            this.className = "mapShopList mapShopListHover";
            this.querySelector(".shopfinder_OpeningHours").classList.remove("noOpeningHours");
            this.style.height = "555px";
            this.scrollIntoView(true);
            $('.scrollDiv').css("overflow", "hidden");
            $('.closeDetails').show().click(function () {
                $('.mapShopList').each(function () {
                    this.className = "mapShopList";
                    this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                    this.removeAttribute("style");
                });
                $('.scrollDiv').css("overflow", "auto");
                $('.closeDetails').hide();
            });
            for (var i = 0; i < openwindows.length; i++) {
                openwindows[i].close();
            }
            for (var i = 0; i < openmarks.length; i++) {
            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../Images/paketshop_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            }
                openmarks[i].setIcon(request);
            }
            openmarks = [];
            var infowindow = new google.maps.InfoWindow({
                content: content
            });

            google.maps.event.addListener(infowindow, 'closeclick', function () {
                var request;
                if (parcelstation == "no_parcelstation") {
                    request = {
                        url: "../Images/paketshop.png",
                        size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                    };
                } else {
                    request = {
                        url: "../images/pickupbox_locationmarker_pickup.png",
                        size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                    };
                }
                marker.setIcon(request);
                openmarks = [];
                $('.mapShopList').each(function () {
                    this.className = "mapShopList";
                    this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                    this.removeAttribute("style");
                });
                $('.scrollDiv').css("overflow", "auto");
                $('.closeDetails').hide();
            });

            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../Images/paketshop_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            }
            marker.setIcon(request);
            infowindow.open(marker.get('map'), marker);
            openwindows.push(infowindow);
            openmarks.push(marker);
            $('.mapShopListHover.mapShopList').removeClass("mapShopListHover");
            $('.mapShopList')[a].className = "mapShopList mapShopListHover";
        });

        $('#' + shopID).hover(function () {
            var request;
            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../images/paketshop_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup_highlighted.png",
                    size: { width: 68, height: 66, widthUnit: "px", heightUnit: "px" }
                };
            }
            var myLatlng = new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng());

            marker.setIcon(request);
            marker.setZIndex(2);
        }, function () {
            marker.setZIndex(1);
            var request;
            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../images/paketshop.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup.png",
                    size: { width: 68, height: 66, widthUnit: "px", heightUnit: "px" }
                };
            }
            if (openmarks.length > 0) {
                if (openmarks[0] != marker) {
                    marker.setIcon(request);
                }
            } else {
                marker.setIcon(request);
            }
        });
        google.maps.event.addListener(marker, 'mouseover', function () {
            $('.mapShopList').each(function () {
                this.className = "mapShopList";
                this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                this.removeAttribute("style");
            });
            $('.scrollDiv').css("overflow", "auto");
            $('.closeDetails').hide();
            var request;
            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../images/paketshop_highlighted.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup_highlighted.png",
                    size: { width: 68, height: 66, widthUnit: "px", heightUnit: "px" }
                };
            }
            marker.setIcon(request);
            marker.setZIndex(2);
            $('.mapShopList').get(a).className = "mapShopList mapShopListHover";
            $('.mapShopList').get(a).querySelector(".shopfinder_OpeningHours").classList.remove("noOpeningHours");
            $('.mapShopList').get(a).style.height = "555px";
            $('.mapShopList').get(a).scrollIntoView(true);
            $('.scrollDiv').css("overflow", "hidden");
            $('.closeDetails').show().click(function () {
                $('.mapShopList').each(function () {
                    this.className = "mapShopList";
                    this.querySelector(".shopfinder_OpeningHours").classList.add("noOpeningHours");
                    this.removeAttribute("style");
                });
                $('.scrollDiv').css("overflow", "auto");
                $('.closeDetails').hide();
            });
        });
        google.maps.event.addListener(marker, 'mouseout', function () {
            var request;
            if (parcelstation == "no_parcelstation") {
                request = {
                    url: "../images/paketshop.png",
                    size: { width: 60, height: 60, widthUnit: "px", heightUnit: "px" }
                };
            } else {
                request = {
                    url: "../images/pickupbox_locationmarker_pickup.png",
                    size: { width: 68, height: 66, widthUnit: "px", heightUnit: "px" }
                };
            }
            marker.setZIndex(1);
            if (openmarks.length > 0) {
                if (openmarks[0] != marker) {
                    marker.setIcon(request);
                }
            } else {
                marker.setIcon(request);
            }
        });
    }
    map.setZoom(13);
}
/////____Funktion_für_Shopfinder____\\\\\
