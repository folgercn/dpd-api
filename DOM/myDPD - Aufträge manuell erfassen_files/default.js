////Sys.Application.add_load(ApplicationLoadHandler);
//Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(pageLoaded);
function pageLoaded(sender, args) {
    $(document).ready(function () {

        var filelist = [];  // Ein Array, das alle hochzuladenden Files enthält
        var totalSize = 0; // Enthält die Gesamtgröße aller hochzuladenden Dateien
        var totalProgress = 0; // Enthält den aktuellen Gesamtfortschritt
        var currentUpload = null; // Enthält die Datei, die aktuell hochgeladen wird

        if ($('div[ID*="panAdminDropZone"]').length === 1) {
            var isDrop = false;
            $(document).on("dragleave", function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (isDrop === false) {
                    $('div[ID*="panAdminDropZone"]').hide();
                }
                isDrop = false;
            });

            $(document).on("dragenter", function (event) {
                event.preventDefault();
                event.stopPropagation();
                $('div[ID*="panAdminDropZone"]').show();
                isDrop = true;
            });
            $("html").on("dragover", function (event) {
                event.preventDefault();
                event.stopPropagation();
            });

            $('div[ID*="panAdminDropZone"]').on("drop", function (event) {
                event.preventDefault();
                event.stopPropagation();

                for (var i = 0; i < event.originalEvent.dataTransfer.files.length; i++) {
                    filelist.push(event.originalEvent.dataTransfer.files[i]);  // Hinzufügen der Datei zur Uploadqueue
                    totalSize += event.originalEvent.dataTransfer.files[i].size;  // Hinzufügen der Dateigröße zur Gesamtgröße
                }
                if (totalSize > 0) {
                    startNextUpload();
                }
            });
        }

        function startNextUpload() {
            if (filelist.length)  // Überprüfen, ob noch eine Datei hochzuladen ist
            {
                currentUpload = filelist.shift();  // nächste Datei zwischenspeichern
                uploadFile(currentUpload);  // Upload starten
            } else {
                __doPostBack();
            }
        }

        function uploadFile(file) {
            var data = new FormData();
            data.append($("select[ID*='dropGalerieauswahl']").val() + "/" + file.name, file);
            $.ajax({
                type: "POST",
                url: "../Handler/UploadFile.ashx",
                contentType: false,
                processData: false,
                data: data,
                success: function (result) {
                    startNextUpload();
                },
                error: function () {
                    alert("There was error uploading files!");
                }
            });
        }
    });
}


function popover(parentElement, popover) {
    if (parentElement.attr("triggered") !== "true") {
        var myOffset = parentElement.offset();
        var cssLeft = myOffset.left + parentElement.width();
        var cssTop = myOffset.top - popover.outerHeight();


        if (popover.hasClass('toleft')) {
            cssLeft = myOffset.left + parentElement.width() - popover.width() - 55;
        }

        if (popover.hasClass('userIcon')) {
            cssLeft = myOffset.left + parentElement.width() - popover.width() - 15;
            cssTop = myOffset.top - popover.outerHeight() + 130;
        }

        var myPopoverClone = popover.clone()
            .css({ display: 'inline-block', position: 'absolute', top: cssTop, left: cssLeft })
            .appendTo('body');

        parentElement.attr("triggered", "true");
        parentElement.trigger("focus");

        parentElement.focusout(function () {
            setTimeout(function () {
                myPopoverClone.remove();
                parentElement.attr("triggered", "");
                parentElement.unbind('click');
            },250);
        });
    }
    parentElement.bind("click", function () {
        if (parentElement.attr("triggered") === "true") {
            myPopoverClone.remove();
            parentElement.attr("triggered", "");
        }
        parentElement.unbind('click');
    });
}
function clickpopover(parentElement, popover) {
    var myOffset = parentElement.offset();
    var cssLeft = myOffset.left + parentElement.width();
    var cssTop = myOffset.top - popover.outerHeight();

    if (popover.hasClass('toleft')) {
        cssLeft = myOffset.left + parentElement.width() - popover.width() - 55;
    }

    if (popover.hasClass('userIcon')) {
        cssLeft = myOffset.left + parentElement.width() - popover.width() - 15;
        cssTop = myOffset.top - popover.outerHeight() + 130;
    }

    var myPopoverClone = popover.clone()
        .css({ display: 'inline-block', position: 'absolute', top: cssTop, left: cssLeft })
        .appendTo('body');
    $('.closelayer').show();

    $('.closelayer').click(function () {
        myPopoverClone.remove();
        $('.closelayer').hide();
    });
}


