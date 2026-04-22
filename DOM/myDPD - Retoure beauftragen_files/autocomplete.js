//need jquery-ui

function iniAutocomplete() {
    $('input[class*="autoStreet"]').autocomplete({
        minLength: 1, // anz
        delay: 0,
        source: function (request, response) {
            var street, zipCode, city, Country, formContainer;

            $('input[class*="autoStreet"]').each(function (index) {
                if ($(this).is(":focus")) {
                    formContainer = $(this).parent().parent().parent().parent();
                }
            });

            street = formContainer.find('input[class*="autoStreet"]').val();

            if (formContainer.find('input[class*="autoZipCode"]').is("input")) {
                zipCode = formContainer.find('input[class*="autoZipCode"]').val();
            } else {
                zipCode = formContainer.find('input[class*="autoZipCode"]').text();
            }

            if (formContainer.find('input[class*="autoCity"]').is("input")) {
                city = formContainer.find('input[class*="autoCity"]').val();
            } else {
                city = formContainer.find('input[class*="autoCity"]').text();
            }

            if (formContainer.find('[ref*="autoCountryAlpha3"]').length > 0) {
                Country = formContainer.find('[ref*="autoCountryAlpha3"]').val();
            }
            //console.log(zipCode, city, Country);
            $.ajax({
                type: "POST",
                url: "../../JS/Autocomplete.aspx/getStreetList",
                data: '{searchString: "' + street + '", ZipCode:"' + zipCode + '", City:"' + city + '", CountryAlpha3:"' + Country + '"}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: "false",
                success: function (text) {
                    response(text.d);
                },
                failure: function (response) {
                    console.log("failure", response);
                    alert("Error in expanding node:" + response.d);
                }
            });
        }
    });
    $('input[class*="autoCity"]').autocomplete({
        minLength: 0,
        delay: 0,
        source: function (request, response) {
            var zipCode, city = "", Country, formContainer;

            $('input[class*="autoCity"]').each(function (index) {
                if ($(this).is(":focus")) {
                    formContainer = $(this).parent().parent().parent().parent();
                }
            });

            if (formContainer.find('input[class*="autoZipCode"]').is("input")) {
                zipCode = formContainer.find('input[class*="autoZipCode"]').val();
            } else {
                zipCode = formContainer.find('input[class*="autoZipCode"]').text();
            }
            zipCode = $.trim(zipCode);

            if (formContainer.find('input[class*="autoCity"]').is("input")) {
                city = formContainer.find('input[class*="autoCity"]').val();
            } else {
                city = formContainer.find('input[class*="autoCity"]').text();
            }

            if (formContainer.find('[ref*="autoCountryAlpha3"]').length > 0) {
                Country = formContainer.find('[ref*="autoCountryAlpha3"]').val();
            }
            

            $.ajax({
                type: "POST",
                url: "../../JS/Autocomplete.aspx/getCityList",

                data: '{ZipCode:"' + zipCode + '", City:"' + city + '", CountryAlpha3:"' + Country + '"}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: "false",
                success: function (text) {
                    response(text.d);
                },
                failure: function (response) {
                    console.log("failure", response);
                    alert("Error in expanding node:" + response.d);
                }
            });
        }
    }).bind('focus', function () {
        $(this).autocomplete("search");
    }).on("autocompleteselect", function (event, ui) {

        var formContainer;
        $('input[class*="autoCity"]').each(function (index) {
            if ($(this).is(":focus")) {
                formContainer = $(this).parent().parent().parent().parent();
            }
        });
        formContainer.find('input[class*="autoStreet"]').val("");
        formContainer.find('input[class*="autoHouse"]').val("");
    });

    $('input[class*="autoZipCode"]').keypress(function (event) {
        var formContainer = $(this).parent().parent().parent().parent();

        formContainer.find('input[class*="autoCity"]').val("");
        formContainer.find('input[class*="autoStreet"]').val("");
        formContainer.find('input[class*="autoHouse"]').val("");
    });

    //// autocomplete for layer
    $('input[class*="layerAutoStreet"]').autocomplete({
        minLength: 1, // anz
        delay: 0,
        source: function (request, response) {
            var street = $('.layerAutoStreet').val();
            var zipCode;
            var city;
            var CountryAlpha3;

            if ($('input[class*="layerAutoZipCode"]').is("input")) {
                zipCode = $('input[class*="layerAutoZipCode"]').val();
            } else {
                zipCode = $('input[class*="layerAutoZipCode"]').text();
            }

            if ($('input[class*="layerAutoCity"]').is("input")) {
                city = $('input[class*="layerAutoCity"]').val();
            } else {
                city = $('input[class*="layerAutoCity"]').text();
            }

            if ($('[ref*="autoCountryAlpha3_layer"]').is("select")) {
                CountryAlpha3 = $('[ref*="autoCountryAlpha3_layer"]').val();
            } else {
                CountryAlpha3 = $('[ref*="autoCountryAlpha3_layer"]').text();
            }
            $.ajax({
                type: "POST",
                url: "../../JS/Autocomplete.aspx/getStreetList",
                data: '{searchString: "' + street + '", ZipCode:"' + zipCode + '", City:"' + city + '", CountryAlpha3:"' + CountryAlpha3 + '"}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: "false",
                success: function (text) {
                    response(text.d);
                },
                failure: function (response) {
                    console.log("failure", response);
                    alert("Error in expanding node:" + response.d);
                }
            });
        }
    });
    $('input[class*="layerAutoCity"]').autocomplete({
        minLength: 0,
        delay: 0,
        source: function (request, response) {
            var zipCode;
            var city = "";
            var CountryAlpha3;

            if ($('input[class*="layerAutoZipCode"]').is("input")) {
                zipCode = $('input[class*="layerAutoZipCode"]').val();
            } else {
                zipCode = $('input[class*="layerAutoZipCode"]').text();
            }
            zipCode = $.trim(zipCode);

            if ($('input[class*="layerAutoCity"]').is("input")) {
                city = $('input[class*="layerAutoCity"]').val();
            } else {
                city = $('input[class*="layerAutoCity"]').text();
            }

            if ($('[ref*="autoCountryAlpha3_layer"]').is("select")) {
                CountryAlpha3 = $('[ref*="autoCountryAlpha3_layer"]').val();
            } else {
                CountryAlpha3 = $('[ref*="autoCountryAlpha3_layer"]').text();
            }

            $.ajax({
                type: "POST",
                url: "../../JS/Autocomplete.aspx/getCityList",

                data: '{ZipCode:"' + zipCode + '", City:"' + city + '", CountryAlpha3:"' + CountryAlpha3 + '"}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                cache: "false",
                success: function (text) {
                    response(text.d);
                },
                failure: function (response) {
                    console.log("failure", response);
                    alert("Error in expanding node:" + response.d);
                }
            });
        }
    }).bind('focus', function () {
        $(this).autocomplete("search");
    }).on("autocompleteselect", function (event, ui) {
        $('input[class*="layerAutoStreet"]').val("");
        $('input[class*="autoHouse_layer"]').val("");
    });

    $('input[class*="layerAutoZipCode"]').keypress(function (event) {
        $('input[class*="layerAutoCity"]').val("");
        $('input[class*="layerAutoStreet"]').val("");
        $('input[class*="autoHouse_layer"]').val("");
    });
}