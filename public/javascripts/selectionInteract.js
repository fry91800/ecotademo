$(document).ready(function () {
    let currentErp = "";
    let reason = "";
    let action = "check";

    function reasonAction() {
        $.get(`/fr/selection/reason/${encodeURIComponent(action)}`, { erp: currentErp, reason: reason }, function (data) {
            if (data.selected === true)
            {
                $(`#selected-${entry.erp}`).prop('checked', true);
            }
            if (data.selected === false)
            {
                $(`#selected-${entry.erp}`).prop('checked', false);
            }
        });
    }
});