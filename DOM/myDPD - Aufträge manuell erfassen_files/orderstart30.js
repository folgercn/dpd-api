//need jquery-ui

//const { error } = require("jquery");

function preRender() {
    keepAccordionStates();
    keepShoppingCartState();
    greyDisabledTextInfoI();

    showDatePicker("#txtCustomsDetails44_InvoiceDate");
    showDatePicker("#txtCustomsDetails45_InvoiceDate");
    for (var i = 1; i <= 99; i++) {
        try {
            showDatePicker("#txtArticleDataList45_ProofOfOriginDate_Article_" + i);
        }
        catch { error }
    }

    showIslandWarningDEU();
}

function showIslandWarningDEU() {
    const islandZipCodesDEU = document.getElementById("txtIslandZipCodeListDEU").value;
    var txtZipCode = document.getElementById("txtShipAddress_ZipCode");
    var selCountry = document.getElementById("CPLContentLarge_selShipAddress_Country");
    if (txtZipCode.value.length == 5 && islandZipCodesDEU.includes(txtZipCode.value) && selCountry.value == "DEU") {
        $('#divWarningIslandDEU').show();
    } else {
        $('#divWarningIslandDEU').hide();
    }
}

function keepShoppingCartState() {
    var div_ShoppingCart = document.getElementById("CPContentLarge_div_ShoppingCart");
    if (div_ShoppingCart) {
        if (div_ShoppingCart.firstElementChild.getAttribute("value") == "0") {
            div_ShoppingCart.removeAttribute("style");
            setTimeout(function () {
                document.removeEventListener("click", toggleShoppingCart, false);
            }, 1000);
        }
        if (div_ShoppingCart.firstElementChild.getAttribute("value") == "1") {
            div_ShoppingCart.style.width = "360px";
            setTimeout(function () {
                document.addEventListener("click", toggleShoppingCart, false);
            }, 1000);
        }
    }
}

function toggleShoppingCart(event) {
    if (event && event.target.id.indexOf("ShoppingCart") >= 0) {
    } else {
        var div_ShoppingCart = document.getElementById("CPLContentLarge_div_ShoppingCart");
        if (div_ShoppingCart) {
            if (div_ShoppingCart.firstElementChild.getAttribute("value") == "0") {
                div_ShoppingCart.classList.add("anim_350");
                div_ShoppingCart.style.width = "360px";
                setTimeout(function () {
                    div_ShoppingCart.classList.remove("anim_350");
                    div_ShoppingCart.firstElementChild.setAttribute("value", "1");
                    document.addEventListener("click", toggleShoppingCart, false);
                }, 360);
            }
            if (div_ShoppingCart.firstElementChild.getAttribute("value") == "1") {
                div_ShoppingCart.classList.add("anim_350");
                div_ShoppingCart.removeAttribute("style");
                setTimeout(function () {
                    div_ShoppingCart.classList.remove("anim_350");
                    div_ShoppingCart.firstElementChild.setAttribute("value", "0");
                    document.removeEventListener("click", toggleShoppingCart, false);
                }, 360);
            }
        }
    }
}

function keepAccordionStates() {
    var all_accordions = document.getElementsByClassName("header_accordion");
    var height = 0;
    for (var i = 0; i < all_accordions.length; i++) {
        var accordion_state = all_accordions[i].firstElementChild;
        var img_header_accordion = all_accordions[i].querySelector(".img_header_accordion");
        var accordion_header = all_accordions[i].querySelector(".div_accordion_header");
        if (accordion_header) {
            height = accordion_header.scrollHeight + 5;
        }
        var shortInfo = all_accordions[i].querySelector(".accordion_shortInfo");
        if (shortInfo) {
            height += shortInfo.scrollHeight;
        }
        if (accordion_state.getAttribute("Value") == "1") {
            if (shortInfo) {
                shortInfo.style.height = "0px";
            }
            if (img_header_accordion) {
                img_header_accordion.style.transform = "rotate(180deg)";
            }
            all_accordions[i].removeAttribute("style");
        }
        if (accordion_state.getAttribute("Value") == "0") {
            if (shortInfo) {
                shortInfo.style.height = shortInfo.scrollHeight + "px";
            }
            if (img_header_accordion) {
                img_header_accordion.style.transform = "rotate(0deg)";
            }
            all_accordions[i].style.overflow = "hidden";
            all_accordions[i].style.height = height + "px";
        }
    }
}

