verificateForm();

$(document).ready(function() {
    if (isSurnameValid() && isNameValid() && isBirthdateValid()) {
        $('#step1').css('display', 'none');
    } else {
        $('#step2').css('display', 'none');
    }
});

//#region step1
$("#surname").on('input', function() {
    const uppercase = $(this).val().toUpperCase();
    $(this).val(uppercase);
});

$("#name").on('input', function() {
    let val = $(this).val();
    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    $(this).val(val);
});

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

$("#id_user").on('input', function() {
    const lowercase = $(this).val().toLowerCase();
    $(this).val(lowercase);
});

$("#email").on('input', function() {
    const lowercase = $(this).val().toLowerCase();
    $(this).val(lowercase);
});

$("#form").on('submit', (e) => {
    $('#server_error2').css('display', 'none');
    let step2 = true;
    if (!isIdUserValid()) {
        id_user.css("border", "2px solid red");
        step2 = false;
    }
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
