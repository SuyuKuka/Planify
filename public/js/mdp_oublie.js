verificateForm();

$(document).on('keydown', function(e) {
    if (e.key === 'Enter') {
        if (!$(':focus').is('input')) {
            $('#form').submit();
        }
    }
});

$("#form").on('submit', (e) => {
    $('#error_step').css('display', 'none');
    if (!isEmailValid()) {
        email.css("border", "2px solid red");
        $('#error_form').css('display', 'block');
        e.preventDefault();
    }
});