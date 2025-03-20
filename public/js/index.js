$(document).ready(function() {
    let visible = true;
    $("#menu").click(function() {
        if (visible) {
            $("#left").css("display", "none");
            $("#left").css("width", "0%");
            $("#center").css("width", "80%");
            $("#right").css("width", "20%");
            visible = false;
        } else {
            $("#left").css("display", "block");
            $("#left").css("width", "20%");
            $("#center").css("width", "60%");
            $("#right").css("width", "20%");
            visible = true;
        }
    });

    $("#menu").on("dragstart", function(event) {
        event.preventDefault();
    });

    $(".list").hide();
    $("#list").click(function() {
        $(".list").toggle();
    })

    let down = $(".profil_div, .parametres_div, .deconnexion_div");
    down.on("mouseenter", function() {
        $(this).css("background-color", "lightgray");	
    })

    down.on("mouseleave", function() {
        $(this).css("background-color", "white");
    })
});