(function($) {
    $.fn.ipWidgetGS1Calc = function() {
        var init = function($this){
            function getMessage(name){
                return $this.find('input[name="'+name+'"]').val();
            }

            var model = {
                input: "",
                controlNumber: 0,
                error: false,
                resultVisible: false,
                errorMessage: "",
                successMessage: "",
                show_gt14: false,
                is_gs13: false,
                showasgt14: function(){
                    console.log("jej");

                    model.show_gt14 = true;
                },
                showasoriginal: function(){
                    console.log("boo");
                    model.show_gt14 = false;
                },
                change: function(){
                    model.resultVisible = false;
                    model.gt14 = false;
                },
                calculate: function() {
                    model.error = false;
                    model.show_gt14 = false;
                    var input = model.input;
                    if (isNaN(input)){
                        setError("errorNotAnNumber");
                    } else if (input.length == 12 || input.length == 17){
                        var factor = 3;
                        var sum = 0;
                        for (var index = input.length; index > 0; --index) {
                            sum = sum + input.substring(index-1, index) * factor;
                            factor = 4 - factor;
                        }
                        console.log(((1000 - sum) % 10));
                        model.controlNumber = ((1000 - sum) % 10);
                        model.resultVisible = true;
                        if (input.length == 12){
                            model.gt14 = "0" + model.input;
                            model.is_gs13 = true;
                            model.show_gt14 = false;
                            model.successMessage = getMessage("messageGS113");
                        } else {
                            model.is_gs13 = false;
                            model.successMessage = getMessage("messageSSCC");
                        }
                    } else {
                        setError("errorInvalidNumber");
                    }
                },
                closeError: function(){
                    model.error = false;
                },
                clear: function(){
                    model.input = "";
                    model.resultVisible = false;
                    model.error = false;
                }
            };

            function setError(name){
                model.gt14 = false;
                model.resultVisible = false;
                model.error = true;
                model.errorMessage = getMessage(name);
            }

            rivets.bind($this, model);
        };
        $(this).each(function(){
            init($(this));
        });
    };
})(jQuery);

$(document).ready(function() {
    $('.ipWidget-GS1Calc').ipWidgetGS1Calc();
});