function toggleAccordion(header) {
    var height = header.scrollHeight + 5;
    var accordion = header.parentElement;
    var accordion_state = accordion.firstElementChild;
    var img_header_accordion = header.querySelector(".img_header_accordion");
    var shortInfo = accordion.querySelector(".accordion_shortInfo");
    if (shortInfo) {
        height += shortInfo.scrollHeight;
    }
    if (accordion_state.getAttribute("Value") == "0") {
        var shortInfo_height = 0;
        if (shortInfo) {
            shortInfo.style.height = "0px";
            shortInfo_height = shortInfo.scrollHeight;
        }
        if (img_header_accordion) {
            img_header_accordion.classList.add("anim_200");
            img_header_accordion.style.transform = "rotate(180deg)";
        }
        accordion.style.height = accordion.scrollHeight - shortInfo_height + "px";
        setTimeout(function () {
            img_header_accordion.classList.remove("anim_200");
            accordion.removeAttribute("style");
            accordion_state.setAttribute("Value", "1");
        }, 510);
    }
    if (accordion_state.getAttribute("Value") == "1" && event.target.id.indexOf("InfoI_Icon") == -1) {
        if (shortInfo) {
            shortInfo.style.height = shortInfo.scrollHeight + "px";
        }
        if (img_header_accordion) {
            img_header_accordion.classList.add("anim_200");
            img_header_accordion.style.transform = "rotate(0deg)";
        }
        accordion.style.height = accordion.scrollHeight + "px";
        accordion.style.overflow = "hidden";
        setTimeout(function () {
            accordion.style.height = height + "px";
        }, 10);
        setTimeout(function () {
            img_header_accordion.classList.remove("anim_200");
            accordion_state.setAttribute("Value", "0");
        }, 520);
    }

    updateLabelAddress_ShortLabel();
    updateCustomsInvoiceAddress_ShortLabel();
}


function showDatePicker(txtInput, minDate, maxDate) {
    if ($("#txtLanguage").attr("value") == "DEU") {
        $(txtInput).datepicker({
            monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            dateFormat: 'dd.mm.yy',
            showMonthAfterYear: false,
            isRTL: true,
            firstDay: 1,
            minDate: minDate,
            maxDate: maxDate,
            prevText: "",
            nextText: ""
        });
    } else {
        $("#txtCustomsDetails_InvoiceDate").datepicker({
            monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maz', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            dateFormat: 'dd.mm.yy',
            showMonthAfterYear: false,
            isRTL: true,
            firstDay: 1,
            minDate: minDate,
            maxDate: maxDate,
            prevText: "",
            nextText: ""
        });
    }

}

var PopoverClone = null;
function showPopOverInfoI(infoI) {
    if (PopoverClone) { PopoverClone.remove(); };
    var offset = infoI.offset();
    var parent = infoI.parent();
    var popover = parent.find(".popoverInfoI");
    var cssLeft = offset.left - infoI.width() + 4;
    var cssTop = offset.top + infoI.height() + 10;
    setTimeout(function () {
        PopoverClone = popover.clone()
            .css({ display: 'block', position: 'absolute', top: cssTop, left: cssLeft })
            .appendTo('body')
        $('.popOverLayer').show();
        $('.popOverLayer').click(function () {
            PopoverClone.remove();
            $('.popOverLayer').hide();
        });
    }, 150)
}

function scrollToChecked() {
    var table_wrapper = $("[id$='AddressSearch_TableWrapper']").get(0);
    var table_radios = document.getElementsByClassName("radio");
    for (var i = 0; i < table_radios.length; i++) {
        var input = table_radios[i].querySelector("input");
        if (table_wrapper && input.getAttribute("checked") == "checked") {
            table_radios[i].parentElement.style.backgroundColor = "#E6E7E8";
            table_wrapper.scrollTop = table_radios[i].offsetTop - 40;
        }
    }
}

function greyDisabledTextInfoI() {
    var textInputs = document.getElementsByClassName("lightTextbox");
    for (var i = 0; i < textInputs.length; i++) {
        if (textInputs[i].getAttribute("disabled")) {
            var InfoI = textInputs[i].parentElement.parentElement.querySelector(".divParcelInformation_InfoI");
            if (InfoI) {
                InfoI.style.opacity = "0.2";
            }
        }
    }
}

function updateParcelshopZipCode() {
    var zipcode = document.getElementById("txtShipAddress_ZipCode");
    var txtparcelshopzipcode = document.getElementById("txtService_ShopDelivery_SearchShop_ZipCode");

    if (txtparcelshopzipcode === null) {
        // do nothing
    } else {
        txtparcelshopzipcode.value = zipcode.value;
        if (zipcode.value.length < 1) { txtparcelshopzipcode.value = '' };
    }

    showIslandWarningDEU();
}

