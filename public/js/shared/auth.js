// @see https://stackoverflow.com/a/8420905
(function(exports){

    exports.messages = Object.freeze({
        defaultError: {
            code: 0,
            msg: "Une erreur est survenue. Veuillez réessayer plus tard."
        },
        modifiedWithSuccess: {
            code: 1,
            msg: "Modifié avec succès !"
        },
        wrongPassword: {
            code: 2,
            msg: "Le mot de passe est erroné."
        },
        alreadyUsedEmail: {
            code: 3,
            msg: "L'adresse email spécifiée est déjà associé à un compte."
        },
        wrongEmailOrPassword: {
            code: 4,
            msg: "L'email ou le mot de passe est erroné."
        },
        invalidQueries: {
            code: 5,
            msg: "La ou les données spécifiées ne sont pas valides."
        },
        alreadyUsedUserID: {
            code: 6,
            msg: "L'identifiant specifié est deja utilisé."
        }
    });

    exports.isSurnameValid = function(surname) {
        if (!surname) return false;
        surname = surname.trim();
        if (!/^[A-Z][A-Za-z'éèëêîïç -]{1,31}$/.test(surname)) return false;
        if (surname.endsWith('-')) return false;
        return true;
    };
  
    exports.isNameValid = function(name) {
        if (!name) return false;
        name = name.trim();
        if (!/^[A-Z][A-Za-z'éèëêîïç -]{1,31}$/.test(name)) return false;
        if (name.endsWith('-')) return false;
        return true;
    };
  
    exports.isBirthdateValid = function(birthdate) {
        if (birthdate === undefined) {
            return false;
        }
        const val = birthdate.trim();
        if (val === '') {
            return false;
        }
        const inputDate = new Date(val);
        const minDate = new Date('1900-01-01');
        const maxDate = new Date();
    
        return inputDate >= minDate && inputDate < maxDate;
    };
  
    exports.isIdUserValid = function(id_user) {
        return id_user && /^@[a-z0-9]{3,31}$/.test(id_user.trim());
    };
  
    exports.isUsernameValid = function(username) {
        if (!username) return false;
        username = username.trim();
        if (!/^[A-Za-z][A-Za-z0-9-]{2,31}$/.test(username)) return false;
        if (username.endsWith('-')) return false;
        return true;
    };

    // TODO: utiliser validator ?
    exports.isEmailValid = function(email) {
        return email && /^\S+@\S+\.\S+$/.test(email.trim());
    };
  
    // TODO: utiliser validator ?
    exports.isPasswordValid = function(password) {
        if (!password) {
            return false;
        }
        const length = password.trim().length;
        return length >= 8 && length <= 32;
    };
  
}(typeof exports === 'undefined' ? this.auth = {} : exports));

