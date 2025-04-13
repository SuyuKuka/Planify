/**
 * Appelle {@link verificate} sur le champs d'ID inputName.
 * @param {string} inputName Sans #
 * @param {function(string): boolean} validationMethod
 * @returns {JQuery}
 */
function createInput(inputName, validationMethod) {
    const input = $(`#${inputName}`);
    verificate(input, validationMethod);
    return input;
}

/**
 * Met à jour la bordure d’un champ <input> à chaque saisie,
 * selon les règles spécifiées.
 * - Bordure Rouge si invalide
 * - Bordure par défaut si valide
 * @param {JQuery} input 
 * @param {Function} method 
 */
function verificate(input, method) {
    if (input.length == 0) {
        return;
    }
    input.on("input", function() {
        if (!method(input.val()) || typeof method !== 'function') {
            input.css("border", "2px solid red");
        } else {
            input.css("border", "");
        }
    });
}
