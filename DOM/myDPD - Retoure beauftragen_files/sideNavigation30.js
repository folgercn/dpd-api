/* sideNavigation30.js - MyDPD Inkrement 3 */

function SideNaviPageLoad() {
    var div_sidebar = document.getElementById("div_sidebar");
    if (div_sidebar) {
        keepSideNavStatus();
        refreshSideNavFooter();
        updateLayout();
    }
}

function keepSideNavStatus() {
    var div_sidebar = document.getElementById("div_sidebar");
    var divMasterBody = document.getElementById("divMasterBody");
    var lab_sidebar_tooltip = document.getElementsByClassName("lab_sidebar_tooltip");
    var txtHidden_SideNavStatus = document.getElementById("txtHidden_SideNavStatus");
    if (txtHidden_SideNavStatus) {
        var sideNavStatus = txtHidden_SideNavStatus.getAttribute("Value");
    }
    if (div_sidebar && divMasterBody) {
        var sidebar_shrink = div_sidebar.querySelector("#div_sidebar_shrink");
        var sidebar_arrow = div_sidebar.querySelector("#div_sidebar_arrow");
        var sidebar_labels = document.getElementsByClassName("div_sidebar_label");
        var sidebar_menus = document.getElementsByClassName("div_sidebar_menu");
        var sidebar_image = document.getElementsByClassName("img_sidebar_menu");
        var divBulkEditMask = document.getElementById("CPLContentLarge_divBulkEditMask");
        if (sideNavStatus == "1") {
            div_sidebar.classList.remove("expanded");
            divMasterBody.style.marginLeft = "75px";
            if (divBulkEditMask) {
                divBulkEditMask.style.width = "calc(100% - 95px)";
            }
            for (var i = 0; i < sidebar_menus.length; i++) {
                sidebar_menus[i].classList.remove("expanded");
                var submenus = sidebar_menus[i].getAttribute("submenus");
                if (submenus) {
                    sidebar_menus[i].removeAttribute("style");
                    sidebar_image[i].removeAttribute("style");
                }
            }
            for (var i = 0; i < sidebar_labels.length; i++) {
                sidebar_labels[i].removeAttribute("style");
            }
            for (var i = 0; i < lab_sidebar_tooltip.length; i++) {
                lab_sidebar_tooltip[i].classList.remove("anim_200");
            }
            if (sidebar_shrink) {
                sidebar_shrink.classList.remove("anim_200");
            }
            if (sidebar_arrow) {
                sidebar_arrow.style.transform = "rotate(-180deg)";
            }
            setTimeout(function () {
                for (var i = 0; i < lab_sidebar_tooltip.length; i++) {
                    lab_sidebar_tooltip[i].style.display = "block";
                    lab_sidebar_tooltip[i].classList.add("anim_200");
                }
                if (sidebar_shrink) {
                    sidebar_shrink.classList.add("anim_200");
                }
                if (sidebar_arrow) {
                    sidebar_arrow.classList.add("anim_350");
                }
            }, 100);
        }
        if (sideNavStatus == "0") {
            div_sidebar.classList.add("expanded");
            divMasterBody.style.marginLeft = "320px";
            if (divBulkEditMask) {
                divBulkEditMask.style.width = "calc(100% - 340px)";
            }
            for (var i = 0; i < sidebar_menus.length; i++) {
                sidebar_menus[i].classList.add("expanded");
                var submenus = sidebar_menus[i].getAttribute("submenus");
                if (submenus) {
                    var subitems = Number(submenus);
                    sidebar_menus[i].style.height = 60 + (subitems * 30) + "px";
                    sidebar_image[i].style.height = 60 + (subitems * 30) + "px";
                }
            }
            for (var i = 0; i < lab_sidebar_tooltip.length; i++) {
                lab_sidebar_tooltip[i].classList.remove("anim_200");
                lab_sidebar_tooltip[i].style.display = "none";
            }
            if (sidebar_shrink) {
                sidebar_shrink.classList.remove("anim_200");
            }
            if (sidebar_arrow) {
                sidebar_arrow.removeAttribute("style");
            }
            setTimeout(function () {
                for (var i = 0; i < sidebar_labels.length; i++) {
                    sidebar_labels[i].style.display = "inline-block";
                }
                if (sidebar_shrink) {
                    sidebar_shrink.classList.add("anim_200");
                }
                if (sidebar_arrow) {
                    sidebar_arrow.classList.add("anim_350");
                }
            }, 20);
        }
    }
}

