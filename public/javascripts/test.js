$(document).ready(function () {
    let page = 1;
    let revenuePreselection = 0;
    let intensityPreselection = 1;
    // Filters
    let selected = false;
    let notSelected = false;
    let reason1Selected = false;
    let reason1NotSelected = false;
    let reason2Selected = false;
    let reason2NotSelected = false;
    let reason3Selected = false;
    let reason3NotSelected = false;
    let reason4Selected = false;
    let reason4NotSelected = false;
    let revenueSign = ">";
    let revenue = 0;
    let intensity0 = false;
    let intensity1 = false;
    let intensity2 = false;
    let intensity3 = false;
    let intensity4 = false;
    // Search
    let supplier = '';
    // Sort
    let sortField = '';
    let sortOrder = 'asc';

    // preselection Timeout
    let timeout = null;
    // Tick Reason
    let currentErp = "";
    let reason = "";
    let action = "check";

    // Comment
    let comment = "";

    // Force
    let forceBool = true;
    // Slide and Revenue values
    //var $slider = $('#revenue-slider');
    var $filterRevenue = $('#filter-revenue');

    function preselect() {
        $.post(`/${currentLang}/selection/preselection`, { revenue: revenuePreselection, intensity: intensityPreselection }, function (data) {
            resetAndLoad();
        });
    }

    function reasonAction() {
        $.post(`/${currentLang}/selection/reason/${encodeURIComponent(action)}`, { erp: currentErp, reason: reason, comment: comment }, function (data) {
            if (data.selected === true) {
                $(`#selected-${currentErp}`).prop('checked', true);
                $(`#comment-${currentErp}`).text(comment);
            }
            if (data.selected === false) {
                $(`#selected-${currentErp}`).prop('checked', false);
            }
        });
    }

    function sendComment() {
        $.post(`/${currentLang}/selection/comment`, { erp: currentErp, comment: comment }, function (data) {
            if (data.status === 200) {
                $(`#comment-${currentErp}`).text(comment);
            }
        });
    }

    function forceSelection() {
        $.post(`/${currentLang}/selection/force`, { forceBool: forceBool, erp: currentErp, comment: comment }, function (data) {
            if (data.status === 200) {
                $(`#comment-${currentErp}`).text(comment);
            }
        });
    }

    function loadHistory() {
        $.get(`/${currentLang}/selection/history`, { erp: currentErp }, function (data) {
            $('#history-table tbody').empty();
            data.forEach(entry => {
                $('#history-table tbody').append(`
                 <tr>
                    <td>${entry.year}</td>
                    <td><input type="checkbox" ${entry.selected ? 'checked' : ''} disabled ></td>
                    <td>${entry.name}</td>
                    <td>${entry.intensity}</td>
                    <td><input type="checkbox" ${entry.reason1 ? 'checked' : ''} disabled ></td>
                    <td><input type="checkbox" ${entry.reason2 ? 'checked' : ''} disabled ></td>
                    <td><input type="checkbox" ${entry.reason3 ? 'checked' : ''} disabled ></td>
                    <td><input type="checkbox" ${entry.reason4 ? 'checked' : ''} disabled ></td>
                    <td>${entry.comment}</td>
                </tr>
                `)
            })
        });
    }
    function loadData() {
        $.get(`/${currentLang}/selection/data`, { page, selected, notSelected, reason1Selected, reason1NotSelected, reason2Selected, reason2NotSelected, reason3Selected, reason3NotSelected, reason4Selected, reason4NotSelected, supplier, revenueSign, revenue, intensity0, intensity1, intensity2, intensity3, intensity4, sortField, sortOrder }, function (data) {
            if (page === 1) {
                $('#data-table tbody').empty();
            }
            data.forEach(entry => {
                $('#data-table tbody').append(`
            <tr>
            <td><input id="selected-${entry.erp}" type="checkbox" ${entry.selected ? 'checked' : ''}></td>
            <td>${entry.supplier}</td>
            <td>${Intl.NumberFormat().format(entry.revenue)}</td>
            <td class="intensity${entry.intensityCode}" data-intensityCode="${entry.intensityCode}">${entry.intensity}</td>
            <td><input id="reason1-${entry.erp}" type="checkbox" ${entry.reason1 ? 'checked' : ''}></td>
            <td><input id="reason2-${entry.erp}" type="checkbox" ${entry.reason2 ? 'checked' : ''}></td>
            <td><input id="reason3-${entry.erp}" type="checkbox" ${entry.reason3 ? 'checked' : ''}></td>
            <td><input id="reason4-${entry.erp}" type="checkbox" ${entry.reason4 ? 'checked' : ''}></td>
            <td id="comment-${entry.erp}" class="cursorPointer" title="${entry.comment ? entry.comment : ''}">${entry.comment ? entry.comment : ''}</td>
            <td id="history-${entry.erp}"><span>...</td>
            </tr>`);
                for (let i = 1; i <= 4; i++) {
                    $(`#reason${i}-${entry.erp}`).on('change', function () {
                        currentErp = entry.erp;
                        $(`#reason-comment`).val($(`#comment-${entry.erp}`).text());
                        reason = `reason${i}`
                        if ($(this).is(':checked')) {
                            action = "check"
                        } else {
                            action = "uncheck"
                        }
                        //location.hash = '#checkReasonPopup';
                        $(`#checkReasonPopup`).toggleClass("active");
                        //reasonAction()
                    });

                }
                $(`#comment-${entry.erp}`).click(function () {
                    $(`#newCommentPopup`).toggleClass("active");
                    $(`#comment`).val($(`#comment-${entry.erp}`).text());
                    currentErp = entry.erp;
                });
                $(`#selected-${entry.erp}`).click(function () {
                    //location.hash = '#addForcePopup';
                    $(`#addForcePopup`).toggleClass("active");
                    forceBool = false;
                    if ($(`#selected-${entry.erp}`).is(':checked')) {
                        forceBool = true;
                    }
                    $(`#force-comment`).val($(`#comment-${entry.erp}`).text());
                    currentErp = entry.erp;
                });
                $(`#history-${entry.erp}`).click(function () {
                    currentErp = entry.erp;
                    loadHistory();
                    //location.hash = '#viewHistoryPopup';
                    $(`#viewHistoryPopup`).toggleClass("active");
                });
            });
        });
    }

    function resetAndLoad() {
        page = 1;
        loadData();
    }

    $('#load-more').click(function () {
        page++;
        loadData();
    });

    function handlePreselectionChange() {
        clearTimeout(timeout); // Clear the previous timeout

        // Set a new timeout
        timeout = setTimeout(() => {
            revenuePreselection = $('#revenue-input').val();
            intensityPreselection = $('#intensity-input option:selected').data('code');
            preselect();
            // You can put your custom logic here
        }, 1000); // 1000ms = 1 second
    }

    $('#revenue-input').on('input', function () {
        handlePreselectionChange();
    });

    $('#intensity-input').on('input', function () {
        revenuePreselection = $('#revenue-input').val();
        intensityPreselection = $('#intensity-input option:selected').data('code');
        preselect();
    });

    $('#filter-selected').click(function () {
        selected = !selected
        $(this).toggleClass('active');
        if (selected === true && notSelected === true) {
            notSelected = !notSelected
            $('#filter-not-selected').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-not-selected').click(function () {
        notSelected = !notSelected
        $(this).toggleClass('active');
        if (selected === true && notSelected === true) {
            selected = !selected
            $('#filter-selected').toggleClass('active');
        }
        resetAndLoad();
    });

    $('#filter-reason1').click(function () {
        reason1Selected = !reason1Selected
        $(this).toggleClass('active');
        if (reason1Selected === true && reason1NotSelected === true) {
            reason1NotSelected = !reason1NotSelected
            $('#filter-not-reason1').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-not-reason1').click(function () {
        reason1NotSelected = !reason1NotSelected
        $(this).toggleClass('active');
        if (reason1Selected === true && reason1NotSelected === true) {
            reason1Selected = !reason1Selected
            $('#filter-reason1').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-reason2').click(function () {
        reason2Selected = !reason2Selected
        $(this).toggleClass('active');
        if (reason2Selected === true && reason2NotSelected === true) {
            reason2NotSelected = !reason2NotSelected
            $('#filter-not-reason2').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-not-reason2').click(function () {
        reason2NotSelected = !reason2NotSelected
        $(this).toggleClass('active');
        if (reason2Selected === true && reason2NotSelected === true) {
            reason2Selected = !reason2Selected
            $('#filter-reason2').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-reason3').click(function () {
        reason3Selected = !reason3Selected
        $(this).toggleClass('active');
        if (reason3Selected === true && reason3NotSelected === true) {
            reason3NotSelected = !reason3NotSelected
            $('#filter-not-reason3').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-not-reason3').click(function () {
        reason3NotSelected = !reason3NotSelected
        $(this).toggleClass('active');
        if (reason3Selected === true && reason3NotSelected === true) {
            reason3Selected = !reason3Selected
            $('#filter-reason3').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-reason4').click(function () {
        reason4Selected = !reason4Selected
        $(this).toggleClass('active');
        if (reason4Selected === true && reason4NotSelected === true) {
            reason4NotSelected = !reason4NotSelected
            $('#filter-not-reason4').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-not-reason4').click(function () {
        reason4NotSelected = !reason4NotSelected
        $(this).toggleClass('active');
        if (reason4Selected === true && reason4NotSelected === true) {
            reason4Selected = !reason4Selected
            $('#filter-reason4').toggleClass('active');
        }
        resetAndLoad();
    });

    $('#search-supplier').on('keydown', function (event) {
        // Check if the pressed key is Enter (key code 13)
        if (event.which === 13) {
            // Prevent the default action (optional)
            event.preventDefault();
            supplier = $(this).val();
            resetAndLoad();
        }
    });


    $('#sort-supplier').click(function () {
        sortField = 'supplier';
        sortOrder = $(this).data('sort');
        resetAndLoad();
        $(this).data('sort', sortOrder === 'asc' ? 'desc' : 'asc');
    });
    $('#filter-revenue-sign').click(function () {
        var currentText = $(this).text().trim();
        if (currentText === '>') {
            $(this).text('<');
        } else {
            $(this).text('>');
        }
        revenueSign = $(this).text();
        resetAndLoad();
    });
    $('#filter-revenue').on('keydown', function (event) {
        // Check if the pressed key is Enter (key code 13)
        if (event.which === 13) {
            revenue = $(this).val();
            resetAndLoad();
        }
    });
    /*
    $('#revenue-slider').on('input', function () {
        revenue = $(this).val();
        resetAndLoad();
    });
    */
    $('#sort-revenue').click(function () {
        sortField = 'revenue';
        sortOrder = $(this).data('sort');
        resetAndLoad();
        $(this).data('sort', sortOrder === 'asc' ? 'desc' : 'asc');
    });



    $('#filter-intensity0').click(function () {
        intensity0 = !intensity0
        $(this).toggleClass('active');
        if (intensity0 && intensity1 && intensity2 && intensity3 && intensity4) {
            intensity0 = false
            intensity1 = false
            intensity2 = false
            intensity3 = false
            intensity4 = false
            $('#filter-intensity0').toggleClass('active');
            $('#filter-intensity1').toggleClass('active');
            $('#filter-intensity2').toggleClass('active');
            $('#filter-intensity3').toggleClass('active');
            $('#filter-intensity4').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-intensity1').click(function () {
        intensity1 = !intensity1
        $(this).toggleClass('active');
        if (intensity0 && intensity1 && intensity2 && intensity3 && intensity4) {
            intensity0 = false
            intensity1 = false
            intensity2 = false
            intensity3 = false
            intensity4 = false
            $('#filter-intensity0').toggleClass('active');
            $('#filter-intensity1').toggleClass('active');
            $('#filter-intensity2').toggleClass('active');
            $('#filter-intensity3').toggleClass('active');
            $('#filter-intensity4').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-intensity2').click(function () {
        intensity2 = !intensity2
        $(this).toggleClass('active');
        if (intensity0 && intensity1 && intensity2 && intensity3 && intensity4) {
            intensity0 = false
            intensity1 = false
            intensity2 = false
            intensity3 = false
            intensity4 = false
            $('#filter-intensity0').toggleClass('active');
            $('#filter-intensity1').toggleClass('active');
            $('#filter-intensity2').toggleClass('active');
            $('#filter-intensity3').toggleClass('active');
            $('#filter-intensity4').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-intensity3').click(function () {
        intensity3 = !intensity3
        $(this).toggleClass('active');
        if (intensity0 && intensity1 && intensity2 && intensity3 && intensity4) {
            intensity0 = false
            intensity1 = false
            intensity2 = false
            intensity3 = false
            intensity4 = false
            $('#filter-intensity0').toggleClass('active');
            $('#filter-intensity1').toggleClass('active');
            $('#filter-intensity2').toggleClass('active');
            $('#filter-intensity3').toggleClass('active');
            $('#filter-intensity4').toggleClass('active');
        }
        resetAndLoad();
    });
    $('#filter-intensity4').click(function () {
        intensity4 = !intensity4
        $(this).toggleClass('active');
        if (intensity0 && intensity1 && intensity2 && intensity3 && intensity4) {
            intensity0 = false
            intensity1 = false
            intensity2 = false
            intensity3 = false
            intensity4 = false
            $('#filter-intensity0').toggleClass('active');
            $('#filter-intensity1').toggleClass('active');
            $('#filter-intensity2').toggleClass('active');
            $('#filter-intensity3').toggleClass('active');
            $('#filter-intensity4').toggleClass('active');
        }
        resetAndLoad();
    });



    /*
    // Function to synchronize slider and text input
    function updateSliderFromInput() {
        var value = parseInt($filterRevenue.val(), 10);
        if (!value) {
            value = 0;
        }
        // Ensure value is within the slider's range
        if (isNaN(value) || value < $slider.attr('min')) {
            value = $slider.val(); // Reset to slider value if input is invalid
        }
        $slider.val(value);
        revenue = value;
    }
    
    function updateInputFromSlider() {
        $filterRevenue.val($slider.val());
        revenue = $slider.val();
    }
    
    // Initial synchronization
    updateSliderFromInput();
    
    // Event handler for slider input
    $slider.on('input', function () {
        updateInputFromSlider();
    });
    
    // Event handler for text input
    $filterRevenue.on('input', function () {
        updateSliderFromInput();
    });
    */

    $('#cancel-history').click(function () {
        $(`#viewHistoryPopup`).toggleClass("active");
    });
    $('#cancel-comment').click(function () {
        $(`#newCommentPopup`).toggleClass("active");
    });
    $('#submit-comment').click(function () {
        comment = $('#comment').val();
        sendComment();
        $(`#newCommentPopup`).toggleClass("active");
    });
    $('#cancel-force').click(function () {
        const checkbox = $(`#selected-${currentErp}`);
        checkbox.prop('checked', !checkbox.prop('checked'));
        //location.hash = '#';
        $(`#addForcePopup`).toggleClass("active");
    });
    $('#submit-force').click(function () {
        comment = $('#force-comment').val();
        forceSelection();
        $(`#addForcePopup`).toggleClass("active");
        //location.hash = '#';
    });
    $('#cancel-reason').click(function () {
        const checkbox = $(`#${reason}-${currentErp}`);
        checkbox.prop('checked', !checkbox.prop('checked'));
        //location.hash = '#';
        $(`#checkReasonPopup`).toggleClass("active");
    });
    $('#submit-reason').click(function () {
        comment = $('#reason-comment').val();
        reasonAction();
        //location.hash = '#';
        $(`#checkReasonPopup`).toggleClass("active");
    });

    loadData();
});
