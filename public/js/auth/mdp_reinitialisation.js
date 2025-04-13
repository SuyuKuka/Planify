const password = createInput('password', auth.isPasswordValid);
const password_confirm = createInput('password_confirm', auth.isPasswordValid);

$(document).on('keydown', function(e) {
    if (e.key === 'Enter') {
        if (!$(':focus').is('input')) {
            $('#form').submit();
        }
    }
});

$("#form").on('submit', (e) => {
    $('#server_error').css('display', 'none');
    $('#client_error').css('display', 'none');

    let valid = true;
    if (!auth.isPasswordValid(password.val())) {
        password.css("border", "2px solid red");
        valid = false;
    }
    if (!auth.isPasswordValid(password_confirm.val())) {
        password_confirm.css("border", "2px solid red");
        valid = false;
    }

    if (password.val() !== password_confirm.val()) {
        password.css("border", "2px solid red");
        password_confirm.css("border", "2px solid red");
        $('#client_error').css('display', 'block');
        valid = false;
    }

    if (!valid) {
        $('#client_error').css('display', 'block');
        e.preventDefault();
    }
});

$("#show_password").click(function() {
    if (password.attr('type') === 'password') {
        password.attr('type', 'text');
        password_confirm.attr('type', 'text');
    } else {
        password.attr('type', 'password');
        password_confirm.attr('type', 'password');
    }
});