function updateLabelAddress_ShortLabel() {
    var company = document.getElementById("txtLabelAddress_Company");
    var firstname = document.getElementById("txtLabelAddress_FirstName");
    var lastname = document.getElementById("txtLabelAddress_LastName");
    var zipcode = document.getElementById("txtLabelAddress_ZipCode");
    var city = document.getElementById("txtLabelAddress_City");
    // var countryalpha3 = document.getElementById("selLabelAddress_Country");
    var shortlabel = document.getElementById("labLabelAddress_Short");
    //if (company && firstname && lastname && zipcode && city && countryalpha3 && shortlabel) {
    if (company && firstname && lastname && zipcode && city && shortlabel) {
        // var countryalpha3_value = countryalpha3.options[countryalpha3.selectedIndex].text;

        var company_firstname_divider = ', ';
        if (company.value.length < 1) { company_firstname_divider = '' };

        var firstname_lastname_divider = ' ';
        if (firstname.value.length < 1 || lastname.value < 1) { firstname_lastname_divider = '' };

        var firstname_lastname_zipcode_divider = ', ';
        if (firstname.value.length < 1 && lastname.value < 1) { firstname_lastname_zipcode_divider = '' };

        var zipcode_city_divider = ' ';
        if (zipcode.value < 1 || city.value < 1) { zipcode_city_divider = '' };

        //var city_country_divider = ', ';
        //if (city.value < 1 && zipcode.value < 1) { city_country_divider = '' };

        // shortlabel.innerHTML = company.value + company_firstname_divider + firstname.value + firstname_lastname_divider + lastname.value + firstname_lastname_zipcode_divider + zipcode.value + zipcode_city_divider + city.value + city_country_divider + countryalpha3.value + ' - ' + countryalpha3_value;
        shortlabel.innerHTML = company.value + company_firstname_divider + firstname.value + firstname_lastname_divider + lastname.value + firstname_lastname_zipcode_divider + zipcode.value + zipcode_city_divider + city.value;
        if (company.value.length < 1 && firstname.value.length < 1 && lastname.value < 1 && zipcode.value < 1 && city.value < 1) { shortlabel.innerHTML = '' };
    }
}

function updateCustomsInvoiceAddress_ShortLabel() {
    var company = document.getElementById("txtCustomsInvoiceAddress_Company");
    var firstname = document.getElementById("txtCustomsInvoiceAddress_FirstName");
    var lastname = document.getElementById("txtCustomsInvoiceAddress_LastName");
    var zipcode = document.getElementById("txtCustomsInvoiceAddress_ZipCode");
    var city = document.getElementById("txtCustomsInvoiceAddress_City");
    //var countryalpha3 = document.getElementById("selCustomsInvoiceAddress_Country");
    var shortlabel = document.getElementById("labCustomsInvoiceAddress_Short");
    //if (company && firstname && lastname && zipcode && city && countryalpha3 && shortlabel) {
    if (company && firstname && lastname && zipcode && city && shortlabel) {
        //var countryalpha3_value = countryalpha3.options[countryalpha3.selectedIndex].text;

        var company_firstname_divider = ', ';
        if (company.value.length < 1) { company_firstname_divider = '' };

        var firstname_lastname_divider = ' ';
        if (firstname.value.length < 1 || lastname.value < 1) { firstname_lastname_divider = '' };

        var firstname_lastname_zipcode_divider = ', ';
        if (firstname.value.length < 1 && lastname.value < 1) { firstname_lastname_zipcode_divider = '' };

        var zipcode_city_divider = ' ';
        if (zipcode.value < 1 || city.value < 1) { zipcode_city_divider = '' };

        //var city_country_divider = ', ';
        //if (city.value < 1 && zipcode.value < 1) { city_country_divider = '' };

        //shortlabel.innerHTML = company.value + company_firstname_divider + firstname.value + firstname_lastname_divider + lastname.value + firstname_lastname_zipcode_divider + zipcode.value + zipcode_city_divider + city.value + city_country_divider + countryalpha3.value + ' - ' + countryalpha3_value;
        shortlabel.innerHTML = company.value + company_firstname_divider + firstname.value + firstname_lastname_divider + lastname.value + firstname_lastname_zipcode_divider + zipcode.value + zipcode_city_divider + city.value;
        if (company.value.length < 1 && firstname.value.length < 1 && lastname.value < 1 && zipcode.value < 1 && city.value < 1) { shortlabel.innerHTML = '' };
    }
}

function updateLeadTimeInDaysDestinationLabel() {
    // console.log("updateLeadTimeInDaysDestinationLabel_1");

    var shipaddress_zipcode = document.getElementById("txtShipAddress_ZipCode");
    // console.log("updateLeadTimeInDaysDestinationLabel_2");

    var shipaddress_city = document.getElementById("txtShipAddress_City");
    // console.log("updateLeadTimeInDaysDestinationLabel_3");

    var prefix = "Laufzeit nach ";
    var language_alpha3 = document.getElementById("txtLanguageAlpha3");
    console.log(language_alpha3.value);
    if (language_alpha3.value != "DEU") {
        prefix = "Lead time to "
    };

    var leadtimelabel = document.getElementById("labLeadTimeInDays");
    leadtimelabel.innerHTML = prefix + shipaddress_zipcode.value + " " + shipaddress_city.value;
    //console.log(leadtimelabel.innerHTML);
}