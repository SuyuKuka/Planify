const surname = $('#surname');
const name = $('#name');
const birthdate = $('#birthdate');
const username = $('#username');
const email = $('#email');
const password = $('#password');

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

function isUsernameValid() {
    return /^[A-Z][A-Za-z' -]{4,31}$/.test(username.val());
}

function isEmailValid() {
    return /^\S+@\S+\.\S+$/.test(email.val());
}

function isPasswordValid() {
    const val = password.val();
    const length = val.length;
    return length >= 8 && length <= 32;
}