verificateForm();

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
    $('#server_error').css('display', 'none');
    let valid = true;
    if (!isEmailValid()) {
        email.css("border", "2px solid red");
        valid = false;
    }
    if (!isPasswordValid()) {
        password.css("border", "2px solid red");
        valid = false;
    }
    if (!valid) {
        $('#client_error').css('display', 'block');
        e.preventDefault();
    }
});