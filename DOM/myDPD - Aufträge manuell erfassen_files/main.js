
window.init = (function () {

    init = {};
    init.side = {};
    init.content = {};
    init.footer = {};
    init.utils = {};

    init.slider = function () {
        var $slider = $(".slider");

        if ($slider.length == 0) { return; }

        var sliderConfslide = {
            mode: 'fade',
            animationTime: 2000,
            delay: 12000,
            delayBeforeAnimate: 1,
            autoPlay: true,
            enableStartStop: false,
            expand: true,
            hashTags: false,
            resizeContents: true,
            buildNavigation: true,
            buildArrows: false,
            pauseOnHover: false
        };
        var sliderConffade = $.extend({}, sliderConfslide, { mode: 'fade', animationTime: 1500, delay: 5000, resizeContents: false });

        $slider.each(function () {
            $(this).anythingSlider(eval('sliderConf' + $(this).data('effect')));
        });

    };

    init.content = function ($container) {
        var $content = $container.find('.breakingNewsBox'),
            speed = 500,
            cookie,
            time = new Date(),
            futureTime = new Date();

        futureTime.setDate(futureTime.getDate() + 1);
        futureTime.setHours(0);
        futureTime.setMinutes(0);

        var lifeTime = futureTime - time;

        if ($content.data('cookie')) {
            cookie = $.cookies.get($content.data('cookie'));

            if (cookie === null || cookie !== 'news-' + $content.data('news')) {
                $content.fadeIn(speed);

                $content.find('.close').on('click', function (e) {
                    $content.fadeOut(speed);

                    if ($content.data('cookie-lifetime')) {
                        $.cookies.set($content.data('cookie'), 'news-' + $content.data('news'), {
                            path: "/",
                            hoursToLive: ($content.data('cookie-lifetime') / 3600)
                        });
                    } else {
                        $.cookies.set($content.data('cookie'), 'news-' + $content.data('news'), {
                            path: "/",
                            hoursToLive: lifeTime
                        });
                    }

                    e.preventDefault();

                });
            }
        }
        
        $container.find('.accordionBox').children('h3').on('click', function () {
            var $this = $(this),
                $id = $this.data('index');

            if (!$this.hasClass('open') && !$(this).parent().hasClass('dontopen')) {
                utils.scrollToById($this);
            }

            if ($this.hasClass('open')) {
                $this.removeClass('open');
                $this.addClass('closed');

            } else {
                $this.removeClass('closed');
                $this.addClass('open');

                if ($("#CPLContentLarge_txtSearch").length > 0) {
                    setTimeout(function () { $("#CPLContentLarge_txtSearch").focus() }, 500);
                }
            }
            $container.find('.sublist[data-index="' + $id + '"], .boxContent[data-index="' + $id + '"]').slideToggle(750, 'easeInOutCubic');
        });

        $container.find('.accordionBox2').children('h3').on('click', function () {
            var $this = $(this),
                $id = $this.data('index');

            if (!$this.hasClass('open') && !$(this).parent().hasClass('dontopen')) {
                utils.scrollToById($this);
            }

            if ($this.hasClass('open')) {
                $this.removeClass('open');
                $this.addClass('closed');

            } else {
                $this.removeClass('closed');
                $this.addClass('open');
            }
            $container.find('.sublist[data-index="' + $id + '"], .boxContent[data-index="' + $id + '"]').slideToggle(750, 'easeInOutCubic');
        });


        $container.find('.drawerBox').children('label.closed, label.table').on('click', function () {
            var $this = $(this);

            if (!$this.hasClass('open')) {
                if (!$this.hasClass('noscroll')) {   // wenn die Seite nicht nach unten gescrollt werden soll, dem Label "noscroll"-Class hinzufügen
                    utils.scrollToById($this);
                }
                //utils.scrollToById($this);
            }

            if ($this.hasClass('open')) {
                $this.removeClass('open');
                $this.addClass('closed');

            } else {
                $this.removeClass('closed');
                $this.addClass('open');
            }
            $this.parent().children('div.drawerContent').slideToggle(750, 'easeInOutCubic');
        });

    };

    init.contactFormular = function ($container) {
        if ($container.length <= 0) { return; }

        if (navigator.appVersion.indexOf('MSIE 8') !== -1) {

            $container.find('input[type="checkbox"] + label, input[type="radio"] + label').each(function () {
                var $label = $(this);

                $label.on('click', function () {
                    var $input = $label.prev('input[type="checkbox"], input[type="radio"]');
                    if ($input.attr('type') === 'checkbox' && $input[0].checked === true) {
                        $input.attr('checked', false).removeClass('checked');
                    } else {
                        $('input[name="' + $input.attr('name') + '"]').removeClass('checked');
                        $input.addClass('checked');
                        $input.attr('checked', true);
                    }

                });
            });
        }

        $container.find('select[name="reason"]').on('change', function () {
            var $this = $(this),
                $wrapper = $("div.formContent"),
                $form = $(".form_" + $this[0].value),
                height = 0;

            utils.scrollToById($('.contactBox'));

            if ($form.length >= 1) {
                $form.css({
                    'visibility': 'visible',
                    'display': 'inline-block'
                });
                height = $form[0].offsetHeight + 30; //30 px margin-top

                $("div[class^='form_']:visible").stop().animate({ 'opacity': 0 }, 200, function () {
                    $(this).css('display', 'none');
                    $form.css('display', 'inline-block');
                    $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic');
                    $form.stop().animate({ 'opacity': 1 }, 600);
                });
            } else {
                $("div[class^='form_']:visible").fadeOut(400);
                $wrapper.stop().animate({ 'height': '0px' }, 400, 'easeInOutCubic');
            }
            $(this).blur();
        });

        $container.find('select[name="destination"], select[name="product"], select[name="volume"]').on('change', function () {
            var $form = $('div.form_2'),
                $destination = $('select[name="destination"]').val(),
                $product = $('select[name="product"]').val(),
                $volume = $('select[name="volume"]').val(),
                $second_form = $form.children('div.second_form_2'),
                $wrapper = $("div.formContent"),
                height;

            if ($destination != -1 && $product != -1 && $volume != -1) {
                $second_form.css({
                    'visibility': 'visible',
                    'display': 'inline-block'
                });
                height = $second_form[0].offsetHeight + $wrapper[0].offsetHeight;
                $second_form.css({ 'position': 'relative' });
                $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic');
                $second_form.stop().animate({ 'opacity': 1 }, 600);
            } else {
                height = $wrapper[0].offsetHeight - $second_form[0].offsetHeight;
                $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic', function () {
                    $second_form.css({ 'display': 'none' });
                });
                $second_form.stop().animate({ 'opacity': 0 }, 600);
            }
            $(this).blur();
        });

        $container.find('input[name="domesticshipping"], input[name="internationalshipping"], input[name="mailshipping"]').on('change', function () {
            var $form = $('div.form_7'),
                $domestic = $form.children('input[name="domesticshipping"]'),
                $international = $form.children('input[name="internationalshipping"]'),
                $mail = $form.children('input[name="mailshipping"]'),
                $second_form = $form.children('div.second_form_7'),
                $wrapper = $("div.formContent"),
                height;

            if ($domestic[0].value >= 1 || $international[0].value >= 1 || $mail[0].value >= 1) {
                if ($second_form.css('display') == 'none') {
                    $second_form.css({
                        'visibility': 'visible',
                        'display': 'inline-block'
                    });
                    height = $second_form[0].offsetHeight + $wrapper[0].offsetHeight;
                    $second_form.css({ 'position': 'relative' });
                    $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic');
                    $second_form.stop().animate({ 'opacity': 1 }, 600);
                }
            } else {
                height = $wrapper[0].offsetHeight - $second_form[0].offsetHeight;

                $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic', function () {
                    $second_form.css({ 'display': 'none' });
                });
                $second_form.stop().animate({ 'opacity': 0 }, 600);
            }
        });

        $container.find('#b_parcelshop, #b_pands, #tandc_classic, #tandc_mail').on('change', function () {
            var $doc1 = $('#b_parcelshop'),
                $doc2 = $('#b_pands'),
                $doc3 = $('#tandc_classic'),
                $doc4 = $('#tandc_mail'),
                $second_form = $('div.second_form_3'),
                $wrapper = $("div.formContent"),
                height;

            if (($doc1[0].checked || $doc2[0].checked || $doc3[0].checked || $doc4[0].checked) && $second_form.css('display') == 'none') {
                $second_form.css({
                    'visibility': 'visible',
                    'display': 'inline-block'
                });
                height = $second_form[0].offsetHeight + $wrapper[0].offsetHeight;
                $second_form.css({ 'position': 'relative' });
                $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic');
                $second_form.stop().animate({ 'opacity': 1 }, 600);
            } else {
                if (!$doc1[0].checked && !$doc2[0].checked && !$doc3[0].checked && !$doc4[0].checked) {
                    height = $wrapper[0].offsetHeight - $second_form[0].offsetHeight;
                    $wrapper.stop().animate({ 'height': height + 'px' }, 400, 'easeInOutCubic', function () {
                        $second_form.css({ 'display': 'none' });
                    });
                    $second_form.stop().animate({ 'opacity': 0 }, 600);
                }
            }
        });
    };

    init.dimensions = function ($container) {
        if ($container.length <= 0) { return; }

        var $result = $(".results"),
            $inputs = $container.find('input[name="dHeight"], input[name="dWidth"], input[name="dLength"]');

        $inputs.on('blur', function () {
            if ($(this).val() == "" || $(this).val() <= 0) {
                $(this).addClass("error");
                if ($result.hasClass("active")) {
                    $result.removeClass('active');
                }
            } else {
                $(this).removeClass("error");
            }
        });
        $inputs.on('change', function () {
            if ($(this).val() != "" && $(this).val() <= 0) {
                $(this).val(1);
            }
        });
        $container.find('form').on('submit', function (e) {
            var inputs = $container.find('input[type="number"]').filter(function () {
                if ($(this).val() == "" || $(this).val() <= 0) {
                    $(this).addClass("error");
                    return 1;
                } else {
                    $(this).removeClass("error");
                    return 0;
                }
            });
            if (inputs.length <= 0) {
                $result.addClass("active");
            }
            e.preventDefault();
        });
    };

    init.teaser = function ($container) {
        if ($container.length <= 0) { return; }

        $container.find('a').on('mouseenter', function () {
            $(this).parent('div').addClass('hovered');
        });

        $container.find('a').on('mouseleave', function () {
            $(this).parent('div').removeClass('hovered');
        });
    };

    init.depotFinder = function ($container) {
        if ($container.length <= 0) { return; }

        var $result = $(".results");

        $container.find('select').on('change', function () {
            if ($(this).val() == "") {
                if ($result.hasClass("active")) {
                    $result.removeClass('active');
                }
            }
            $(this).blur();
        });

        $container.on('submit', function (e) {
            e.preventDefault();
            var selected = true;

            $container.find('select').filter(function () {
                if ($(this).val() == "") {
                    selected = false;
                }
            });

            if (selected === true) {
                if ($result.hasClass("active")) {
                    $result.removeClass('active');
                } else {
                    $result.addClass("active");
                }
            }
        });
    };

    init.deliveryTime = function ($container) {
        if ($container.length <= 0) { return; }

        var $result = $(".results"),
            $sort = $("input[name='sort']"),
            optionsBackup = $("select[name='dispatch']").html();

        arrangeSelect = function (sort) {
            var options = $(optionsBackup).filter(function () {
                return $(this).data("sort") == sort;
            });
            $("select").html(options);
        };
        arrangeSelect($sort.val());
        $sort.on('change', function () {
            arrangeSelect($(this).val());
        });

        $container.find('select').on('change', function () {
            if ($(this).val() == "") {
                if ($result.hasClass("active")) {
                    $result.removeClass('active');
                }
            }
            $(this).blur();
        });

        $container.on('submit', function (e) {
            e.preventDefault();
            var selected = true;

            $container.find('select').filter(function () {
                if ($(this).val() == "") {
                    selected = false;
                }
            });

            if (selected === true) {
                if ($result.hasClass("active")) {
                    $result.removeClass('active');
                } else {
                    $result.addClass("active");
                }
            }
        });

        $container.find(".option").on('click', function () {
            var height;

            if (!$(this).hasClass('selected')) {
                $("div.option").removeClass('selected');
                $(this).addClass('selected');

                height = $("ul[data-option='" + $(this).data("option") + "']")[0].offsetHeight + $("p.addNote")[0].offsetHeight + 55;

                $("div.additionalInfo").stop().animate({ 'height': height + 'px' }, 350);
                $("ul").removeClass('active');
                $("ul[data-option='" + $(this).data("option") + "']").addClass('active');
            }
        });

    };

    init.shippingGuide = function ($container) {
        if ($container.length <= 0) { return; }
        $container.find("a").on('click', function (e) {
            e.preventDefault();
            if (!$(this).hasClass('active')) {
                $container.find(".positions").removeClass('active');
                $container.find(".positions[data-pos='" + $(this).data('pos') + "']").addClass('active');
                $container.find("a").removeClass('active');
                $(this).addClass('active');
            }
        });
    };

    init.error = function ($container) {
        if ($container.length <= 0) { return; }
        $container.find("form").on('submit', function (e) {
            var $form = $(this),
                $errorBox;

            e.preventDefault();

            if ($form.attr('id') == 'contact') {
                var $wrapper = $container.find('.formContent'),
                    error = false,
                    id = $container.find('select[name="reason"]').val(),
                    $form = $(".form_" + id);

                $errorBox = $form.find('div[class^="errorBox_' + $(this).attr('id') + '"]');

                $wrapper.css({ 'height': 'auto' });
                $form.find('input').each(function () {
                    if (($(this).attr('type') == 'text' && $(this).val() == '')) {
                        $(this).addClass('error');
                        $(this).prev('label').addClass('error');
                        error = true;
                    } else {
                        $(this).removeClass('error');
                        $(this).prev('label').removeClass('error');
                    }

                    if (($(this).attr('type') == 'radio' && $form.find('input[name="' + $(this).attr('name') + '"]:checked').val() == undefined)) {
                        $form.find('input[name="' + $(this).attr('name') + '"]').next('label').addClass('error');
                        $form.find('label[data-name="' + $(this).attr('name') + '"]').addClass('error');
                    } else {
                        $form.find('input[name="' + $(this).attr('name') + '"]').next('label').removeClass('error');
                        $form.find('label[data-name="' + $(this).attr('name') + '"]').removeClass('error');
                    }
                });
                if (error === true) {
                    if (!$errorBox.hasClass('active')) {
                        $errorBox.addClass('active');
                    }
                } else {
                    if ($errorBox.hasClass('active')) {
                        $errorBox.removeClass('active');
                    }
                }
            } else {
                if ($form.attr('id') == 'calculator') {

                    var $inputs = $form.find('input[type="number"]'),
                        $errorBoxes = $container.find('.errorBox_calculator'),
                        min = false,
                        all = false;

                    var inputs = $inputs.filter(function () {
                        if ($(this).val() == "") {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    var invalid = $inputs.filter(function () {
                        if ($(this).val() != "" && $(this).val() <= 0) {
                            return 1;
                        } else {
                            return 0;
                        }
                    })
                    if (inputs.length > 0 || invalid.length > 0) {

                        if ($inputs.length === inputs.length) {
                            $errorBox = $container.find('.errorBox_' + $(this).attr('id') + '_all');
                        } else {
                            $errorBox = $container.find('.errorBox_' + $(this).attr('id') + '_min');
                        }

                        $errorBoxes.removeClass('active');
                        $errorBox.addClass('active');

                    } else {
                        $errorBoxes.removeClass('active');
                    }
                } else {
                    $errorBox = $container.find('div[class^="errorBox_' + $(this).attr('id') + '"]');

                    if ($errorBox.hasClass('active')) {
                        $errorBox.removeClass('active');
                    } else {
                        $errorBox.addClass('active');
                    }
                }

            }
            return false;
        });
    };

    $(document).ready(function () {
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

    });

    return init;

})();

init.utils = (function () {

    utils = {};

    utils.scrollToById = function ($element) {
        $(window).on('mousewheel', function () {
            $('html,body').stop().animate();
            return;
        });

        $('html,body').stop().animate({
            scrollTop: $element.offset().top
        }, 1000, 'easeInOutCubic');
    };

})();