function toggleSideNav() {
    var div_sidebar = document.getElementById("div_sidebar");
    var divMasterBody = document.getElementById("divMasterBody");
    var lab_sidebar_tooltip = document.getElementsByClassName("lab_sidebar_tooltip");
    var txtHidden_SideNavStatus = document.getElementById("txtHidden_SideNavStatus");
    if (txtHidden_SideNavStatus) {
        var sideNavStatus = txtHidden_SideNavStatus.getAttribute("Value");
    }
    if (div_sidebar && divMasterBody) {
        var sidebar_shrink = div_sidebar.querySelector("#div_sidebar_shrink");
        var sidebar_arrow = div_sidebar.querySelector("#div_sidebar_arrow");
        var sidebar_labels = document.getElementsByClassName("div_sidebar_label");
        var sidebar_menus = document.getElementsByClassName("div_sidebar_menu");
        var sidebar_image = document.getElementsByClassName("img_sidebar_menu");
        var divBulkEditMask = document.getElementById("CPLContentLarge_divBulkEditMask");
        if (sideNavStatus == "0") {
            txtHidden_SideNavStatus.setAttribute("Value", "2");
            div_sidebar.classList.add("anim_350");
            divMasterBody.classList.add("anim_350");
            div_sidebar.classList.remove("expanded");
            divMasterBody.style.margin = "65px 20px 110px 75px";
            if (divBulkEditMask) {
                divBulkEditMask.classList.add("anim_350");
                divBulkEditMask.style.width = "calc(100% - 95px)";
            }
            for (var i = 0; i < sidebar_menus.length; i++) {
                sidebar_menus[i].classList.add("anim_350");
                sidebar_menus[i].classList.remove("expanded");
                var submenus = sidebar_menus[i].getAttribute("submenus");
                if (submenus) {
                    sidebar_menus[i].removeAttribute("style");
                    sidebar_image[i].removeAttribute("style");
                }
            }
            for (var i = 0; i < lab_sidebar_tooltip.length; i++) {
                lab_sidebar_tooltip[i].style.display = "block";
            }
            for (var i = 0; i < sidebar_labels.length; i++) {
                sidebar_labels[i].removeAttribute("style");
            }
            if (sidebar_shrink) {
                sidebar_shrink.classList.remove("anim_200");
            }
            if (sidebar_arrow) {
                sidebar_arrow.style.transform = "rotate(-180deg)";
            }
            setTimeout(function () {
                div_sidebar.classList.remove("anim_350");
                divMasterBody.classList.remove("anim_350");
                if (divBulkEditMask) {
                    divBulkEditMask.classList.remove("anim_350");
                }
                for (var i = 0; i < sidebar_menus.length; i++) {
                    sidebar_menus[i].classList.remove("anim_350");
                }
                for (var i = 0; i < lab_sidebar_tooltip.length; i++) {
                    lab_sidebar_tooltip[i].classList.add("anim_200");
                }
                if (sidebar_shrink) {
                    sidebar_shrink.classList.add("anim_200");
                }
                txtHidden_SideNavStatus.setAttribute("Value", "1");
            }, 360);
        }
        if (sideNavStatus == "1") {
            txtHidden_SideNavStatus.setAttribute("Value", "2");
            div_sidebar.classList.add("anim_350");
            divMasterBody.classList.add("anim_350");
            div_sidebar.classList.add("expanded");
            divMasterBody.style.margin = "65px 20px 110px 320px";
            if (divBulkEditMask) {
                divBulkEditMask.classList.add("anim_350");
                divBulkEditMask.style.width = "calc(100% - 340px)";
            }
            for (var i = 0; i < sidebar_menus.length; i++) {
                sidebar_menus[i].classList.add("anim_350");
                sidebar_menus[i].classList.add("expanded");
                var submenus = sidebar_menus[i].getAttribute("submenus");
                if (submenus) {
                    var subitems = Number(submenus);
                    sidebar_menus[i].style.height = 60 + (subitems * 30) + "px";
                    sidebar_image[i].style.height = 60 + (subitems * 30) + "px";
                }
            }
            for (var i = 0; i < lab_sidebar_tooltip.length; i++) {
                lab_sidebar_tooltip[i].style.display = "none";
            }
            if (sidebar_shrink) {
                sidebar_shrink.classList.remove("anim_200");
            }
            if (sidebar_arrow) {
                sidebar_arrow.removeAttribute("style");
            }
            setTimeout(function () {
                div_sidebar.classList.remove("anim_350");
                divMasterBody.classList.remove("anim_350");
                if (divBulkEditMask) {
                    divBulkEditMask.classList.remove("anim_350");
                }
                for (var i = 0; i < sidebar_menus.length; i++) {
                    sidebar_menus[i].classList.remove("anim_350");
                }
                for (var i = 0; i < sidebar_labels.length; i++) {
                    sidebar_labels[i].style.display = "inline-block";
                }
                if (sidebar_shrink) {
                    sidebar_shrink.classList.add("anim_200");
                }
                txtHidden_SideNavStatus.setAttribute("Value", "0");
            }, 360);
        }
    }
}

