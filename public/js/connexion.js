verificate(email, isEmailValid);
verificate(password, isPasswordValid);

$("#show_password").click(function() {
    if (password.attr('type') === 'password') {
        password.attr('type', 'text');
    } else {
        password.attr('type', 'password');
    }
});

$(document).on('keydown', function(e) {
    if (e.key === 'Enter') {
        if (!$(':focus').is('input')) {
            $('#form').submit();
        }
    }
});

$("#form").on('submit', (e) => {
    $('#error_step').css('display', 'none');
    let step2 = true;
    if (!isEmailValid()) {
        email.css("border", "2px solid red");
        step2 = false;
    }
    if (!isPasswordValid()) {
        password.css("border", "2px solid red");
        step2 = false;
    }
    if (!step2) {
        $('#error_form').css('display', 'block');
        e.preventDefault();
    }
});