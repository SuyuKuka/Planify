const email = createInput('email', auth.isEmailValid);
const username = createInput('username', auth.isUsernameValid);
const password = createInput('password', auth.isPasswordValid);
const new_password = createInput('new_password', auth.isPasswordValid);

$("#form").on('submit', (e) => {
    $('#server_error').css('display', 'none');
    let valid = true;
    if (username.val() !== '') {
        if (!auth.isUsernameValid(username.val())) {
            username.css("border", "2px solid red");
            valid = false;
        }
    }
    
    if (email.val() !== '') {
        if (!auth.isEmailValid(email.val())) {
            email.css("border", "2px solid red");
            valid = false;
        }
    }

    if (!auth.isPasswordValid(password.val())) {
        password.css("border", "2px solid red");
        valid = false;
    }

    if (new_password.val() !== '') {
        if (!auth.isNewPasswordValid(new_password.val())) {
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
