const email = createInput('email', auth.isEmailValid);
const password = createInput('password', auth.isPasswordValid);

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
    if (!auth.isEmailValid(email.val())) {
        email.css("border", "2px solid red");
        valid = false;
    }
    if (!auth.isPasswordValid(password.val())) {
        password.css("border", "2px solid red");
        valid = false;
    }
    if (!valid) {
        $('#client_error').css('display', 'block');
        e.preventDefault();
    }
});