var sidebarInterval = null;
function refreshSideNavFooter() {
    var sidebar_shrink = document.getElementById("div_sidebar_shrink");
    if (sidebar_shrink) {
        clearInterval(sidebarInterval);
        sidebarInterval = setInterval(keepSideNavFooter, 500);
    }
}

function keepSideNavFooter() {
    var sidebar_shrink = document.getElementById("div_sidebar_shrink");
    var scroll_doc = document.documentElement;
    var scroll_pos = scroll_doc.scrollHeight - scroll_doc.scrollTop - scroll_doc.clientHeight;
    if (scroll_pos < 90) {
        sidebar_shrink.style.bottom = 95 - scroll_pos + "px";
    } else {
        sidebar_shrink.style.bottom = 10 + "px";
    }
}


function updateLayout() {
    //adjust old layouts to fit SideNavigation

    var SCContainer = document.querySelector(".SCContainer");
    if (SCContainer) {
        //console.log(1, ".SCContainer");
        SCContainer.style.border = "none";
    }

    var sidebarContent = document.querySelector(".sidebarContent");
    if (sidebarContent) {
        //console.log(1, ".sidebarContent");
        sidebarContent.style.background = "none";
        sidebarContent.style.width = "100%";
        sidebarContent.style.height = "auto";
    }

    var oneRowContent = document.querySelectorAll(".oneRowContent");
    for (var i = 0; i < oneRowContent.length; i++) {
        //console.log(i + 1, ".oneRowContent");
        oneRowContent[i].style.width = "100%";
        oneRowContent[i].style.padding = "0px";
        oneRowContent[i].style.margin = "0px";
    }

    var twoRowContent = document.querySelector(".twoRowContent");
    if (twoRowContent) {
        //console.log(1, ".twoRowContent");
        twoRowContent.style.maxWidth = "1120px";
        twoRowContent.style.padding = "0px";
        twoRowContent.style.marginLeft = "auto";
        twoRowContent.style.marginRight = "auto";
        twoRowContent.style.display = "block";
    }

    var divMain = document.getElementById("CPLContentLarge_divMain");
    if (divMain) {
        //console.log(1, "#CPLContentLarge_divMain");
        divMain.style.width = "calc(100% - 40px)";
        divMain.style.paddingBottom = "20px";
        divMain.style.backgroundColor = "white";
        divMain.style.padding = "10px 20px 20px 20px";
    }

    var updateShippingMaterial = document.getElementById("CPLContentLarge_updateShippingMaterial");
    if (updateShippingMaterial) {
        //console.log(1, "#CPLContentLarge_updateShippingMaterial");
        updateShippingMaterial.style.width = "930px";
        updateShippingMaterial.style.marginRight = "auto";
        updateShippingMaterial.style.marginLeft = "auto";
    }

    var updateAddressbook = document.getElementById("CPLContentLarge_updateAddressbook");
    var sidebarContent_warenkorb = document.getElementById("sidebarContent_warenkorb");
    if (updateAddressbook) {
        //console.log(1, "#CPLContentLarge_updateAddressbook");
        updateAddressbook.style.paddingBottom = "20px";
        updateAddressbook.style.backgroundColor = "white";
        updateAddressbook.style.padding = "0px 20px 20px 20px";
        if (sidebarContent_warenkorb) {
            //console.log(1, "#CPLContentLarge_updateAddressbook", "#sidebarContent_warenkorb");
            updateAddressbook.style.backgroundColor = "";
            updateAddressbook.style.width = "930px";
            updateAddressbook.style.marginRight = "auto";
            updateAddressbook.style.marginLeft = "auto";
        }
    }

    var updatePanelStartOrder = document.getElementById("CPLContentLarge_updatePanelStartOrder");
    if (updatePanelStartOrder) {
        //console.log(1, "#CPLContentLarge_updatePanelStartOrder");
        updatePanelStartOrder.style.backgroundColor = "white";
        updatePanelStartOrder.style.padding = "0px 20px 20px 20px";
        updatePanelStartOrder.style.maxWidth = "930px";
        updatePanelStartOrder.style.marginLeft = "auto";
        updatePanelStartOrder.style.marginRight = "auto";
        updatePanelStartOrder.style.display = "block";
    }

    var panUpdate = document.getElementById("CPLContentLarge_panUpdate");
    if (panUpdate) {
        //console.log(1, "#CPLContentLarge_panUpdate");
        panUpdate.style.maxWidth = "820px";
        panUpdate.style.marginLeft = "auto";
        panUpdate.style.marginRight = "auto";
    }

    var UpdatePanel1 = document.getElementById("CPLContentLarge_UpdatePanel1");
    if (UpdatePanel1) {
        //console.log(1, "#CPLContentLarge_UpdatePanel1");
        UpdatePanel1.style.backgroundColor = "white";
        UpdatePanel1.style.padding = "0px 20px 20px 20px";
        UpdatePanel1.style.maxWidth = "1120px";
        UpdatePanel1.style.marginLeft = "auto";
        UpdatePanel1.style.marginRight = "auto";
        UpdatePanel1.style.display = "block";
    }

    var UpdatePanel1200 = document.getElementById("CPLContentLarge_UpdatePanel1200");
    if (UpdatePanel1200) {
        //console.log(1, "#CPLContentLarge_UpdatePanel1");
        UpdatePanel1200.style.backgroundColor = "white";
        UpdatePanel1200.style.padding = "0px 20px 20px 20px";
        UpdatePanel1200.style.maxWidth = "1160px";
        UpdatePanel1200.style.marginLeft = "auto";
        UpdatePanel1200.style.marginRight = "auto";
        UpdatePanel1200.style.display = "block";
    }

    var pan11 = document.getElementById("CPLContentLarge_pan11");
    if (pan11) {
        //console.log(1, "#CPLContentLarge_pan11");
        pan11.style.marginLeft = "auto";
        pan11.style.marginRight = "auto";
        pan11.style.maxWidth = "1120px";
    }

    var panOrderOverview = document.getElementById("CPLContentLarge_panOrderOverview");
    if (panOrderOverview) {
        //console.log(1, "#CPLContentLarge_panOrderOverview");
        panOrderOverview.backgroundColor = "white";
        panOrderOverview.style.padding = "0px 20px 20px 20px";
        panOrderOverview.style.marginLeft = "auto";
        panOrderOverview.style.marginRight = "auto";
        panOrderOverview.style.maxWidth = "1120px";
    }

    var updateOrderbook = document.getElementById("CPLContentLarge_updateOrderbook");
    if (updateOrderbook) {
        //console.log(1, "#CPLContentLarge_updateOrderbook");
        updateOrderbook.style.backgroundColor = "white";
        updateOrderbook.style.padding = "0px 20px 20px 20px";
        updateOrderbook.style.marginLeft = "auto";
        updateOrderbook.style.marginRight = "auto";
        updateOrderbook.style.maxWidth = "100%";
    }

    var upMeinKonto = document.getElementById("CPLContentLarge_upMeinKonto");
    var sidebarContent_kontakt = document.getElementById("sidebarContent_kontakt");
    if (upMeinKonto) {
        //console.log(1, "#CPLContentLarge_upMeinKonto");
        upMeinKonto.style.padding = "0px 20px 20px 20px";
        upMeinKonto.style.marginLeft = "auto";
        upMeinKonto.style.marginRight = "auto";
        upMeinKonto.style.maxWidth = "1120px";
        if (sidebarContent_kontakt) {
            //console.log(1, "#CPLContentLarge_upMeinKonto", "#sidebarContent_kontakt");
            upMeinKonto.style.maxWidth = "820px";
        }
    }

    var all_whiteBoxContent = document.getElementsByClassName("whiteBoxContent");
    for (var i = 0; i < all_whiteBoxContent.length; i++) {
        //console.log(i + 1, ".whiteBoxContent");
        all_whiteBoxContent[i].style.maxWidth = "930px";
        all_whiteBoxContent[i].style.marginLeft = "auto";
        all_whiteBoxContent[i].style.marginRight = "auto";
        all_whiteBoxContent[i].style.paddingBottom = "20px";
        all_whiteBoxContent[i].style.display = "block";
    }

    var addressbookselect = document.querySelector(".whiteBoxContent.addressbookselect");
    if (addressbookselect) {
        //console.log(1, ".whiteBoxContent.addressbookselect");
        addressbookselect.style.maxWidth = "1050px";
    }

    var div_wrapper = document.getElementById("div_wrapper");
    if (div_wrapper) {
        //console.log(1, "#div_wrapper");
        div_wrapper.style.backgroundColor = "white";
        div_wrapper.style.padding = "20px 20px 20px 20px";
        div_wrapper.style.width = "auto";
        div_wrapper.style.maxWidth = "930px";
        div_wrapper.style.marginLeft = "auto";
        div_wrapper.style.marginRight = "auto";
        div_wrapper.style.display = "block";
    }

    var div_wrapper_groupEdit = document.getElementById("div_wrapper_groupEdit");
    if (div_wrapper_groupEdit) {
        //console.log(1, "#div_wrapper_groupEdit");
        div_wrapper_groupEdit.style.display = "block";
        div_wrapper_groupEdit.style.width = "916px";
        div_wrapper_groupEdit.style.marginLeft = "auto";
        div_wrapper_groupEdit.style.marginRight = "auto";
    }

    var divHeader = document.getElementById("CPLContentLarge_divHeader");
    if (divHeader) {
        //console.log(1, "#CPLContentLarge_divHeader");
        divHeader.style.padding = "10px 20px 20px 20px";
        divHeader.style.width = "calc(100% - 40px)";
    }

    var divUserList = document.getElementById("CPLContentLarge_divUserList");
    if (divUserList) {
        //console.log(1, "#CPLContentLarge_divUserList");
        divUserList.style.margin = "20px 0px 0px 0px";
        divUserList.style.padding = "10px 20px 15px 20px";
        divUserList.style.width = "calc(100% - 40px)";
    }

    var divProductsAndServices = document.getElementById("CPLContentLarge_divProductsAndServices");
    if (divProductsAndServices) {
        //console.log(1, "#CPLContentLarge_divProductsAndServices");
        divProductsAndServices.style.padding = "0px 20px 20px 20px";
        divProductsAndServices.style.margin = "15px 0px 0px 0px";
        divProductsAndServices.style.width = "auto";
    }

    var div_wrapper_address = document.getElementById("div_wrapper_address");
    if (div_wrapper_address) {
        //console.log(1, "#div_wrapper_address");
        div_wrapper_address.style.backgroundColor = "white";
        div_wrapper_address.style.padding = "20px 20px 80px 20px";
        div_wrapper_address.style.width = "auto";
        div_wrapper_address.style.maxWidth = "930px";
        div_wrapper_address.style.marginLeft = "auto";
        div_wrapper_address.style.marginRight = "auto";
        div_wrapper_address.style.display = "block";
    }

    var panPrintDone = document.getElementById("CPLContentLarge_panPrintDone");
    if (panPrintDone) {
        //console.log(1, "#CPLContentLarge_panPrintDone");
        panPrintDone.style.background = "white";
        panPrintDone.style.width = "932px";
        panPrintDone.style.padding = "10px 20px";
        panPrintDone.style.margin = "0px auto";
    }

    /* adjust legacy table layout */
    var btnTableMaximizeMinimize = document.getElementById("btnTableMaximizeMinimize");
    if (btnTableMaximizeMinimize) {
        //console.log(1, "#btnTableMaximizeMinimize");
        btnTableMaximizeMinimize.style.display = "none";
    }

    var CPLContentLarge_panTable = document.getElementById("CPLContentLarge_panTable");
    if (CPLContentLarge_panTable) {
        //console.log(1, "#CPLContentLarge_panTable");
        CPLContentLarge_panTable.style.width = "100%";
    }

    var dpdTable = document.querySelector(".dpdTable");
    if (dpdTable) {
        //console.log(1, ".dpdTable");
        dpdTable.style.width = "calc(100% - 1px)";
    }

    /* adjust old table layout */
    var divScrollContainerTable = document.getElementById("CPLContentLarge_divScrollContainerTable");
    if (divScrollContainerTable) {
        //console.log(1, "#CPLContentLarge_divScrollContainerTable");
        divScrollContainerTable.style.maxHeight = "100%";
        divScrollContainerTable.style.width = "100%";
        var selboxStockDPDStyle = document.querySelectorAll(".selboxStockDPDStyle");
        for (var i = 0; i < selboxStockDPDStyle.length; i++) {
            //console.log(i + 1, ".selboxStockDPDStyle");
            selboxStockDPDStyle[i].style.width = "calc(100% - 10px)";
        }
        var editTextbox = document.querySelectorAll(".editTextbox");
        for (var i = 0; i < editTextbox.length; i++) {
            //console.log(i + 1, ".editTextbox");
            editTextbox[i].style.width = "100%";
        }
    }

    /* center modal-dialog */
    var modalDialog = document.querySelector(".modal-dialog");
    if (modalDialog) {
        //console.log(1, ".modal-dialog");
        modalDialog.style.display = "flex";
        modalDialog.style.flexFlow = "column";
        modalDialog.style.alignItems = "center";
        modalDialog.style.justifyContent = "space-around";
        var modalContent = document.querySelector(".modal-content");
        if (modalContent) {
            //console.log(1, ".modal-dialog", ".modal-content");
            modalContent.style.margin = "65px 0px 0px 0px";
            modalContent.style.maxHeight = "calc(100% - 65px)";
        }
        var modalFooter = document.querySelector(".modal-footer");
        if (modalFooter) {
            //console.log(1, ".modal-dialog", ".modal-footer");
            modalFooter.style.display = "none";
        }
    }

    //adjust old Profile Bulk EditMask
    var divBulkEditMask = document.getElementById("CPLContentLarge_divBulkEditMask");
    if (divBulkEditMask && divBulkEditMask.nextElementSibling.id == "CPLContentLarge_divMain") {
        //console.log(1, "#CPLContentLarge_divBulkEditMask", "#CPLContentLarge_divMain");
        divBulkEditMask.style.position = "fixed";
        divBulkEditMask.style.top = "66px";
        divBulkEditMask.style.border = "1px solid #CAC4BE";
        divBulkEditMask.style.boxSizing = "border-box";
    }


    /* adjust old black Cookie Banner overlay */
    var panCookieRequest = document.getElementById("modHeader_panCookieRequest");
    if (panCookieRequest) {
        //console.log(1, "#modHeader_panCookieRequest");
        panCookieRequest.style.position = "absolute";
        panCookieRequest.style.zIndex = "1001";
        var modalDialog = document.querySelector(".modal-dialog");
        if (modalDialog) {
            //console.log(1, "#modHeader_panCookieRequest", "#modHeader_panCookieRequest");
            modalDialog.style.marginTop = "50px";
        }
        var MasterBody = document.getElementById("divMasterBody");
        if (MasterBody) {
            //console.log(1, "#modHeader_panCookieRequest", "#divMasterBody");
            MasterBody.style.paddingTop = "50px";
        }
        var sidebar = document.getElementById("div_sidebar");
        if (sidebar) {
            //console.log(1, "#modHeader_panCookieRequest", "#div_sidebar");
            sidebar.style.top = "115px";
        }
        var firstNav = document.getElementById("div_firstNav");
        if (firstNav) {
            //console.log(1, "#modHeader_panCookieRequest", "#div_firstNav");
            firstNav.style.top = "50px";
        }
        var divBulkEditMask = document.getElementById("CPLContentLarge_divBulkEditMask");
        if (divBulkEditMask) {
            //console.log(1, "#modHeader_panCookieRequest", "#CPLContentLarge_divBulkEditMask");
            divBulkEditMask.style.top = "116px";
        }
    }
}