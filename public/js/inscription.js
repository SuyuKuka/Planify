verificateForm();

$(document).ready(function() {
    if (isSurnameValid() && isNameValid() && isBirthdateValid()) {
        $('#step1').css('display', 'none');
    } else {
        $('#step2').css('display', 'none');
    }
});

//#region step1
$("#suivant").click(function() {
    $('#server_error1').css('display', 'none');
    let step1 = true;
    if (!isSurnameValid()) {
        surname.css("border", "2px solid red");
        step1 = false;
    }
    if (!isNameValid()) {
        name.css("border", "2px solid red");
        step1 = false;
    }
    if (!isBirthdateValid()) {
        birthdate.css("border", "2px solid red");
        step1 = false;
    }
    if (!step1) {
        $('#client_error1').css('display', 'block');
    } else {
        $('#client_error1').css('display', 'none');
        $('#step1').css('display', 'none');
        $('#step2').css('display', 'block');
    }
});

//#endregion

//#region step 2

$("#show_password").click(function() {
    if (password.attr('type') === 'password') {
        password.attr('type', 'text');
    } else {
        password.attr('type', 'password');
    }
});

$("#retour").click(function() {
    $('#step2').css('display', 'none');
    $('#step1').css('display', 'block');
});

$(document).on('keydown', function(e) {
    if (e.key === 'Enter') {
        if ($('#step1').css('display') === 'block') {
            $('#suivant').click();
            e.preventDefault();
            return;
        } else if ($('#step2').css('display') === 'block' && !$(':focus').is('input')) {
            $('#form').submit();
        }
    }
});

$("#form").on('submit', (e) => {
    $('#server_error2').css('display', 'none');
    let step2 = true;
    if (!isUsernameValid()) {
        username.css("border", "2px solid red");
        step2 = false;
    }
    if (!isEmailValid()) {
        email.css("border", "2px solid red");
        step2 = false;
    }
    if (!isPasswordValid()) {
        password.css("border", "2px solid red");
        step2 = false;
    }
    if (!step2) {
        $('#client_error2').css('display', 'block');
        e.preventDefault();
    }
});
//#endregion
