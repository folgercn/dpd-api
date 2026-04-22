//need jquery-ui

function preRender() {
    keepAccordeonState();
    scrollToListItem();
}

function keepAccordeonState() {
    var all_accordeons = document.getElementsByClassName("divAccordeonHeader");
    for (var i = 0; i < all_accordeons.length; i++) {
        var arrow = all_accordeons[i].querySelector(".imgAccordeonArrow");
        var accordeon = document.getElementById(all_accordeons[i].getAttribute("accordeon"));
        if (accordeon && arrow) {
            if (all_accordeons[i].firstElementChild.getAttribute("value") == "expanded") {
                arrow.style.transform = "rotate(180deg)";
                accordeon.removeAttribute("style");
            }
            if (all_accordeons[i].firstElementChild.getAttribute("value") == "collapsed") {
                arrow.style.transform = "rotate(0deg)";
                accordeon.style.overflow = "hidden";
                accordeon.style.height = "0px";
            }
        }
    }
}

function switchPrintAccordeons(header) {
    //var pickup_header = document.getElementById("divPickupPrint_header");
    //var single_header = document.getElementById("divSinglePrint_header");
    var divBulkEditMask = document.getElementById("CPLContentLarge_divBulkEditMask");
    var panFilter = document.getElementById("CPLContentLarge_panFilter");
    //if (pickup_header && single_header) {
    //    var pickup_state = pickup_header.firstElementChild.getAttribute("value");
    //    var single_state = single_header.firstElementChild.getAttribute("value");
    //    if (pickup_state == "collapsed" && single_state == "expanded" ||
    //        pickup_state == "expanded" && single_state == "collapsed") {
    //        toggleAccordeon(pickup_header);
    //        toggleAccordeon(single_header);
    //    }
    //    if (pickup_state == "expanded" && single_state == "expanded") {
    //        toggleAccordeon(header);
    //    }
    //    if (pickup_state == "collapsed" && single_state == "collapsed") {
    //        toggleAccordeon(header);
    //    }
    //    if (divBulkEditMask) {
    //        setTimeout(function () {
    //            divBulkEditMask.querySelector(".closeBulk").click();
    //        }, 360);
    //    }
    //    if (panFilter) {
    //        setTimeout(function () {
    //            panFilter.querySelector(".closeLayer").click();
    //        }, 360);
    //    }
    //}
    toggleAccordeon(header);
    if (divBulkEditMask) {
        setTimeout(function () {
            divBulkEditMask.querySelector(".closeBulk").click();
        }, 360);
    }
    if (panFilter) {
        setTimeout(function () {
            panFilter.querySelector(".closeLayer").click();
        }, 360);
    }
}

function toggleAccordeon(header) {
    var arrow = header.querySelector(".imgAccordeonArrow");
    var accordeon = document.getElementById(header.getAttribute("accordeon"));
    if (accordeon && arrow) {
        if (header.firstElementChild.getAttribute("value") == "collapsed") {
            arrow.style.transform = "rotate(180deg)";
            accordeon.classList.add("anim_350");
            accordeon.style.height = accordeon.scrollHeight + "px";
            setTimeout(function () {
                header.firstElementChild.setAttribute("value", "expanded");
                accordeon.removeAttribute("style");
                accordeon.classList.remove("anim_350");
            }, 360);
        }
        if (header.firstElementChild.getAttribute("value") == "expanded") {
            arrow.style.transform = "rotate(0deg)";
            accordeon.style.height = accordeon.scrollHeight + "px";
            setTimeout(function () {
                accordeon.classList.add("anim_350");
                accordeon.style.overflow = "hidden";
                accordeon.style.height = "0px";
            }, 10);
            setTimeout(function () {
                header.firstElementChild.setAttribute("value", "collapsed");
                accordeon.classList.remove("anim_350");
            }, 360);
        }
    }
}

function copyParcelNumber(button) {
    var button_sibling = button.nextElementSibling;
    if (button_sibling) {
        var parcel_number = button_sibling.innerHTML;
        if (!navigator.clipboard) {
            var aux_input = document.createElement("input");
            aux_input.setAttribute("value", parcel_number);
            document.body.appendChild(aux_input);
            aux_input.select();
            document.execCommand("copy");
            document.body.removeChild(aux_input);
        } else {
            navigator.clipboard.writeText(parcel_number);
        }
    }
    return false;
}

