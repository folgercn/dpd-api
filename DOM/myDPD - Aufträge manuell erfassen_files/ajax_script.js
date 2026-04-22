//Sys.Application.add_load(ApplicationLoadHandler);
Sys.WebForms.PageRequestManager.getInstance().add_endRequest(endRequest);
Sys.WebForms.PageRequestManager.getInstance().add_beginRequest(beginRequest);
Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(pageLoaded);

var OpenAccList = 0;
function beginRequest(sender, args) {
    $(".accordionBox").each(function (index) {
        //console.log($(this).find("h3"));
    });
    OpenAccList = $(".accordionBox");
    postbackElement = args.get_postBackElement();
    //console.log("postbackElement.: ", postbackElement.getAttribute("ID"));

    if (typeof myTableState !== 'undefined') {
        if (myTableState !== true) {
            myTableState = $("[ID*='panTable']").hasClass("fullSize");
        }
    } else {
        myTableState = $("[ID*='panTable']").hasClass("fullSize");
    }
}
function pageLoaded(sender, args) {
    $(document).ready(function () {
        getNewFormStyle();
    });
}
function endRequest(sender, args) {
    //console.log("CP2", $("[ID*='panTable']").hasClass("fullSize"));
    //iniAutocomplete();
    if (OpenAccList.length > 0) {
        OpenAccList.each(function (index) {
            var OldAcc = $(this);
            var NewAcc = $('#' + $(this).attr('id'));
            if (typeof NewAcc.find("h3").attr("class") !== 'undefined') {
                if (NewAcc.find("h3").attr("class") !== OldAcc.find("h3").attr("class")) {
                    if (NewAcc.find("h3").hasClass("closed")) {
                        NewAcc.find("h3").attr("class", NewAcc.find("h3").attr("class").replace("closed", "open"));
                        NewAcc.find(".boxContent").css("display", "block");
                    } else {
                        NewAcc.find("h3").attr("class", NewAcc.find("h3").attr("class").replace("open", "closed"));
                        NewAcc.find(".boxContent").css("display", "none");
                    }
                }
            }
        });
    }

    var $contactForm = $(".contactBox"),
        $dCalculator = $(".dimensionBox");

    init.slider();
    init.content($("body"));
    init.contactFormular($contactForm);
    init.dimensions($dCalculator);
    init.teaser($(".teaserBox"));
    init.deliveryTime($(".deliveryTimeBox"));
    init.depotFinder($(".depotFinderBox"));
    init.shippingGuide($(".guideBox"));
    init.error($(".loginTrackingBox"));
    init.error($(".localPartner"));
    init.error($contactForm);
    init.error($dCalculator);

    if (typeof (postbackElement) === "undefined") {
        return;
    }
    else {
        switch (true) {
            case (postbackElement.getAttribute("ID").search('btnProdOptionPaketshopZip') >= 0):
                var lat = $('input[ID*="latitude"]');
                var lng = $('input[ID*="longitude"]');
                var myLatlng = [];
                if (lat.length > 0) {
                    for (var i = 0; i < lat.length; i++) {
                        myLatlng.push({ lat: lat[i].value, lng: lng[i].value });
                    }
                    getPlace(myLatlng);
                }
                if (lat.length === 1) {
                    lat.parent().trigger('click');
                }
                break;

            case (postbackElement.getAttribute("ID").search('chkFesteAddress') >= 0):
            case (postbackElement.getAttribute("ID").search('btnAdresseSpeichern') >= 0):
            case (postbackElement.getAttribute("ID").search('btnNo') >= 0):
            case (postbackElement.getAttribute("ID").search('btnYes') >= 0):
            case (postbackElement.getAttribute("ID").search('btnNext') >= 0):

            case (postbackElement.getAttribute("ID").search('btnOK') >= 0):

            case (postbackElement.getAttribute("ID").search('chkPickupData') >= 0):
            case (postbackElement.getAttribute("ID").search('chkPickupRules') >= 0):

            case (postbackElement.getAttribute("ID").search('chkReceiverFirmaColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReceiverNameColum') >= 0):

            case (postbackElement.getAttribute("ID").search('chkSenderFirmaColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkSenderNameColum') >= 0):

            case (postbackElement.getAttribute("ID").search('chkReceiverCompanyColumn') >= 0):

            case (postbackElement.getAttribute("ID").search('chkReceiverNameColumn') >= 0):

            case (postbackElement.getAttribute("ID").search('chkSenderAdressColum_FULL') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReceiverAdressColum_FULL') >= 0):

            case (postbackElement.getAttribute("ID").search('btnMergeCancel') >= 0):
            case (postbackElement.getAttribute("ID").search('btnMergeSelectAddress') >= 0):

            case (postbackElement.getAttribute("ID").search('chkReceiverCorrectedNameColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReceiverCorrectedCompanyColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReceiverCorrectedAddressColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkRetoure_OpenReturns') >= 0):
            case (postbackElement.getAttribute("ID").search('btnAddParcel') >= 0):
            case (postbackElement.getAttribute("ID").search('btnSyncStatus') >= 0):
            case (postbackElement.getAttribute("ID").search('selUserGroup') >= 0):

            case (postbackElement.getAttribute("ID").search('selDateRangeFrom') >= 0):
            case (postbackElement.getAttribute("ID").search('selDateRangeTo') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllBetween') >= 0):
            case (postbackElement.getAttribute("ID").search('selUserGroups') >= 0):
            case (postbackElement.getAttribute("ID").search('chkShowIncorrectAdr') >= 0):
            case (postbackElement.getAttribute("ID").search('selAddressCountProPage') >= 0):
            case (postbackElement.getAttribute("ID").search('selAddressbookFilter') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllDates') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllYesterday') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllToday') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllLastWeek') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllLastMonth') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllBetween') >= 0):
            case (postbackElement.getAttribute("ID").search('selDateRangeFrom') >= 0):
            case (postbackElement.getAttribute("ID").search('selDateRangeTo') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAllMark') >= 0):
            case (postbackElement.getAttribute("ID").search('selEmployer') >= 0):
            case (postbackElement.getAttribute("ID").search('btnUpdatedDailyList') >= 0):
            case (postbackElement.getAttribute("ID").search('btnUpdatedDailyListHistory') >= 0):
            case (postbackElement.getAttribute("ID").search('selProduct') >= 0):
            case (postbackElement.getAttribute("ID").search('selOrder') >= 0):
            case (postbackElement.getAttribute("ID").search('selAdressTypes') >= 0):
            case (postbackElement.getAttribute("ID").search('selCountProPage') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDetails') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDataID') >= 0):
            case (postbackElement.getAttribute("ID").search('chkOrderbookID') >= 0):
            case (postbackElement.getAttribute("ID").search('btnSearch') >= 0):
            case (postbackElement.getAttribute("ID").search('btnResetFilter') >= 0):
            case (postbackElement.getAttribute("ID").search('selEmployer') >= 0):
            case (postbackElement.getAttribute("ID").search('selUsers') >= 0):
            case (postbackElement.getAttribute("ID").search('selUserGroups') >= 0):
            case (postbackElement.getAttribute("ID").search('btnGoBulkAction') >= 0):
            case (postbackElement.getAttribute("ID").search('btnPrint') >= 0):
            case (postbackElement.getAttribute("ID").search('btnEdit') >= 0):
            case (postbackElement.getAttribute("ID").search('btnRetoure') >= 0):
            case (postbackElement.getAttribute("ID").search('btnHaus') >= 0):
            case (postbackElement.getAttribute("ID").search('btnRoad') >= 0):
            case (postbackElement.getAttribute("ID").search('Table_btnDetails') >= 0):
            case (postbackElement.getAttribute("ID").search('btnModalClose') >= 0):
            case (postbackElement.getAttribute("ID").search('modOrderDetails_btnModalClose') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDateEntryColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkStartCloudUserIDColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDateCommissionColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkPickupDateColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReceiverAddressColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkParcelNumberColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkParcelCountColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkSendingReferenceColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkParcelReferenceColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDataSourceColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkStatusColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProduktColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProduktOptionColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkStatusDateColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDelete') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAdressreferenzColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkFirmaColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkNameColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkStrasseNrColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkZipCodeColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkCityColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkCountryColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkPhoneNumberColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkEmailColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkOrderReference1Column') >= 0):
            case (postbackElement.getAttribute("ID").search('chkOrderReference2Column') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAdressAdditionalColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkAdressTypeColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDateEntryColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProactiveNotification_NeedAction') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProactiveNotification_ToInfo') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProactiveNotification_EditedClosed') >= 0):
            case (postbackElement.getAttribute("ID").search('chkRetoure_CurrentReturns') >= 0):
            case (postbackElement.getAttribute("ID").search('chkRetoure_OrderReturn') >= 0):
            case (postbackElement.getAttribute("ID").search('Table_btnPrint') >= 0):
            case (postbackElement.getAttribute("ID").search('selUpdatedDailyListDate') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDeleteCancel') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDeleteYes') >= 0):
            case (postbackElement.getAttribute("ID").search('btnLockHead') >= 0):
            case (postbackElement.getAttribute("ID").search('btnAllCountriesToLeft') >= 0):
            case (postbackElement.getAttribute("ID").search('btnAllCountriesToRight') >= 0):
            case (postbackElement.getAttribute("ID").search('btnSetCountryToLeft') >= 0):
            case (postbackElement.getAttribute("ID").search('btnSetCountryToRight') >= 0):
            case (postbackElement.getAttribute("ID").search('btnAddNumberRange') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDeleteNumberRange2') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDeleteNumberRange3') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDeleteNumberRange4') >= 0):
            case (postbackElement.getAttribute("ID").search('btnDeleteNumberRange5') >= 0):

            case (postbackElement.getAttribute("ID").search('chkTermColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDepotColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReasonColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkStatusColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkDelisIDColumn') >= 0):

            case (postbackElement.getAttribute("ID").search('btnSave') >= 0):

            case (postbackElement.getAttribute("ID").search('chkMPSParcelNumberColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('btnCreateOrder') >= 0):
            case (postbackElement.getAttribute("ID").search('btnFontSmall') >= 0):
            case (postbackElement.getAttribute("ID").search('btnFontMiddle') >= 0):
            case (postbackElement.getAttribute("ID").search('btnFontBig') >= 0):
            case (postbackElement.getAttribute("ID").search('selCountProPage') >= 0):
            case (postbackElement.getAttribute("ID").search('btnPager') >= 0):
            case (postbackElement.getAttribute("ID").search('btnSortAscending') >= 0):
            case (postbackElement.getAttribute("ID").search('btnSortDescending') >= 0):
            case (postbackElement.getAttribute("ID").search('btnConfigureColumn') >= 0):
            case (postbackElement.getAttribute("ID").search('chkCapturesDateColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkReceiferAdressColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProduktColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkProduktOptionsColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkSenderAdressColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkParcelCountColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkShipmentRef1Colum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkParcelRefColum') >= 0):
            case (postbackElement.getAttribute("ID").search('chkSizeWeightColumn') >= 0):
                if (myTableState === true) {
                    toggleTableSize('panTable');
                }
                break;

            //case (postbackElement.getAttribute("ID").search('WithAddress') >= 0):
            //case (postbackElement.getAttribute("ID").search('btnEditSender') >= 0):
            //case (postbackElement.getAttribute("ID").search('btnEdit') >= 0):
            //    iniAutocomplete();
            //    break;
        }
    }
}

