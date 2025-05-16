const email = createInput('email', auth.isEmailValid);

$(document).on('keydown', function(e) {
    if (e.key === 'Enter') {
        if (!$(':focus').is('input')) {
            $('#form').submit();
        }
    }
});

$("#form").on('submit', (e) => {
    $('#error_step').css('display', 'none');
    if (!auth.isEmailValid(email.val())) {
        email.css("border", "2px solid red");
        $('#client_error').css('display', 'block');
        e.preventDefault();
    }
});