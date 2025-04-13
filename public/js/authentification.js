const surname = $('#surname');
const name = $('#name');
const birthdate = $('#birthdate');
const id_user = $('#id_user');
const username = $('#username');
const email = $('#email');
const password = $('#password');
const password_confirm = $('#password_confirm');
const new_password = $('#new_password');

function verificate(input, method) {
    if (input.length == 0) {
        return;
    }
    input.on("input", function() {
        if (!method() && input.val() !== '') {
            input.css("border", "2px solid red");
        } else {
            input.css("border", "");
        }
    });
}

function isSurnameValid() {
    return /^[A-Z][A-Za-z'éèëêîïç -]{1,31}$/.test(surname.val());
}

function isNameValid() {
    return /^[A-Z][A-Za-z'éèëêîïç -]{1,31}$/.test(name.val());
}

function isBirthdateValid() {
    const val = birthdate.val();
    if (val === '') {
        return false;
    }
    const inputDate = new Date(val);
    const minDate = new Date('1900-01-01');
    const maxDate = new Date();

    return inputDate >= minDate && inputDate < maxDate;
}

function isIdUserValid() {
    return /^@[A-Za-z0-9][A-Za-z0-9' -]{2,31}$/.test(id_user.val());
}

function isUsernameValid() {
    return /^[A-Za-z0-9][A-Za-z0-9' -]{2,31}$/.test(username.val());
}

function isEmailValid() {
    return /^\S+@\S+\.\S+$/.test(email.val());
}

function isPasswordValid() {
    const val = password.val();
    const length = val.length;
    return length >= 8 && length <= 32;
}

function isPasswordConfirmValid() {
    const val = password_confirm.val();
    const length = val.length;
    return length >= 8 && length <= 32;
}

function isNewPasswordValid() {
    const val = new_password.val();
    const length = val.length;
    return length >= 8 && length <= 32;
}

function verificateForm() {
    verificate(surname, isSurnameValid);
    verificate(name, isNameValid);
    verificate(birthdate, isBirthdateValid);
    verificate(id_user, isIdUserValid);
    verificate(username, isUsernameValid);
    verificate(email, isEmailValid);
    verificate(password, isPasswordValid);
    verificate(password_confirm, isPasswordConfirmValid);
    verificate(new_password, isNewPasswordValid);
}