function getNewFormStyle() {
    $('.clearBtn').click(function () { clear(this); return false; });
    function clear(event) {
        var input = $(event).parent().find(':input');
        if (input.length > 0) {
            input.val("");
            input.focus();
        }
    }

    $(".lightDropDown, .darkDropDown, .tableDropDown").each(function (x, xval) {
        var myUL = $("<ul>");


        $(xval).find('option').each(function (y, yval) {
            var myLi = $('<li>');

            if ($(yval).is(':selected')) {
                myLi.attr('class', 'liSelected');
            }
            if ($(yval).val() === "") {
                myLi.hide();
            }
            //if ($(xval).hasClass("no_first_item") === false && $(xval).hasClass("dropdownWithLabel_2") === false) {
                var tooltip = yval.getAttribute("tooltip");
                if (!tooltip) {
                    tooltip = $(yval).text();
                }
                myUL.append(
                    myLi.attr("title", tooltip).append(
                        $('<span>').append($(yval).text())
                    )
                );
            //}
            //if ($(xval).hasClass("no_first_item") === true || $(xval).hasClass("dropdownWithLabel_2") === true ) {
            //    myUL.append(
            //        myLi.append(
            //            $('<span>').append($(yval).text())
            //        )
            //    );
            //    myUL.append(
            //        myLi.attr("title", tooltip).append(
            //            $('<span>').attr("class", "tooltiptext").append($(yval).text())
            //        )
            //    );
            //}

        });
        //$(xval).css("max-width", xval.offsetWidth + "px");
        $(xval).append(myUL);

        var selOption = $(xval).find('option:selected').text();
        var liChoose = $("<span>").attr('class', 'liChoose').append(selOption);
        //if (selOption.val() == -1) { liChoose.css({ "color": "#808285", "font-size": "14px" }); }
        if (selOption.toLowerCase().indexOf("bitte") > -1 ||
            selOption.toLowerCase().indexOf("wählen") > -1 ||
            selOption.toLowerCase().indexOf("please") > -1 ||
            selOption.toLowerCase().indexOf("select") > -1) {
            liChoose.css({ "color": "#808285", "font-size": "14px" });
        }
        $(xval).append(liChoose);
    });

    $('.lightDropDown li, .darkDropDown li, .tableDropDown li').click(function () {
        var myContainer = $(this).parent().parent();
        myContainer.find('option').attr('selected', false);
        myContainer.find('li').removeClass("liSelected");
        $(this).attr('class', 'liSelected');
        var thisContainer = myContainer.find('option:contains("' + $(this).text() + '")');
        myContainer.find('select').val(thisContainer.val()).change();

        myContainer.find('.liChoose').text($(this).text()).css({ "color": "#414042", "font-size": "16px" });
        if (myContainer.find('.liChoose').text().toLowerCase().indexOf("bitte") > -1 ||
            myContainer.find('.liChoose').text().toLowerCase().indexOf("wählen") > -1 ||
            myContainer.find('.liChoose').text().toLowerCase().indexOf("please") > -1 ||
            myContainer.find('.liChoose').text().toLowerCase().indexOf("select") > -1) {
            myContainer.find('.liChoose').css({ "color": "#808285", "font-size": "14px" })
        } else {
            myContainer.find('.liChoose').css({ "color": "#414042", "font-size": "16px" })
        }
        var ContainerImage = thisContainer.attr("iconimageurl");
        if (ContainerImage) {
            myContainer.find('.liChoose').css("background-image", "url('" + ContainerImage + "')");
        }
        myContainer.find('ul').hide();
        myContainer.find('liChoose').removeClass('active');
    });

    $('.lightDropDown .liChoose, .darkDropDown .liChoose, .tableDropDown .liChoose').click(function () {
        var myContainer = $(this).parent();
        var key = null;
        var key_focus = null;
        var key_multi = null;
        var key_counter = 0;
        var key_timeout;
        var all_spans = myContainer.get(0).querySelectorAll("span");
        myContainer.find('select').focus().on('keydown', function (item) {
            if (item.originalEvent.key == "Tab") {
                //console.log("Tab");
            }
            if (key_counter < 10) {
                key_counter++;
            } else {
                key_counter = 1;
                key_multi = null;
            }
            if (key_focus && item.originalEvent.key == "Enter") {
                key = "1";
                myContainer.find('select').focus().off('keydown');
                key_focus.click();
            }
            if (!key_focus && item.originalEvent.key == "Enter") {
                key = "1";
                myContainer.find('select').focus().off('keydown');
                myContainer.find('ul').toggle();
                myContainer.find('.liChoose').toggleClass('active');
            }
            if (item.originalEvent.key == "ArrowDown") {
                if (key_focus) {
                    var new_focus = $(key_focus).next().get(0);
                } else {
                    var new_focus = myContainer.find('.liSelected').next().get(0);
                }
                if (new_focus) {
                    all_spans.forEach(function (item) { item.parentElement.classList.remove("liSelected"); });
                    var spanPos = new_focus.offsetTop - 78;
                    new_focus.classList.add("liSelected");
                    key_focus = new_focus;
                    key = null;
                    myContainer.find('ul').stop(true, false);
                    myContainer.find('ul').animate({ scrollTop: spanPos }, 150);
                }
            }
            if (item.originalEvent.key == "ArrowUp") {
                if (key_focus) {
                    var new_focus = $(key_focus).prev().get(0);
                } else {
                    var new_focus = myContainer.find('.liSelected').prev().get(0);
                }
                if (new_focus) {
                    all_spans.forEach(function (item) { item.parentElement.classList.remove("liSelected"); });
                    var spanPos = new_focus.offsetTop - 78;
                    new_focus.classList.add("liSelected");
                    key_focus = new_focus;
                    key = null;
                    myContainer.find('ul').stop(true, false);
                    myContainer.find('ul').animate({ scrollTop: spanPos }, 150);
                }
            }
            if (key && key == item.originalEvent.key && key_counter < 3) {
                clearTimeout(key_timeout);
                key_counter = 0;
                key_multi = null;
                var new_focus = $(key_focus).next().get(0);
                if (new_focus) {
                    var country = new_focus.firstElementChild.innerHTML.toLowerCase().replace("ä", "a").replace("ö", "o");
                    if (country.indexOf(key) == 0) {
                        all_spans.forEach(function (item) { item.parentElement.classList.remove("liSelected"); });
                        var nextPos = new_focus.offsetTop - 78;
                        new_focus.classList.add("liSelected");
                        key_focus = new_focus;
                        key_timeout = setTimeout(function () { key = null; }, 500);
                        myContainer.find('ul').stop(true, false);
                        myContainer.find('ul').animate({ scrollTop: nextPos }, 150);
                    } else {
                        key = null;
                    }
                }
            }
            if (key && key != item.originalEvent.key && key_counter > 1) {
                clearTimeout(key_timeout);
                if (!key_multi) {
                    key_multi = key + item.originalEvent.key;
                    key = item.originalEvent.key;
                } else {
                    key_multi += item.originalEvent.key;
                    key = item.originalEvent.key;
                }
                for (var i = 0; i < all_spans.length; i++) {
                    var country = all_spans[i].innerHTML.toLowerCase();
                    if (country.indexOf(key_multi) == 0) {
                        all_spans.forEach(function (item) { item.parentElement.classList.remove("liSelected"); });
                        var spanPos = all_spans[i].parentElement.offsetTop - 78;
                        all_spans[i].parentElement.classList.add("liSelected");
                        key_focus = all_spans[i].parentElement;
                        myContainer.find('ul').stop(true, false);
                        myContainer.find('ul').animate({ scrollTop: spanPos }, 500);
                        break;
                    }
                }
                key_timeout = setTimeout(function () { key = null; key_multi = null; key_counter = 0; }, 750);
            }
            if (!key) {
                clearTimeout(key_timeout);
                key = item.originalEvent.key;
                key_counter = 1;
                for (var i = 0; i < all_spans.length; i++) {
                    var country = all_spans[i].innerHTML.toLowerCase();
                    if (country.indexOf(key) == 0) {
                        all_spans.forEach(function (item) { item.parentElement.classList.remove("liSelected"); });
                        var spanPos = all_spans[i].parentElement.offsetTop - 78;
                        all_spans[i].parentElement.classList.add("liSelected");
                        key_focus = all_spans[i].parentElement;
                        myContainer.find('ul').stop(true, false);
                        myContainer.find('ul').animate({ scrollTop: spanPos }, 500);
                        break;
                    }
                }
                key_timeout = setTimeout(function () { key = null; key_multi = null; key_counter = 0; }, 750);
            }
            return false;
        });
        myContainer.find('ul').toggle();
        var selPos = myContainer[0].querySelector('.liSelected').offsetTop - 78;
        if (selPos > 0) { myContainer.find('ul')[0].scrollTop = selPos; }
        myContainer.removeClass('eventClick');
        myContainer.find('.liChoose').toggleClass('active');
    });

    $('.lightDropDown, .darkDropDown, .tableDropDown').mousedown(function () {
        var myContainer = $(this);
        myContainer.addClass('eventClick');
    });

    $('.lightDropDown select, .darkDropDown select, .tableDropDown select').focusout(function () {
        var myContainer = $(this).parent();
        myContainer.find('select').off('keydown');
        if (myContainer.hasClass('eventClick') === false) {
            window.setTimeout(function () {
                myContainer.find('ul').hide();
                myContainer.find('.liChoose').removeClass('active');
            }, 100);
        } else {
            myContainer.removeClass('eventClick');
        }
    });

    $('.lightTime').click(function () {
        $(this).find('input').focus();
    });

    $('.lightTime input').focusin(function () {
        var myDiv = $("<div>").attr('class', 'divChooseTime');
        var myItems = $("<div>");
        var myValue = $(this).val();

        $(this).parent().find('datalist>option').each(function (x, xval) {
            var myData = $("<span>").attr('data', $(xval).val()).append(
                $(xval).text()
            );
            //console.log(myValue, ' === ', $(xval).val());
            if (myValue === $(xval).val()) {
                myData = $("<span>").attr('data', $(xval).val()).attr('class', 'active').append(
                    $(xval).text()
                );
            }

            myItems.append(myData);
        });

        $(this).parent().append(myDiv.append(myItems));

        $('.lightTime .divChooseTime span').mousedown(function () {
            $(this).parent().parent().parent().find('input').val($(this).attr("data"));
            $(this).parent().parent().parent().find('input~.timeValue').text($(this).attr("data"));
        });
    });

    $('.lightTime input').focusout(function () {
        $(this).parent().find('.divChooseTime').remove();
    });


    // MÖGLICHE <OPTION> ATTRIBUTE WERDEN AUF DIE SELECT-BOX ANGEWANDT, FALLS VORHANDEN:

    // --- iconimageurl       z.B. "../Images/countryflags/DEU.svg" (SVGs haben default ein festes Seitenverhältnis)
    // --- iconimageheight    z.B. "24" (=default falls nicht vorhanden, verändert die Zeilenhöhe im Dropdown)
    // --- iconimagewidth     z.B. "24" (=default falls nicht vorhanden, mit "left" oder "right" wird der Text eingerückt)
    // --- iconimageposition  z.B. "left", "right" oder "center" ("left" falls nicht vorhanden, bei "center" hinter dem Text)

    // --- backgroundcolor    z.B. "#ffffff", "rgba(255,255,255,1)" oder "white"
    // --- textcolor          z.B. "#dc0032" (Farben können unabhängig ohne Icon gesetzt werden)

    var all_selects = document.getElementsByTagName("select");
    for (var i = 0; i < all_selects.length; i++) {
        var option_list = all_selects[i].parentElement.querySelector("ul");
        var option_select = all_selects[i].parentElement.querySelector(".liChoose");
        if (option_list && option_select) {
            var all_items = option_list.querySelectorAll("li");
            var all_options = all_selects[i].querySelectorAll("option");
            if (all_options.length == all_items.length) {
                for (var j = 0; j < all_items.length; j++) {
                    all_items[j].style.margin = "0px";
                    all_items[j].style.paddingLeft = "0px";
                    all_items[j].style.paddingRight = "0px";
                    var textLabel = all_items[j].querySelector("span");
                    if (textLabel) {
                        textLabel.style.padding = "0px 10px";
                    }
                    var textcolor = all_options[j].getAttribute("textcolor");
                    if (textcolor) {
                        all_items[j].style.color = textcolor;
                    }
                    var backgroundcolor = all_options[j].getAttribute("backgroundcolor");
                    if (backgroundcolor) {
                        all_items[j].style.backgroundColor = backgroundcolor;
                    }
                    var iconimageurl = all_options[j].getAttribute("iconimageurl");
                    if (iconimageurl) {
                        all_items[j].style.backgroundImage = "url('" + iconimageurl + "')";
                        all_items[j].style.backgroundSize = "24px 24px";
                        all_items[j].style.backgroundRepeat = "no-repeat";
                        all_items[j].style.backgroundPositionY = "center";
                        var iconimageposition = all_options[j].getAttribute("iconimageposition");
                        if (!iconimageposition || iconimageposition == "left") {
                            all_items[j].style.backgroundPositionX = "5px";
                            all_items[j].style.paddingLeft = "24px";
                        } else {
                            all_items[j].style.backgroundPositionX = iconimageposition;
                        }
                        if (iconimageposition == "right") {
                            all_items[j].style.backgroundPositionX = "calc(100% - 5px)";
                            all_items[j].style.paddingRight = "24px";
                        }
                        var iconimageheight = all_options[j].getAttribute("iconimageheight");
                        if (iconimageheight) {
                            all_items[j].style.lineHeight = iconimageheight + "px";
                            all_items[j].style.paddingTop = "5px";
                            all_items[j].style.paddingBottom = "5px";
                            all_items[j].style.backgroundSize = "24px " + iconimageheight + "px";
                        }
                        var iconimagewidth = all_options[j].getAttribute("iconimagewidth");
                        if (iconimagewidth) {
                            all_items[j].style.paddingLeft = iconimagewidth + "px";
                            if (iconimageposition == "left") {
                                all_items[j].style.backgroundPositionX = "5px";
                                all_items[j].style.paddingRight = "0px";
                            }
                            if (iconimageposition == "right") {
                                all_items[j].style.backgroundPositionX = "calc(100% - 5px)";
                                all_items[j].style.paddingLeft = "0px";
                                all_items[j].style.paddingRight = iconimagewidth + "px";
                            }
                            if (iconimageposition == "center") {
                                all_items[j].style.paddingLeft = "0px";
                            }
                            if (iconimageheight) {
                                all_items[j].style.backgroundSize = iconimagewidth + "px " + iconimageheight + "px";
                            } else {
                                all_items[j].style.backgroundSize = iconimagewidth + "px 24px";
                            }
                        }
                    }
                    var selected = all_options[j].getAttribute("selected");
                    if (selected) {
                        var textcolor = all_options[j].getAttribute("textcolor");
                        if (textcolor) {
                            option_select.style.color = textcolor;
                        }
                        var backgroundcolor = all_options[j].getAttribute("backgroundcolor");
                        if (backgroundcolor) {
                            option_select.style.backgroundColor = backgroundcolor;
                        }
                        if (iconimageurl) {
                            option_select.style.backgroundImage = "url('" + iconimageurl + "')";
                            option_select.style.backgroundSize = "24px 24px";
                            option_select.style.backgroundRepeat = "no-repeat";
                            option_select.style.backgroundPositionY = "center";
                            if (!iconimageposition || iconimageposition == "left") {
                                option_select.style.backgroundPositionX = "5px";
                                option_select.style.paddingLeft = 24 + 10 + "px";
                            } else {
                                option_select.style.backgroundPositionX = iconimageposition;
                            }
                            if (iconimageposition == "right") {
                                option_select.style.backgroundPositionX = "calc(100% - 40px)";
                                option_select.style.paddingRight = 24 + 45 + "px";
                            }
                            if (iconimageheight) {
                                option_select.style.backgroundSize = "24px " + iconimageheight + "px";
                            }
                            if (iconimagewidth) {
                                option_select.style.paddingLeft = Number(iconimagewidth) + 10 + "px";
                                if (iconimageposition == "left") {
                                    option_select.style.backgroundPositionX = "5px";
                                }
                                if (iconimageposition == "right") {
                                    option_select.style.backgroundPositionX = "calc(100% - 40px)";
                                    option_select.style.paddingRight = Number(iconimagewidth) + 10 + 35 + "px";
                                    option_select.style.paddingLeft = "10px";
                                }
                                if (iconimageposition == "center") {
                                    option_select.style.paddingLeft = "10px";
                                }
                                if (iconimageheight) {
                                    option_select.style.backgroundSize = iconimagewidth + "px " + iconimageheight + "px";
                                } else {
                                    option_select.style.backgroundSize = iconimagewidth + "px 24px";

                                }
                            }
                        }
                    }
                }
            }
            if (option_select.offsetWidth < option_select.scrollWidth) {
                var select_tooltip = document.createElement("span");
                select_tooltip.classList.add("lab_tooltip", "dropdown");
                select_tooltip.innerHTML = option_select.innerHTML;
                option_select.parentElement.classList.add("pan_tooltip");
                option_select.parentElement.appendChild(select_tooltip);
            }
        }
        if (all_selects[i].getAttribute("disabled")) {
            if (option_select) {
                option_select.classList.add("disabled");
            }
            if (option_list) {
                option_list.style.visibility = "hidden";
            }
        }
    }
}