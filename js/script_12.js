var plugins = '';
var current_form;
(function ($) {
  $(function () {
    $.reject({
      reject: { msie: 10, safari: 6, chrome: 20, firefox: 27 },
      closeCookie: !0,
      imagePath: '/libs/TurnWheel/jReject/images/',
      header: 'Your browser is not supported here',
      paragraph1: 'You are currently using an unsupported browser',
      paragraph2:
        'Please install one of the many optional browsers below to proceed',
      closeMessage: 'Close this window at your own demise!',
    });
    $('.next').click(function (e) {
      e.preventDefault();
      var curr = $(this).attr('num'),
        next = curr * 1 + 1;
      var validate = $('#num' + curr).find('[data-required="1"]');
      var pass = !0;
      if (validate.length > 0) {
        validate.each(function () {
          if ($(this).val() == '') {
            pass = !1;
            $(this).addClass('error');
          }
        });
      }
      var more_validation = $('#num' + curr).find('[data-more-validation]');
      console.log(more_validation);
      if (more_validation.length > 0) {
        more_validation.each(function () {
          switch ($(this).data('more-validation')) {
            case 'email1':
              if (
                $(this).val() !== $('[data-more-validation="email2"]').val()
              ) {
                pass = !1;
                $(this).addClass('error');
              }
            case 'email2':
            case 'email':
              if (
                !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
                  $(this).val()
                )
              ) {
                pass = !1;
                $(this).addClass('error');
              }
              break;
            case 'postcode':
              if (!/^[A-Z]{2}-\d{5}$/.test($(this).val())) {
                pass = !1;
                $(this).addClass('error');
              }
              break;
            case 'phone':
              if (!/^(?:8|\(?\+\)?)\d{7,}/.test($(this).val())) {
                pass = !1;
                $(this).addClass('error');
              }
              break;
          }
        });
      }
      if (pass) {
        $('#num' + curr).hide();
        $('#num' + next).show();
        $('#tab' + curr).removeClass('selected');
        $('#tab' + next).addClass('selected');
        $('html, body').animate(
          { scrollTop: $('.join-us-steps').offset().top - 200 },
          200
        );
      } else {
        $('html, body').animate(
          { scrollTop: $('.error').first().offset().top - 200 },
          200
        );
      }
    });
    $('.back').click(function (e) {
      e.preventDefault();
      var curr = $(this).attr('num'),
        back = curr * 1 - 1;
      $('#num' + curr).hide();
      $('#num' + back).show();
      $('#tab' + curr).removeClass('selected');
      $('#tab' + back).addClass('selected');
    });
    $('body').on('change', '[data-price-selector]', function () {
      var id = $(this).val();
      $.post(
        '/ajax.php',
        { module: 'TxForm', action: 'CalcPrice', id: id },
        function (data) {
          if (data.status) {
            var original = $('[data-calculated-price]').data('original');
            var text = '';
            if (typeof original !== 'undefined') {
              text = original;
            } else {
              text = $('[data-calculated-price]').text();
              $('[data-calculated-price]').data('original', text);
            }
            $('[data-question-id="23"]').val(data.return[0]);
            text = text.replace('x', data.return[0]);
            $('[data-calculated-price]').text(text);
            original = $('[data-calculated-price-vat]').data('original');
            text = '';
            if (typeof original !== 'undefined') {
              text = original;
            } else {
              text = $('[data-calculated-price-vat]').text();
              $('[data-calculated-price-vat]').data('original', text);
            }
            $('[data-question-id="24"]').val(data.return[1]);
            text = text.replace('x', data.return[1]);
            $('[data-calculated-price-vat]').text(text);
          }
        },
        'json'
      );
    });
    $('[data-price-selector]').trigger('change');
  });
  plugins = {
    init: function () {
      plugins.fancybox($('.fancy'));
      plugins.formCheck2($('#reg3'), !1, !1);
    },
    fancybox: function (obj) {
      obj.fancybox({ helpers: { media: {}, overlay: { locked: !1 } } });
    },
    swipers: {
      index: new Swiper('.index-swiper', {
        loop: !0,
        paginationClickable: !0,
        autoplay: 500000,
        slidesPerView: 1,
        spaceBetween: 0,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        pagination: {
          el: '.swiper-pagination',
          type: 'bullets',
          clickable: !0,
        },
        on: {
          init: function () {
            this.params.navigation.nextEl = $(this.params.el).siblings(
              '.swiper-button-next'
            );
            this.params.navigation.prevEl = $(this.params.el).siblings(
              '.swiper-button-prev'
            );
            this.params.pagination.el = $(this.params.el).siblings(
              '.swiper-pagination'
            );
          },
        },
      }),
    },
    getFromStorage: function (obj) {
      obj.find('input[type="text"], textarea').each(function () {
        var name = $(this).attr('id');
        var value = localStorage.getItem(name);
        if (value) {
          $(this).val(value);
        }
      });
      obj.find('input[type="checkbox"]').each(function () {
        var name = $(this).attr('id');
        var value = localStorage.getItem(name);
        if (value == 1) {
          $(this).prop('checked', !0);
        } else {
          $(this).prop('checked', !1);
        }
      });
    },
    fillStorage: function (obj) {
      obj.find('input[type="text"], textarea').each(function () {
        var name = $(this).attr('id');
        var value = $(this).val();
        localStorage.setItem(name, value);
      });
      obj.find('input[type="checkbox"]').each(function () {
        var name = $(this).attr('id');
        if ($(this).is(':checked')) {
          localStorage.setItem(name, 1);
        } else {
          localStorage.setItem(name, 0);
        }
      });
    },
    formCheck2: function (obj, useStorage, useCapcha) {
      obj.find('input[type="text"], textarea').focus(function () {
        $(this).removeClass('error');
      });
      if (useStorage == !0) {
        plugins.getFromStorage(obj);
      }
      obj.find('.xsd').click(function (e) {
        e.preventDefault();
        obj.find('.error').removeClass('error');
        if (obj.find('*:invalid').length > 0) {
          obj.find('*:invalid').addClass('error');
        } else {
          if (useStorage == !0) {
            plugins.fillStorage(obj);
          }
          if (useCapcha == !0) {
            current_form = $(this).parents('form');
            grecaptcha.execute();
          } else {
            obj.submit();
          }
        }
      });
    },
    formCheck: function (obj) {
      obj.find('input[type="text"], textarea').each(function (index, element) {
        var get_value = $(this).parent('*').attr('title');
        if ($(this).val() == '') {
          $(this).val(get_value);
        }
      });
      obj.find('input[type="text"], textarea').blur(function () {
        var get_value2 = $(this).parent('*').attr('title');
        if (
          $(this).val() == '' ||
          $(this).val() == $(this).parent('*').attr('title')
        ) {
          $(this).val(get_value2);
        }
      });
      obj.find('input[type="text"], textarea').focus(function () {
        var get_value2 = $(this).parent('*').attr('title');
        if ($(this).val() == $(this).parent('*').attr('title')) {
          $(this).val('');
          $(this).removeClass('error');
        }
      });
      obj.find('.xsd').click(function (event) {
        event.preventDefault();
        valid_form = 1;
        obj
          .find('input[type="text"], textarea')
          .each(function (index, element) {
            var get_value = $(this).parent('*').attr('title');
            if (
              $(this).val() == $(this).parent('*').attr('title') &&
              $(this).attr('required')
            ) {
              $(this).val('').addClass('error');
              valid_form = 0;
            } else {
              $(this).removeClass('error');
            }
          });
        if (valid_form == 0) {
          obj
            .find('input[type="text"], textarea')
            .each(function (index, element) {
              var get_value = $(this).parent('*').attr('title');
              if ($(this).val() == '') {
                $(this).val(get_value);
              }
            });
        } else {
          obj
            .find('input[type="text"], textarea')
            .each(function (index, element) {
              var get_value = $(this).parent('*').attr('title');
              $(this).val(get_value);
            });
          $(this).parents('form').submit();
        }
      });
    },
    buildMobile: new (function () {
      mobileModules.init();
    })(),
    ui: {
      fixedHeader: new (function () {
        var obj = $('header');
        var header_h = 187;
        $(window).on('scroll', function () {
          var offset = $(document).scrollTop();
          if (offset >= header_h) {
            obj.addClass('fixed');
          } else {
            obj.removeClass('fixed');
          }
        });
      })(),
      accords: new (function () {
        $('.accorditions-block .accord-toggler').on('click', function (event) {
          event.preventDefault();
          $(this).toggleClass('opened');
          $(this).next('.accord').toggle('fast');
        });
      })(),
      inputs: {
        select: new (function () {
          $('select[data-theme]').select2({
            minimumResultsForSearch: Infinity,
          });
        })(),
      },
    },
  };
  plugins.init();
})(jQuery);
function the_call_back() {
  $('.g-c-elem').each(function (index, el) {
    grecaptcha.render(el, {
      sitekey: '6LcwSDMUAAAAANRu43bCkYWDtSv_V86fzL6Me5WP',
      callback: function (token) {
        if (typeof current_form !== 'undefined') {
          current_form.find('.g-recaptcha-response').val(token);
          current_form.submit();
        }
      },
      size: 'invisible',
    });
  });
}
