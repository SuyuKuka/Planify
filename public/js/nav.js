$("#search").on("input", function () {
    const query = $(this).val();

    if (query.length === 0 || (query.charAt(0) === '@' && query.length === 1)) {
        $("#results").empty().addClass("d-none");
    } else {
        $("#results").empty();
        $.get("/search", { word: query }, function (data) {
            const ul = $('<ul class="list-unstyled m-0"></ul>');
            data.forEach(result => {
                console.log(data);
                ul.append(`<li class="px-3 py-2" data-user-id="${result.user_id}">
                    <strong>${result.username}</strong><br>
                    <small>${result.user_id}</small>
                </li>`);
            });
            $("#results").removeClass("d-none").hide().empty().append(ul).slideDown();
        });
    }
});

$("#results").on("click", "li", function () {
    const userId = $(this).data("user-id");
    const query = $("#search").val().trim();

    if (query.charAt(0) === "@") {
        $("#search").val(userId);
    }
    $("#results").empty().addClass("d-none");
});

$("#results").on("mouseover", "li", function () {
    $(this).css("background-color", "rgb(240, 240, 240)");
});

$("#results").on("mouseout", "li", function () {
    $(this).css("background-color", "white");
});