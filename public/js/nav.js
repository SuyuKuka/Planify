$("#search").on("input", function () {
    let query = $(this).val();

    if (query.length === 0) {
        $("#results").empty();
    } else {
        $("#results").empty();
        $.get("/search", { word: query }, function (data) {
            const ul = $('<ul class="list-unstyled m-0"></ul>');
            data.forEach(result => {
                console.log(result);
                ul.append(`<li class="px-3 py-2">${ result }</li>`);
            });
            $("#results").append(ul);
            $("#results").hide().empty().append(ul).slideDown();
        });
    }
});

$("#results").on("click", "li", function () {
    let word = $(this).text();
    $("#query").val(word);
    $("#results").empty();
});

$("#results").on("mouseover", "li", function () {
    $(this).css("background-color", "cyan");
});

$("#results").on("mouseout", "li", function () {
    $(this).css("background-color", "white");
});