function scrollToListItem() {
    //var item_index = document.getElementById("CPLContentLarge_txtHiddenRepeaterItemIndex");
    //var div_list = document.getElementById("div_list");
    //var all_list_items = document.getElementsByClassName("div_item");
    //if (item_index && div_list) {
    //    var list_offset = div_list.offsetTop;
    //    var selected_item = item_index.getAttribute("Value");
    //    if (selected_item) {
    //        selected_index = Number(selected_item);
    //        if (all_list_items[selected_index]) {
    //            var scroll_pos = all_list_items[selected_index].offsetTop - list_offset;
    //            setTimeout(function () {
    //                div_list.scrollTop = scroll_pos;
    //            }, 200);
    //        }
    //    }
    //}
}

function setAccordionViewState(repeateritemindex, visible) {
    var all_rows = document.getElementsByClassName("tbl_details_tbody_row");
    var item_row = all_rows[repeateritemindex];
    if (item_row) {
        var divRepeater = document.getElementById("CPLContentLarge_div_info_table_wrapper");  // div-Container mit Scrollbalken
        var list_offset = divRepeater.getBoundingClientRect().top;  // absolute Position
        //console.log("list_offset absol.: " + list_offset);
        //console.log("all_rows.getBoundingClientRect: " + all_rows[repeateritemindex].getBoundingClientRect().top);
        //console.log("all_rows.offsetTop: " + all_rows[repeateritemindex].offsetTop);
        //var scroll_pos = all_rows[repeateritemindex].getBoundingClientRect().top - list_offset - 35;
        var scroll_pos = all_rows[repeateritemindex].getBoundingClientRect().top - list_offset - 35;  // 35 = Höhe des Repeater Headers
        //console.log(scroll_pos);
        setTimeout(function () {
            divRepeater.scrollTop = scroll_pos;
        }, 200);

        var accordion_row = item_row.nextElementSibling;
        if (accordion_row) {
            var accordion_wrapper = accordion_row.querySelector(".div_table_status_wrapper");
            if (accordion_wrapper) {
                closeAccordions();
                if (visible == "true") {
                    var accordion_status = accordion_wrapper.querySelector(".txtHiddenKeepAccordion");
                    if (accordion_status) {
                        accordion_status.setAttribute("Value", "1");
                    }
                    accordion_row.style.display = "table-row";
                    accordion_wrapper.style.height = accordion_wrapper.scrollHeight + 5 + "px";
                    accordion_row.style.height = accordion_wrapper.scrollHeight + 5 + "px";
                    item_row.style.background = "#E6E7E8";
                    var this_row_check = item_row.querySelector(".tbl_details_tbody_check");
                    if (this_row_check) {
                        this_row_check.classList.add("bg_grey");
                    }
                    var this_row_menu = item_row.querySelector(".tbl_details_tbody_menu");
                    if (this_row_menu) {
                        this_row_menu.classList.add("grad_grey_right");
                    }
                    var number_status = item_row.querySelector(".tbl_sticky_number_status");
                    if (number_status) {
                        number_status.classList.remove("grad_white_left");
                        number_status.classList.add("grad_grey_left");
                    }
                }
            }
        }
    }
}

