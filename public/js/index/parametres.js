verificateForm();

$("#form").on('submit', (e) => {
    $('#server_error').css('display', 'none');
    let valid = true;
    if ($('#username').val() !== '') {
        if (!isUsernameValid()) {
            username.css("border", "2px solid red");
            valid = false;
        }
    }

    if ($('#email').val() !== '') {
        if (!isEmailValid()) {
            email.css("border", "2px solid red");
            valid = false;
        }
    }
    if (!isPasswordValid()) {
        password.css("border", "2px solid red");
        valid = false;
    }
    if ($('#new_password').val() !== '') {
        if (!isNewPasswordValid()) {
            new_password.css("border", "2px solid red");
            valid = false;
        }
    }
    if (!valid) {
        $('#client_error').css('display', 'block');
        e.preventDefault();
    }
});

$("#show_password").click(function() {
    if (password.attr('type') === 'password') {
        password.attr('type', 'text');
        new_password.attr('type', 'text');
    } else {
        password.attr('type', 'password');
        new_password.attr('type', 'password');
    }
});

//PB MDP