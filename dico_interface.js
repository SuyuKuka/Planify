$(document).ready(function () {
    $("#query").on("input", function () {
        let query = $(this).val();

        if (query.length === 0) {
            $("#results").empty();
        } else {
            $("#results").empty();
            $.get("/dictionary/search", { word: query }, function (data) {
                const ul = $("<ul></ul>");
                data.forEach(word => {
                    ul.append(`<li>${ word }</li>`);
                });
                $("#results").append(ul);
                $("#results").hide().empty().append(ul).slideDown();
            });
        }
    });

    $("#ajouter").on("click", function () {
        let query = $("#query").val();
        $.post("/dictionary", { word: query }, function (data) {
            $("#results").empty();
            $.get("/dictionary/search", { word: query }, function (data) {
                const ul = $("<ul></ul>");
                data.forEach(word => {
                    ul.append(`<li>${ word }</li>`);
                });
                $("#results").append(ul); 
                $("#results").hide().empty().append(ul).slideDown();
            });
        });
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
});