function closeAccordions() {
    var all_accordions = document.getElementsByClassName("txtHiddenAccordionStatus");
    var all_accordion_status = document.getElementsByClassName("txtHiddenKeepAccordion");
    var all_detail_rows = document.getElementsByClassName("tbl_details_tbody_row");
    for (var i = 0; i < all_accordion_status.length; i++) {
        var accordion = all_accordions[i].getAttribute("Value");
        var accordion_status = all_accordion_status[i].getAttribute("Value");
        if (accordion_status == "1") {
            var open_accordion_row = all_detail_rows[i].nextElementSibling;
            if (open_accordion_row) {
                var open_accordion = open_accordion_row.querySelector(".div_table_status_wrapper");
                if (open_accordion) {
                    open_accordion_row.classList.remove("anim_700");
                    open_accordion.classList.remove("anim_700");
                    open_accordion_row.style.display = "table-row";
                    open_accordion_row.style.height = open_accordion.scrollHeight + "px";
                    open_accordion.style.height = open_accordion.scrollHeight + "px";
                    if (accordion == "0") {
                        all_accordion_status[i].setAttribute("Value", "0");
                        setTimeout(function () {
                            open_accordion.classList.add("anim_700");
                            open_accordion.style.height = "0px";
                            open_accordion_row.classList.add("anim_700");
                            open_accordion_row.style.height = "0px";
                            var detail_row = open_accordion.querySelector("tbl_details_tbody_row");
                            if (detail_row) {
                                detail_row.removeAttribute("style");
                            }
                            var row_item = open_accordion.querySelector(".tbl_sticky_number_status");
                            if (row_item) {
                                row_item.classList.remove("grad_grey_left");
                                row_item.classList.add("grad_white_left");
                            }
                            var status_check = open_accordion.querySelector("tbl_details_tbody_check");
                            if (status_check) {
                                status_check.classList.remove("bg_grey");
                            }
                            var status_menu = open_accordion.querySelector("tbl_details_tbody_menu");
                            if (status_menu) {
                                status_menu.classList.remove("grad_grey_right");
                            }
                        }, 10);
                    }
                }
            }
        }
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

function showPopOver(parentElement) {
    if (PopoverClone) { PopoverClone.remove(); };
    var myOffset = parentElement.offset();
    var popover = parentElement.find(".popMoreOptions");
    var cssLeft = myOffset.left - popover.width() + parentElement.width() - 11;
    var cssTop = myOffset.top + parentElement.height() - 5;
    PopoverClone = popover.clone()
        .css({ display: 'block', position: 'absolute', top: cssTop, left: cssLeft })
        .appendTo('body');
    $('.closelayer').show();
    $('.closelayer').click(function () {
        PopoverClone.remove();
        $('.closelayer').hide();
    });
}

function sortColumns(PopoverClone) {
    var ColumnConfig = PopoverClone.find("#divColumnConfig_Wrapper");
    if (ColumnConfig.length > 0) {
        PopoverClone.css({ width: "+=32", left: "-=32" });
        ColumnConfig.children().each(function () {
            $(this).append('<div class="divDragGrip"></div>');
        })
        ColumnConfig.sortable({
            containment: PopoverClone,
            axis: "y",
            cancel: "span",
            cursorAt: { bottom: 15 },
            helper: "clone",
            scrollSpeed: 5,
            revert: true,
            start: function (e, ui) {
                ui.helper.css({
                    background: "white",
                    color: "#414042",
                    borderRadius: "5px",
                    boxShadow: "1px 2px 6px rgba(0, 0, 0, 0.3)",
                    transform: "scale(1.04)"
                });
                ui.helper.children("span").css({
                    color: "#414042"
                });
                ui.helper.children(".divDragGrip").css({
                    backgroundImage: "url('../Images/tracking30/DragGrip_Red.svg')"
                });
            }
        });
    } else {
        console.log("nein");
    }
}
//function showLoadingProgress_Accdorion(table_cell) {
//    var table_row = table_cell.parentElement;
//    if (table_row) {
//        img_LoadingProgress = table_row.querySelector(".img_LoadingProgress");
//        if (img_LoadingProgress) {
//            setTimeout(function () {
//                img_LoadingProgress.style.display = "block";
//            }, 500);
//        }
//    }
//}
//function showLoadingProgress_Columns() {
//    var img_LoadingProgress = document.getElementsByClassName("imgLoadingProgress_columns");
//    for (var i = 0; i < img_LoadingProgress.length; i++) {
//        img_LoadingProgress[i].style.display = "block";
//    }
//}
//function stopLoadingProgress() {
//    var all_LoadingProgress = document.getElementsByClassName("img_LoadingProgress");
//    for (var i = 0; i < all_LoadingProgress.length; i++) {
//        all_LoadingProgress[i].style.display = "none";
//    }
//}