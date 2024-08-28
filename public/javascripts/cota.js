$(document).ready(function () {
    $('#cotaCardBody1').click(function () {
        $(`#perfPopup`).toggleClass("active");
    });
    $('#cancel-cota-perf-form').click(function () {
        $(`#perfPopup`).toggleClass("active");
    });
    $('#cotaCardBody2').click(function () {
        $(`#riskPopup`).toggleClass("active");
    });
    $('#cancel-cota-risk-form').click(function () {
        $(`#riskPopup`).toggleClass("active");
    });
})