function popoverNEW(parentElement, popover) {
    if (parentElement.attr("triggered") !== "true") {
        var myOffset = parentElement.offset();
        //var cssLeft = myOffset.left + parentElement.width();
        //var cssTop = myOffset.top - popover.outerHeight();
        var cssTop = myOffset.top + 35;
        var cssLeft = myOffset.left - 290;


        //if (popover.hasClass('toleft')) {
        //    cssLeft = myOffset.left + parentElement.width() - popover.width() - 55;
        //}

        //if (popover.hasClass('userIcon')) {
        //    cssLeft = myOffset.left + parentElement.width() - popover.width() - 15;
        //    cssTop = myOffset.top - popover.outerHeight() + 130;
        //}

        var myPopoverClone = popover.clone()
            .css({ display: 'inline-block', position: 'absolute', top: cssTop, left: cssLeft })
            .appendTo('body');

        parentElement.attr("triggered", "true");
        parentElement.attr("tabindex", "-1");
        parentElement.trigger("focus");
        
        parentElement.focusout(function () {           
            setTimeout(function () {
                myPopoverClone.remove();
                parentElement.attr("triggered", "");
                parentElement.unbind('click');
            }, 250);
        });
    }
    parentElement.bind("click", function () {
        if (parentElement.attr("triggered") === "true") {
            myPopoverClone.remove();
            parentElement.attr("triggered", "");
        }
        parentElement.unbind('click');
    });
}

function setMandatoryField(field) {
    document.getElementById('labShipAddress_Company').innerText = 'Firma';
    document.getElementById('labShipAddress_LastName').innerText = 'Nachname*';

    if (field === 'company') {
        document.getElementById('labShipAddress_Company').innerText = 'Firma*';
        document.getElementById('labShipAddress_LastName').innerText = 'Nachname';
    }
    console.log("hello");
}


function popover_avis_headline(parentElement, popover) {
    if (parentElement.attr("triggered") !== "true") {
        var myOffset = parentElement.offset();
        //var cssLeft = myOffset.left + parentElement.width();
        //var cssTop = myOffset.top - popover.outerHeight();
        var cssTop = myOffset.top + 35;
        var cssLeft = myOffset.left - 254;


        //if (popover.hasClass('toleft')) {
        //    cssLeft = myOffset.left + parentElement.width() - popover.width() - 55;
        //}

        //if (popover.hasClass('userIcon')) {
        //    cssLeft = myOffset.left + parentElement.width() - popover.width() - 15;
        //    cssTop = myOffset.top - popover.outerHeight() + 130;
        //}

        var myPopoverClone = popover.clone()
            .css({ display: 'inline-block', position: 'absolute', top: cssTop, left: cssLeft })
            .appendTo('body');

        parentElement.attr("triggered", "true");
        parentElement.attr("tabindex", "-1");
        parentElement.trigger("focus");

        parentElement.focusout(function () {
            setTimeout(function () {
                myPopoverClone.remove();
                parentElement.attr("triggered", "");
                parentElement.unbind('click');
            }, 250);
        });
    }
    parentElement.bind("click", function () {
        if (parentElement.attr("triggered") === "true") {
            myPopoverClone.remove();
            parentElement.attr("triggered", "");
        }
        parentElement.unbind('click');
    });
}

function showPopOverDownload_Avis(parentElement) {
    if (PopoverClone) {
        PopoverClone.remove();
        PopoverClone.hide();
        PopoverClone = null;
    };
    var myOffset = parentElement.offset();
    var popover = parentElement.find(".popOpenOptions_Avis");
    //var cssLeft = myOffset.left + parentElement.width() - popover.width() / 1 - 44;
    //var cssLeft = myOffset.left + parentElement.width() - popover.width() - 21;
    var cssLeft = myOffset.left + parentElement.width() - 35    ;
    var cssTop = myOffset.top + parentElement.height() / 2 + 10;

    PopoverClone = popover.clone()
        .css({ display: 'block', position: 'absolute', top: cssTop, left: cssLeft })
        .appendTo('body');
    $('.closelayer').show();
    $('.closelayer').click(function () {
        PopoverClone.remove();
        $('.closelayer').hide();
    });
}